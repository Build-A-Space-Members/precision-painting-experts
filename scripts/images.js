// Generates responsive WebP + JPEG variants and the favicon set from assets/.
// Run with `npm run images` after adding or replacing an original photo.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'assets', 'originals');
const outDir = path.join(root, 'public', 'img');
const WIDTHS = [480, 800, 1280, 1920];

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const manifest = {};
  for (const file of fs.readdirSync(srcDir).filter((f) => /\.(jpe?g|png)$/i.test(f))) {
    const name = file.replace(/\.[^.]+$/, '');
    const input = sharp(path.join(srcDir, file));
    const { width, height } = await input.metadata();
    const widths = WIDTHS.filter((w) => w <= width);
    for (const w of widths) {
      const resized = sharp(path.join(srcDir, file)).resize({ width: w });
      await resized.clone().webp({ quality: 72 }).toFile(path.join(outDir, `${name}-${w}.webp`));
      await resized.clone().jpeg({ quality: 76, mozjpeg: true }).toFile(path.join(outDir, `${name}-${w}.jpg`));
    }
    manifest[name] = { width, height, widths };
  }
  fs.writeFileSync(path.join(root, 'src', 'data', 'images.json'), JSON.stringify(manifest, null, 2));

  const svg = fs.readFileSync(path.join(root, 'public', 'favicon.svg'));
  await sharp(svg).resize(32, 32).png().toFile(path.join(root, 'public', 'favicon-32.png'));
  await sharp(svg).resize(180, 180).png().toFile(path.join(root, 'public', 'apple-touch-icon.png'));
  await sharp(svg).resize(512, 512).png().toFile(path.join(root, 'public', 'icon-512.png'));
  console.log('images:', Object.keys(manifest).join(', '));
}

main().catch((e) => { console.error(e); process.exit(1); });
