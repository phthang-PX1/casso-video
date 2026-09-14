// Merges whisper.cpp's token-level (BPE sub-word) output from
// metadata/whisper/card_*.json into word-level timestamps (a token starting
// with a leading space begins a new word — whisper.cpp/GPT-2-BPE convention),
// then re-attaches the ORIGINAL, known-correct script text word-by-word
// (zipped by position) instead of trusting whisper's own recognized spelling.
// Rationale: this is a small multilingual model transcribing Vietnamese TTS
// audio — it mis-hears the occasional word (e.g. "vay" -> "vai") and also
// leaks internal tokens like "[_TT_100]" into the last word of a segment.
// Since we already know the exact text that was spoken (it's the same string
// passed to capcut-tts-api), whisper is only trusted for TIMING here, never
// for the displayed caption text. Grouped into short phrases for progressive
// on-screen reveal, then written to app/src/narrationTimestamps.ts (ms ->
// frames at FPS, offset by LEAD_FRAMES to match every card's
// <Sequence from={LEAD_FRAMES}><Audio/></Sequence>).
//
// Single source of truth for the spoken text: content/<slug>.json (the SAME
// file scripts/generate_narration.py reads) — there is no separate copy of
// the script here anymore. Run: node app/scripts/gen-timestamps.cjs [slug]
// [--allow-mismatch]
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const REPO_ROOT = path.join(__dirname, "..", "..");
const WHISPER_DIR = path.join(REPO_ROOT, "metadata", "whisper");
const AUDIO_DIR = path.join(REPO_ROOT, "app", "public", "audio");
const OUT_PATH = path.join(__dirname, "..", "src", "narrationTimestamps.ts");
const FFPROBE = path.join(REPO_ROOT, "app", "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffprobe.exe");

const FPS = 30;
const LEAD_FRAMES = 10;
const PHRASE_MAX_WORDS = 4;
const PHRASE_MAX_MS = 1500;

const args = process.argv.slice(2);
const allowMismatch = args.includes("--allow-mismatch");
const slug = args.find((a) => !a.startsWith("--")) || "tin-dung-la-gi";

const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "content", `${slug}.json`), "utf8"));
const ORIGINAL_TEXT = Object.fromEntries(manifest.cards.map((c) => [c.id, c.text]));

function mergeWhisperWords(json) {
  const words = [];
  let current = null;
  for (const segment of json.transcription) {
    for (const token of segment.tokens) {
      const cleaned = token.text.replace(/\[_[^\]]*\]/g, "");
      if (!cleaned.trim()) continue;
      const isNewWord = cleaned.startsWith(" ") || current === null;
      const text = cleaned.trim();
      if (isNewWord) {
        if (current) words.push(current);
        current = { startMs: token.offsets.from, endMs: token.offsets.to };
      } else if (current) {
        current.endMs = token.offsets.to;
      }
    }
  }
  if (current) words.push(current);
  return words;
}

function msToFrame(ms) {
  return LEAD_FRAMES + Math.round((ms / 1000) * FPS);
}

function groupPhrases(words) {
  const phrases = [];
  let bucket = [];
  const flush = () => {
    if (bucket.length === 0) return;
    phrases.push({
      text: bucket.map((w) => w.text).join(" "),
      startMs: bucket[0].startMs,
      endMs: bucket[bucket.length - 1].endMs,
    });
    bucket = [];
  };
  for (const word of words) {
    const wouldSpan = bucket.length > 0 ? word.endMs - bucket[0].startMs : 0;
    if (bucket.length >= PHRASE_MAX_WORDS || wouldSpan > PHRASE_MAX_MS) flush();
    bucket.push(word);
  }
  flush();
  return phrases;
}

function measureMediaSeconds(mp3Path) {
  if (!fs.existsSync(FFPROBE)) throw new Error(`ffprobe not found at ${FFPROBE} — install app/ dependencies first`);
  const out = execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "json", mp3Path], {
    encoding: "utf8",
  });
  return JSON.parse(out).format.duration;
}

const cardFiles = fs
  .readdirSync(WHISPER_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();

let hadFatalMismatch = false;
const result = {};
for (const file of cardFiles) {
  const cardId = file.replace(/\.json$/, "");
  if (!(cardId in ORIGINAL_TEXT)) {
    console.warn(`[${cardId}] has a whisper transcript but no entry in content/${slug}.json — skipping (stale card?).`);
    continue;
  }
  const json = JSON.parse(fs.readFileSync(path.join(WHISPER_DIR, file), "utf8"));
  const whisperWords = mergeWhisperWords(json);
  const originalWords = (ORIGINAL_TEXT[cardId] ?? "").split(/\s+/).filter(Boolean);

  if (whisperWords.length !== originalWords.length) {
    const msg = `[${cardId}] word count mismatch: whisper=${whisperWords.length} original=${originalWords.length} — alignment is unreliable, timing will drift near the end of the card.`;
    if (allowMismatch) {
      console.warn(msg + " (continuing: --allow-mismatch)");
    } else {
      console.error(msg + " Re-run with --allow-mismatch to proceed anyway, but fix the manifest/audio first.");
      hadFatalMismatch = true;
      continue;
    }
  }
  const n = Math.min(whisperWords.length, originalWords.length) || originalWords.length;
  const words = originalWords.slice(0, n).map((text, i) => ({
    text,
    startMs: whisperWords[i]?.startMs ?? 0,
    endMs: whisperWords[i]?.endMs ?? 0,
  }));
  for (let i = n; i < originalWords.length; i++) {
    const prevEnd = words[words.length - 1]?.endMs ?? 0;
    words.push({ text: originalWords[i], startMs: prevEnd, endMs: prevEnd + 200 });
  }

  const zeroDurationWords = words.filter((w) => w.endMs <= w.startMs);
  if (zeroDurationWords.length) {
    console.warn(
      `[${cardId}] ${zeroDurationWords.length} word(s) with 0-frame duration (whisper couldn't separate them): ${zeroDurationWords
        .map((w) => w.text)
        .join(", ")}`
    );
  }

  const phrases = groupPhrases(words);
  const speechEndFrame = words.length ? msToFrame(words[words.length - 1].endMs) : LEAD_FRAMES;

  const mp3Path = path.join(AUDIO_DIR, `${cardId}.mp3`);
  const mediaDurationFrames = fs.existsSync(mp3Path)
    ? LEAD_FRAMES + Math.round(measureMediaSeconds(mp3Path) * FPS)
    : speechEndFrame;

  result[cardId] = {
    words: words.map((w) => ({ text: w.text, startFrame: msToFrame(w.startMs), endFrame: msToFrame(w.endMs) })),
    phrases: phrases.map((p) => ({ text: p.text, startFrame: msToFrame(p.startMs), endFrame: msToFrame(p.endMs) })),
    // speechEndFrame: frame of the end of the LAST WORD per whisper — use this
    // for content decisions ("start the next beat once the sentence lands").
    speechEndFrame,
    // mediaDurationFrames: frame of the end of the ACTUAL AUDIO FILE per
    // ffprobe — use this to cap <Sequence durationInFrames> for the <Audio>,
    // never speechEndFrame (the file is usually a bit longer, with trailing
    // room-tone/silence after the last recognized word).
    mediaDurationFrames,
    // Deprecated alias kept for older call sites; identical to speechEndFrame.
    // New code should read speechEndFrame/mediaDurationFrames explicitly.
    audioDurationFrames: speechEndFrame,
  };
}

if (hadFatalMismatch) {
  console.error("\nAborting: one or more cards have a word-count mismatch. Fix content/<slug>.json or re-transcribe, or pass --allow-mismatch to proceed anyway.");
  process.exit(1);
}

const content = `// AUTO-GENERATED by app/scripts/gen-timestamps.cjs from metadata/whisper/*.json
// and content/${slug}.json. Do not edit by hand — re-run the script after
// regenerating narration audio.
export type Word = { text: string; startFrame: number; endFrame: number };
export type Phrase = { text: string; startFrame: number; endFrame: number };
export type NarrationTiming = {
  words: Word[];
  phrases: Phrase[];
  /** Frame at which the last recognized word ends (whisper-timed). Use for content pacing decisions. */
  speechEndFrame: number;
  /** Frame at which the actual audio FILE ends (ffprobe-measured). Use to cap <Sequence durationInFrames> for <Audio>. */
  mediaDurationFrames: number;
  /** @deprecated identical to speechEndFrame — kept for older call sites. */
  audioDurationFrames: number;
};

export const NARRATION: Record<string, NarrationTiming> = ${JSON.stringify(result, null, 2)} as const;

/** First word in cardId whose text includes 'substring' (case-insensitive). Pass 'occurrence' (0-based) to pick a later match when the word repeats. */
export function findWord(cardId: string, substring: string, occurrence = 0): Word | undefined {
  const lower = substring.toLowerCase();
  const matches = NARRATION[cardId]?.words.filter((w) => w.text.toLowerCase().includes(lower)) ?? [];
  return matches[occurrence];
}

/** Same as findWord, but throws instead of silently returning undefined — use this for any cue whose absence would visibly break the card (an arrow with no target frame, a missing animation trigger), so a wording change surfaces as a build error instead of a silent no-op. */
export function requireWord(cardId: string, substring: string, occurrence = 0): Word {
  const word = findWord(cardId, substring, occurrence);
  if (!word) {
    throw new Error(\`requireWord("\${cardId}", "\${substring}", \${occurrence}) found no match — did the script wording change? Check content/${slug}.json.\`);
  }
  return word;
}
`;

fs.writeFileSync(OUT_PATH, content, "utf8");
console.log(`Wrote timing for ${Object.keys(result).length} cards to ${OUT_PATH}`);
