// Transcribe a single card (used for card_3b, added after the initial batch).
import { transcribe } from "@remotion/install-whisper-cpp";
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
const FFMPEG = path.join(APP_ROOT, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe");

const cardId = process.argv[2];
if (!cardId) {
  console.error("Usage: node transcribe-one.mjs <cardId>");
  process.exit(1);
}

const mp3Path = path.join(APP_ROOT, "public", "audio", `${cardId}.mp3`);
const wavPath = path.join(APP_ROOT, ".tmp-wav", `${cardId}.wav`);
fs.mkdirSync(path.dirname(wavPath), { recursive: true });
execFileSync(FFMPEG, ["-y", "-i", mp3Path, "-ar", "16000", "-ac", "1", wavPath], { stdio: "inherit" });

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

const outPath = path.join(REPO_ROOT, "metadata", "whisper", `${cardId}.json`);
fs.writeFileSync(outPath, JSON.stringify(json, null, 2), "utf8");
console.log(`saved ${outPath}`);
