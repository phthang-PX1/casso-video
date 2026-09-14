// One-off: install whisper.cpp + a multilingual model, convert each card_N.mp3
// (app/public/audio/) to 16kHz mono WAV via the ffmpeg bundled with Remotion's
// compositor, transcribe with word-level timestamps, and write the JSON to
// metadata/whisper/card_N.json. Real word-boundary sync for animation timing,
// replacing the manually-guessed frame schedule from the first render.
//
// Run from app/: node scripts/transcribe-narration.mjs
import { installWhisperCpp, downloadWhisperModel, transcribe } from "@remotion/install-whisper-cpp";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(__dirname, "..");
const REPO_ROOT = path.join(APP_ROOT, "..");
const WHISPER_PATH = path.join(APP_ROOT, ".whisper");
const WHISPER_VERSION = "1.7.6";
const MODEL = "small";
const FFMPEG = path.join(
  APP_ROOT,
  "node_modules",
  "@remotion",
  "compositor-win32-x64-msvc",
  "ffmpeg.exe"
);
const AUDIO_DIR = path.join(APP_ROOT, "public", "audio");
const OUT_DIR = path.join(REPO_ROOT, "metadata", "whisper");
const TMP_WAV_DIR = path.join(APP_ROOT, ".tmp-wav");

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(TMP_WAV_DIR, { recursive: true });

  console.log("Installing whisper.cpp...");
  await installWhisperCpp({ to: WHISPER_PATH, version: WHISPER_VERSION, printOutput: true });

  console.log(`Downloading model "${MODEL}"...`);
  await downloadWhisperModel({ model: MODEL, folder: WHISPER_PATH, printOutput: true });

  const files = fs
    .readdirSync(AUDIO_DIR)
    .filter((f) => f.endsWith(".mp3"))
    .sort();

  for (const file of files) {
    const cardId = file.replace(/\.mp3$/, "");
    const mp3Path = path.join(AUDIO_DIR, file);
    const wavPath = path.join(TMP_WAV_DIR, `${cardId}.wav`);
    console.log(`Converting ${file} -> 16kHz mono WAV...`);
    execFileSync(FFMPEG, ["-y", "-i", mp3Path, "-ar", "16000", "-ac", "1", wavPath], {
      stdio: "inherit",
    });

    console.log(`Transcribing ${cardId}...`);
    const json = await transcribe({
      inputPath: wavPath,
      whisperPath: WHISPER_PATH,
      whisperCppVersion: WHISPER_VERSION,
      model: MODEL,
      modelFolder: WHISPER_PATH,
      tokenLevelTimestamps: true,
      language: "vi",
      printOutput: false,
    });

    const outPath = path.join(OUT_DIR, `${cardId}.json`);
    fs.writeFileSync(outPath, JSON.stringify(json, null, 2), "utf8");
    console.log(`  saved ${outPath}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
