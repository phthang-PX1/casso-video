"""Generate TTS narration audio for tin-dung-la-gi via capcut-tts-api.

Single source of truth for spoken text: content/<slug>.json (default slug:
tin-dung-la-gi). app/scripts/gen-timestamps.cjs reads the SAME file — do not
duplicate card text anywhere else. If you change wording, edit the manifest
only, then re-run in this order:
  1. python scripts/generate_narration.py [--card card_id] [--slug slug]
  2. node app/scripts/transcribe-one.mjs <card_id>   (per changed card)
  3. node app/scripts/gen-timestamps.cjs [slug]

Caching: each card's audio is keyed by sha256(text + voice + rate). A card is
only re-sent to the TTS API when that hash isn't already recorded in
metadata/tts_cache/index.json — unchanged cards are skipped entirely (no API
call, no cost). On first run against an existing app/public/audio/<id>.mp3
with no recorded hash yet, the existing file is trusted and adopted into the
cache instead of being silently regenerated (avoids clobbering hand-checked
audio because the cache was empty).

Works around a client.py bug: generate_speech()/CapCutClient polls for
status == "success" but the real API returns status == "succeed" for a
finished task, so the built-in wait loop always times out. This script polls
for "succeed"/"failed" directly instead of patching the vendored SDK.

Run from repo root: python scripts/generate_narration.py
Output: app/public/audio/<card_id>.mp3 + metadata/narration.json (text +
real ffprobe-measured duration per card, not a guess).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "capcut-tts-api"))

from capcut_tts_api import CapCutClient  # noqa: E402

AUDIO_DIR = ROOT / "app" / "public" / "audio"
CACHE_DIR = ROOT / "metadata" / "tts_cache"
CACHE_INDEX = CACHE_DIR / "index.json"
FFPROBE = ROOT / "app" / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffprobe.exe"
MIN_VALID_AUDIO_BYTES = 1000


def load_manifest(slug: str) -> dict:
    path = ROOT / "content" / f"{slug}.json"
    return json.loads(path.read_text(encoding="utf-8"))


def content_hash(text: str, voice: str, rate: str) -> str:
    return hashlib.sha256(f"{voice}|{rate}|{text}".encode("utf-8")).hexdigest()[:16]


def load_cache_index() -> dict:
    if CACHE_INDEX.exists():
        return json.loads(CACHE_INDEX.read_text(encoding="utf-8"))
    return {}


def save_cache_index(index: dict) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def measure_duration_sec(path: Path) -> float:
    if not FFPROBE.exists():
        raise RuntimeError(f"ffprobe not found at {FFPROBE} — install app/ dependencies first")
    out = subprocess.run(
        [str(FFPROBE), "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(json.loads(out.stdout)["format"]["duration"])


def generate_one(client: CapCutClient, text: str, voice: str, rate: str, timeout: float = 60.0) -> str:
    create_res = client.create_tts_task(texts=text, voice=voice, rate=rate)
    task = create_res["data"]["tasks"][0]
    start = time.time()
    while time.time() - start < timeout:
        query = client.query_tts_task(task["id"], task["token"])
        tasks = (query.get("data") or {}).get("tasks") or []
        if tasks:
            status = tasks[0].get("status")
            if status == "succeed":
                payload = json.loads(tasks[0]["payload"])
                return payload["audio_subtitles"][0]["speech_url"]
            if status == "failed":
                raise RuntimeError(f"TTS failed: {query}")
        time.sleep(1.0)
    raise TimeoutError(f"TTS task timed out after {timeout}s")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", default="tin-dung-la-gi")
    parser.add_argument("--card", default=None, help="Regenerate only this card id (still cache-checked)")
    parser.add_argument("--force", action="store_true", help="Ignore the cache, always call the TTS API")
    args = parser.parse_args()

    manifest = load_manifest(args.slug)
    voice = manifest["voice"]
    rate = manifest["rate"]
    # Every card has its own audio/<id>.mp3, even ones marked "embeddedIn"
    # another card in the composition graph — "embeddedIn" only means this
    # card has no top-level Series.Sequence of its own, not that it shares audio.
    cards = manifest["cards"]
    if args.card:
        cards = [c for c in cards if c["id"] == args.card]
        if not cards:
            raise SystemExit(f"No card '{args.card}' in {args.slug}.json")

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    cache_index = load_cache_index()
    client = None
    durations = {}

    for card in cards:
        card_id = card["id"]
        text = card["text"]
        out_path = AUDIO_DIR / f"{card_id}.mp3"
        h = content_hash(text, voice, rate)
        cached = cache_index.get(card_id)

        if not args.force and cached and cached["hash"] == h and out_path.exists():
            print(f"{card_id}: unchanged (cache hit), skipping API call.")
        elif not args.force and not cached and out_path.exists():
            print(f"{card_id}: no cache entry yet but audio already exists on disk — adopting it as-is (not calling API).")
            cache_index[card_id] = {"hash": h, "text": text}
        else:
            print(f"{card_id}: generating (text changed or missing)...", flush=True)
            import requests

            client = client or CapCutClient()
            url = generate_one(client, text, voice, rate)
            audio_bytes = requests.get(url, timeout=60).content
            if len(audio_bytes) < MIN_VALID_AUDIO_BYTES:
                raise RuntimeError(f"{card_id}: downloaded audio looked too small ({len(audio_bytes)} bytes) — refusing to overwrite existing file")
            out_path.write_bytes(audio_bytes)
            print(f"  saved {out_path} ({len(audio_bytes)} bytes)", flush=True)
            cache_index[card_id] = {"hash": h, "text": text}

        durations[card_id] = {"text": text, "duration_sec": round(measure_duration_sec(out_path), 3)}

    save_cache_index(cache_index)
    narration_path = ROOT / "metadata" / "narration.json"
    existing = json.loads(narration_path.read_text(encoding="utf-8")) if narration_path.exists() else {}
    existing.update(durations)
    # Drop entries for cards that no longer exist in the manifest (e.g. old card_0/card_6).
    valid_ids = {c["id"] for c in manifest["cards"]}
    existing = {k: v for k, v in existing.items() if k in valid_ids}
    narration_path.write_text(json.dumps(existing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Done.", flush=True)


if __name__ == "__main__":
    main()
