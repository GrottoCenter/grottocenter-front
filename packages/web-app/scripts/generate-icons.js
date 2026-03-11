/**
 * One-time script to generate PWA and favicon icons from the Grottocenter SVG logo.
 * Run with: node scripts/generate-icons.js
 *
 * Outputs:
 *   public/logo192.png         - 192x192, transparent bg (PWA icon)
 *   public/logo512.png         - 512x512, transparent bg (PWA icon + OG image)
 *   public/logo512-maskable.png- 512x512, white bg with safe zone (Android adaptive icon)
 *   public/apple-touch-icon.png- 180x180, white bg (iOS home screen icon)
 *   public/og-image.png        - 1200x630, transparent bg (Open Graph / social sharing)
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const PUBLIC = path.join(__dirname, '..', 'public');
const LOGO_SVG = path.join(PUBLIC, 'logo.svg');
const BRAND_WHITE = { r: 0xff, g: 0xff, b: 0xff, alpha: 1 };

async function makeTransparentIcon(size, outputPath) {
  await sharp(LOGO_SVG)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(outputPath);
  console.log(`Created: ${path.basename(outputPath)} (${size}x${size})`);
}

async function makeSolidBgIcon(canvasSize, logoPercent, outputPath) {
  // Logo will occupy `logoPercent` of the canvas (centered, preserving aspect ratio)
  const logoSize = Math.round(canvasSize * logoPercent);

  // Render logo into a square with transparent bg at `logoSize`
  const logoBuffer = await sharp(LOGO_SVG)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  // Create solid-color background canvas and composite the logo centred onto it
  const background = sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: BRAND_WHITE
    }
  });

  const offset = Math.round((canvasSize - logoSize) / 2);

  await background
    .composite([{ input: logoBuffer, top: offset, left: offset }])
    .png()
    .toFile(outputPath);

  console.log(
    `Created: ${path.basename(outputPath)} (${canvasSize}x${canvasSize}, ${Math.round(logoPercent * 100)}% logo)`
  );
}

async function makeTransparentBanner(
  width,
  height,
  logoHeightPercent,
  outputPath
) {
  // Logo size based on % of canvas height (can exceed canvas — will be centre-cropped)
  const logoSize = Math.round(height * logoHeightPercent);

  let logoBuffer = await sharp(LOGO_SVG)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  // If logo overflows the canvas, centre-crop it to fit
  const cropWidth = Math.min(logoSize, width);
  const cropHeight = Math.min(logoSize, height);
  if (cropWidth < logoSize || cropHeight < logoSize) {
    const extractLeft = Math.round((logoSize - cropWidth) / 2);
    const extractTop = Math.round((logoSize - cropHeight) / 2);
    logoBuffer = await sharp(logoBuffer)
      .extract({
        left: extractLeft,
        top: extractTop,
        width: cropWidth,
        height: cropHeight
      })
      .toBuffer();
  }

  const top = Math.round((height - cropHeight) / 2);
  const left = Math.round((width - cropWidth) / 2);

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: logoBuffer, top, left }])
    .png()
    .toFile(outputPath);

  console.log(
    `Created: ${path.basename(outputPath)} (${width}x${height}, logo ${logoSize}px)`
  );
}

async function main() {
  if (!fs.existsSync(LOGO_SVG)) {
    console.error(`SVG source not found: ${LOGO_SVG}`);
    process.exit(1);
  }

  console.log('Generating icons from', LOGO_SVG);

  // Transparent icons (for browser tab fallback and PWA standard icons)
  await makeTransparentIcon(192, path.join(PUBLIC, 'logo192.png'));
  await makeTransparentIcon(512, path.join(PUBLIC, 'logo512.png'));

  // Maskable icon: logo at 60% size, centred on white background
  // (Android adaptive icons apply a circular/rounded mask over the full 512px,
  //  so the logo must fit inside the inner 60% "safe zone")
  await makeSolidBgIcon(512, 0.6, path.join(PUBLIC, 'logo512-maskable.png'));

  // Apple touch icon: logo at 75% size on white background
  await makeSolidBgIcon(180, 0.75, path.join(PUBLIC, 'apple-touch-icon.png'));

  // OG image: 1200x630, transparent bg, logo at 130% of height
  await makeTransparentBanner(
    1200,
    630,
    1.3,
    path.join(PUBLIC, 'og-image.png')
  );

  console.log('\nAll icons generated successfully.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
