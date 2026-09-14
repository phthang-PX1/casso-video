const fs = require('fs');
const { PNG } = require('pngjs');
const a = PNG.sync.read(fs.readFileSync(process.argv[2]));
const b = PNG.sync.read(fs.readFileSync(process.argv[3]));
let diffPixels = 0;
let totalDiff = 0;
for (let i = 0; i < a.data.length; i += 4) {
  const dr = Math.abs(a.data[i] - b.data[i]);
  const dg = Math.abs(a.data[i + 1] - b.data[i + 1]);
  const db = Math.abs(a.data[i + 2] - b.data[i + 2]);
  const d = dr + dg + db;
  if (d > 6) diffPixels++;
  totalDiff += d;
}
const totalPx = a.data.length / 4;
console.log('diff pixels:', diffPixels, '/', totalPx, '=', (100 * diffPixels / totalPx).toFixed(2) + '%');
console.log('avg per-pixel diff:', (totalDiff / totalPx).toFixed(3));
