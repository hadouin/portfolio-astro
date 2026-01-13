#!/usr/bin/env node

/**
 * Script to generate Open Graph preview image for social media
 *
 * Usage:
 *   1. Start the dev server: npm run dev
 *   2. Run this script: node scripts/generate-og-image.mjs
 *
 * Or run with a custom URL:
 *   node scripts/generate-og-image.mjs http://localhost:3000
 */

import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Configuration
const CONFIG = {
  url: process.argv[2] || 'http://localhost:4321',
  outputPath: join(projectRoot, 'public', 'opengraph.jpg'),
  width: 1200,
  height: 630,
  quality: 90,
};

async function generateOgImage() {
  let puppeteer;

  try {
    puppeteer = await import('puppeteer');
  } catch {
    console.error('Error: puppeteer is not installed.');
    console.log('\nInstall it with:\n  npm install --save-dev puppeteer\n');
    console.log('Then run this script again.');
    process.exit(1);
  }

  console.log(`📸 Generating Open Graph image...`);
  console.log(`   URL: ${CONFIG.url}`);
  console.log(`   Size: ${CONFIG.width}x${CONFIG.height}`);
  console.log(`   Output: ${CONFIG.outputPath}\n`);

  const browser = await puppeteer.default.launch({
    headless: 'new',
  });

  try {
    const page = await browser.newPage();

    // Set viewport to Open Graph recommended dimensions
    await page.setViewport({
      width: CONFIG.width,
      height: CONFIG.height,
      deviceScaleFactor: 1,
    });

    // Navigate to the page
    console.log('   Loading page...');
    await page.goto(CONFIG.url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait a bit for any animations to settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Ensure output directory exists
    await mkdir(dirname(CONFIG.outputPath), { recursive: true });

    // Take screenshot
    console.log('   Taking screenshot...');
    await page.screenshot({
      path: CONFIG.outputPath,
      type: 'jpeg',
      quality: CONFIG.quality,
      clip: {
        x: 0,
        y: 0,
        width: CONFIG.width,
        height: CONFIG.height,
      },
    });

    console.log(`\n✅ Open Graph image saved to: ${CONFIG.outputPath}`);
    console.log('\nThe image will be used when sharing your site on social media.');

  } finally {
    await browser.close();
  }
}

generateOgImage().catch((error) => {
  console.error('Failed to generate Open Graph image:', error.message);
  process.exit(1);
});
