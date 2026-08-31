/* Builds public/home-glydi/hero-stage.{webp,jpg} — the home hero background.
 *
 * Source: images/heroimage-02.jpg (735x428), a screenshot of another company's
 * site. THEIR copy is baked into the pixels and none of it may ship:
 *   - a wordmark + nav across the very top, and a pill button on the RIGHT
 *     that sits over the bright light shaft (a dark patch there would show),
 *   - a headline, sub-line and two buttons over the dark left wall.
 *
 * So: crop the whole top strip away (kills the nav row and the right-hand
 * button in one move — it is plain wall/ceiling), then paint an ink scrim over
 * the left text block, feathered right and down. That region is already near
 * black, so the scrim is invisible, and it is exactly where our own headline
 * goes. The light shaft, floor and figure are never touched.
 */
import sharp from "sharp";

const SRC = "images/heroimage-02.jpg";
const OUT = "public/home-glydi/hero-stage";
const INK = { r: 10, g: 8, b: 7 };
const WIDTH = 2560;

const CROP_TOP = 44;          // removes the nav row + the right-hand pill button
const TEXT_W = 360;           // left text block: width in source px, post-crop
const TEXT_H = 200;           //                  height in source px, post-crop
const FEATHER_X = 90;
const FEATHER_Y = 80;

const meta = await sharp(SRC).metadata();

const graded = sharp(SRC)
  .extract({ left: 0, top: CROP_TOP, width: meta.width, height: meta.height - CROP_TOP })
  .resize({ width: WIDTH, kernel: "lanczos3" })
  // The source glow is far hotter than the page needs — it overpowered the
  // headline and bloomed across the whole right half. Pulled down in the grade
  // (not with a CSS overlay) so the falloff stays smooth and the file is smaller.
  .modulate({ saturation: 0.80, brightness: 0.84 })
  .linear(1.04, -24)          // deeper blacks, highlights rolled off
  .gamma(1.06)                // lifts the midtones back so the wall keeps detail
  .sharpen({ sigma: 1.0 });

const { data, info } = await graded.raw().toBuffer({ resolveWithObject: true });
const scale = info.width / meta.width;
const tw = Math.round(TEXT_W * scale);
const th = Math.round(TEXT_H * scale);
const fx = Math.round(FEATHER_X * scale);
const fy = Math.round(FEATHER_Y * scale);

const smooth = (t) => t * t * (3 - 2 * t);
const scrim = Buffer.alloc(info.width * info.height * 4);
for (let y = 0; y < info.height; y++) {
  const ay = y <= th ? 1 : y >= th + fy ? 0 : 1 - smooth((y - th) / fy);
  if (ay === 0) continue;
  for (let x = 0; x < info.width; x++) {
    const ax = x <= tw ? 1 : x >= tw + fx ? 0 : 1 - smooth((x - tw) / fx);
    if (ax === 0) continue;
    const i = (y * info.width + x) * 4;
    scrim[i] = INK.r; scrim[i + 1] = INK.g; scrim[i + 2] = INK.b;
    scrim[i + 3] = Math.round(255 * ax * ay);
  }
}

// Cinematic finish, in one pass over the pixels:
//  - vignette: gently darken toward the corners so the frame holds the eye
//    at the shaft instead of leaking off the edges,
//  - grain: a touch of monochrome noise. Large smooth gradients like this one
//    band badly once the browser resamples them; a little noise dithers the
//    steps away and reads as film rather than compression.
const VIGNETTE = 0.34;      // corner darkening at full radius
const GRAIN = 5;            // +/- levels
const cx = info.width / 2;
const cy = info.height * 0.62;          // centred on the shaft, not the frame
const maxR = Math.hypot(cx, cy);
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * info.channels;
    const r = Math.hypot(x - cx, y - cy) / maxR;
    const v = 1 - VIGNETTE * smooth(Math.min(1, Math.max(0, (r - 0.42) / 0.58)));
    const n = (Math.random() - 0.5) * 2 * GRAIN;
    for (let c = 0; c < 3; c++) {
      data[i + c] = Math.max(0, Math.min(255, data[i + c] * v + n));
    }
  }
}

const composed = sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
  .composite([{ input: scrim, raw: { width: info.width, height: info.height, channels: 4 }, blend: "over" }]);

await composed.clone().webp({ quality: 84, effort: 6 }).toFile(`${OUT}.webp`);
await composed.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(`${OUT}.jpg`);

console.log(`hero-stage: ${info.width}x${info.height} (scrim ${tw}x${th}, feather ${fx}/${fy})`);
