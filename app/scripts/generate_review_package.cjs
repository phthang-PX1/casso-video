// Builds a "review package" from a per-scene manifest (see the schema this
// script expects below) WITHOUT rendering the final MP4: one final-frame
// still per scene (animation/motion makes the last frame the most legible
// single image to judge a scene by), the actual background-sound + SFX audio
// files (so they can be played directly), and a review.md table (time range /
// narration / SFX / effects / final image).
//
// STALE as of the v6 rebuild: the old default content/scene_manifest.json
// (8 independent "1 card = 1 scene" entries) no longer matches the real
// composition — Card 1/2 and Card 3/3b are now merged, embedded scenes, so
// "one final still per top-level scene" doesn't line up with card-level
// content anymore, and several component names it listed have since been
// deleted. content/tin-dung-la-gi.json (read by scripts/generate_narration.py
// and app/scripts/gen-timestamps.cjs) is the current single source of truth
// for TEXT, but it does not carry the durationFrames/effects/sfx fields this
// script's manifest schema expects — a manifest in that fuller shape needs to
// be rebuilt against the real Series.Sequence structure in TinDungVideo.tsx
// before this script is safe to run again. Passing an explicit manifestPath
// still works if you build one by hand for a new video.
//
// Usage: node app/scripts/generate_review_package.cjs <manifestPath> [outDir]
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.resolve(__dirname, "..");
if (!process.argv[2]) {
  console.error(
    "No manifestPath given, and there is no current default (see the note at the top of this file — the old content/scene_manifest.json was stale/wrong and has been removed). Pass a manifest path explicitly: node app/scripts/generate_review_package.cjs <manifestPath> [outDir]"
  );
  process.exit(1);
}
const manifestPath = path.resolve(ROOT, process.argv[2]);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const slug = manifest.title
  .toLowerCase()
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .replace(/đ/g, "d")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "");

const outDir = path.resolve(ROOT, process.argv[3] || `review/${slug}`);
const soundDir = path.join(outDir, "sound");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(soundDir, { recursive: true });

function copyIntoSoundDir(relPath) {
  const src = path.resolve(ROOT, relPath);
  const dest = path.join(soundDir, path.basename(relPath));
  if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
  return path.relative(outDir, dest).replace(/\\/g, "/");
}

const fps = manifest.fps;
let cursor = 0;
const rows = [];

console.log(`Rendering ${manifest.scenes.length} final-frame stills (this calls remotion still per scene)...`);

for (const scene of manifest.scenes) {
  const startFrame = cursor;
  const endFrame = cursor + scene.durationFrames;
  const finalFrame = endFrame - 1;
  cursor = endFrame;

  const stillPath = path.join(outDir, `${scene.id}_final.png`);
  execFileSync(
    "npx",
    ["remotion", "still", manifest.compositionId, path.relative(APP_DIR, stillPath), `--frame=${finalFrame}`],
    { cwd: APP_DIR, stdio: "inherit", shell: true }
  );

  const sfxLines = (scene.sfx || []).map((s) => {
    const soundRel = copyIntoSoundDir(s.file);
    return `  - **${s.kind}** — ${s.timing} ([${path.basename(s.file)}](sound/${path.basename(soundRel)}))`;
  });

  rows.push({
    scene,
    startSec: (startFrame / fps).toFixed(2),
    endSec: (endFrame / fps).toFixed(2),
    stillFile: path.basename(stillPath),
    sfxLines,
  });
}

const bgSoundRel = copyIntoSoundDir(manifest.backgroundSound.file);

const md = [];
md.push(`# Review package — "${manifest.title}" (${manifest.version})`);
md.push("");
md.push(
  `Chưa export MP4 — đây là gói xem trước để duyệt/góp ý: âm thanh nền, và mỗi cảnh gồm mốc thời gian / lời đọc / ảnh cuối cảnh (khung hình cuối, dễ hình dung nhất vì cảnh có animation) / SFX / mô tả hiệu ứng.`
);
md.push("");
md.push(`## Âm thanh nền toàn video`);
md.push(
  `[${path.basename(manifest.backgroundSound.file)}](${bgSoundRel}) — loop, ${manifest.backgroundSound.volumeRelativeDb}dB tương đối. ${manifest.backgroundSound.description}`
);
if (manifest.backgroundSound.isRealMusic === false) {
  md.push(`> ⚠️ ${manifest.backgroundSound.note}`);
}
md.push("");
md.push(`## Danh sách cảnh`);
md.push("");

for (const r of rows) {
  const s = r.scene;
  md.push(`### ${s.id} — ${s.title} (${r.startSec}s – ${r.endSec}s)`);
  md.push("");
  md.push(`![${s.id} final frame](${r.stillFile})`);
  md.push("");
  md.push(`**Lời đọc:** ${s.narration}`);
  md.push("");
  md.push(`**Hình ảnh / bố cục:** ${s.visualDescription}`);
  if (s.illustration) {
    md.push("");
    md.push(`**Illustration:** \`${s.illustration.source}\` → \`${s.illustration.component}\``);
  }
  md.push("");
  md.push(`**Hiệu ứng:** ${s.effects.join("; ")}`);
  md.push("");
  md.push(`**SFX:**`);
  md.push(...(r.sfxLines.length ? r.sfxLines : ["  - (không có)"]));
  if (s.dataDisclaimer) {
    md.push("");
    md.push(`> ⚠️ ${s.dataDisclaimer}`);
  }
  md.push("");
  md.push("---");
  md.push("");
}

md.push(`## Cách góp ý (xem chi tiết ở SKILL video-review-workflow)`);
md.push(
  `- **Sound**: thay file trực tiếp, hoặc mô tả không khí mong muốn để tự tìm trong kho.`
);
md.push(`- **Script**: sửa thẳng câu lời đọc, hoặc mô tả ý muốn đổi.`);
md.push(
  `- **Image cuối cảnh**: upload ảnh mẫu + mô tả thay đổi — có thể đổi cả asset/illustration bên trong, không chỉ nền.`
);
md.push(`- **SFX**: đổi thẳng hoặc mô tả loại âm thanh muốn tìm.`);
md.push(`Chỉ cần nói rõ "Cảnh <id>: đổi <mục> thành ..." — không cần gửi lại cả file.`);

fs.writeFileSync(path.join(outDir, "review.md"), md.join("\n"));
fs.copyFileSync(manifestPath, path.join(outDir, "scene_manifest.json"));

console.log(`\nDone. Review package at: ${outDir}`);
console.log(`- review.md`);
console.log(`- ${rows.length} final-frame stills`);
console.log(`- sound/ (${fs.readdirSync(soundDir).length} files)`);
