import sharp from "sharp";
import { fileURLToPath } from "node:url";

const input = fileURLToPath(new URL("../src/assets/hadouin-hero.jpg", import.meta.url));
const output = fileURLToPath(new URL("../src/assets/hadouin-hero-edges.webp", import.meta.url));
const targetWidth = 1600;

const { data, info } = await sharp(input)
  .resize({ width: targetWidth })
  .greyscale()
  .blur(0.55)
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const edgeMap = Buffer.alloc(width * height * 4);
const sample = (x, y) => data[(y * width + x) * channels];
const clamp = (value, minimum, maximum) =>
  Math.min(Math.max(value, minimum), maximum);

for (let y = 1; y < height - 1; y += 1) {
  for (let x = 1; x < width - 1; x += 1) {
    const topLeft = sample(x - 1, y - 1);
    const top = sample(x, y - 1);
    const topRight = sample(x + 1, y - 1);
    const left = sample(x - 1, y);
    const right = sample(x + 1, y);
    const bottomLeft = sample(x - 1, y + 1);
    const bottom = sample(x, y + 1);
    const bottomRight = sample(x + 1, y + 1);

    const gradientX =
      -topLeft + topRight - 2 * left + 2 * right - bottomLeft + bottomRight;
    const gradientY =
      -topLeft - 2 * top - topRight + bottomLeft + 2 * bottom + bottomRight;
    const magnitude = Math.hypot(gradientX, gradientY);
    const normalized = clamp((magnitude - 16) / 80, 0, 1);
    const strength = normalized * normalized * (3 - 2 * normalized);
    const pixel = (y * width + x) * 4;

    edgeMap[pixel] = 255;
    edgeMap[pixel + 1] = 255;
    edgeMap[pixel + 2] = 255;
    edgeMap[pixel + 3] = Math.round(strength * 255);
  }
}

await sharp(edgeMap, {
  raw: { width, height, channels: 4 },
})
  .webp({ quality: 78, alphaQuality: 72, smartSubsample: true, effort: 6 })
  .toFile(output);

console.log(`Generated ${width}x${height} edge map at ${output}`);
