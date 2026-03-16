#!/usr/bin/env node
/**
 * Scrape photos from an existing fishing guide website
 *
 * Usage:
 *   node scripts/scrape-photos.js https://www.example-fishing-guide.com
 *   node scripts/scrape-photos.js   # Uses config.json sourceWebsite
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const SITE_URL = process.argv[2] || config.scrape?.sourceWebsite;
const OUTPUT = path.join(ROOT, 'images');

if (!SITE_URL) {
  console.error('Usage: node scripts/scrape-photos.js <website-url>');
  console.error('  Or set scrape.sourceWebsite in config.json');
  process.exit(1);
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, filepath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const file = fs.createWriteStream(filepath);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function scrapePage(page, url, allImages) {
  console.log(`  Scraping: ${url}`);
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) {
    console.log(`    Timeout, continuing...`);
  }
  await sleep(2000);

  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  for (let pos = 0; pos < scrollHeight; pos += 500) {
    await page.evaluate(y => window.scrollTo(0, y), pos);
    await sleep(200);
  }
  await sleep(1000);

  const images = await page.evaluate(() => {
    const imgs = new Set();
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.dataset?.src || '';
      if (src && src.startsWith('http') && !src.includes('data:image') && !src.includes('.svg')) imgs.add(src);
    });
    document.querySelectorAll('*').forEach(el => {
      const bg = getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none') {
        const matches = bg.matchAll(/url\(["']?(https?:\/\/[^"')]+)/g);
        for (const m of matches) if (!m[1].includes('.svg')) imgs.add(m[1]);
      }
    });
    return [...imgs];
  });

  images.forEach(img => allImages.add(img));
  console.log(`    Found ${images.length} images (total: ${allImages.size})`);
}

async function main() {
  if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT, { recursive: true });

  console.log(`\n📸 Scraping photos from: ${SITE_URL}\n`);

  // Find Puppeteer Chrome
  const possiblePaths = [
    'C:/Users/admin/.cache/puppeteer/chrome-headless-shell/win64-146.0.7680.76/chrome-headless-shell-win64/chrome-headless-shell.exe',
    'C:/Users/admin/.cache/puppeteer/chrome-headless-shell/win64-145.0.7632.77/chrome-headless-shell-win64/chrome-headless-shell.exe',
  ];
  let execPath = possiblePaths.find(p => fs.existsSync(p));

  const browser = await puppeteer.launch({
    headless: 'shell',
    ...(execPath ? { executablePath: execPath } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    timeout: 30000
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const allImages = new Set();

  // Get all pages from the site
  await page.goto(SITE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);
  const siteLinks = await page.evaluate((base) => {
    const links = new Set();
    document.querySelectorAll('a[href]').forEach(a => {
      if (a.href.startsWith(base) && !a.href.includes('#')) links.add(a.href);
    });
    return [...links];
  }, SITE_URL);

  const allPages = [SITE_URL, ...siteLinks.filter(l => !l.includes('cart') && !l.includes('product-page'))];
  console.log(`Found ${allPages.length} pages to scrape\n`);

  for (const pageUrl of allPages) {
    await scrapePage(page, pageUrl, allImages);
  }

  await browser.close();

  // Filter and download
  const photos = [...allImages].filter(url => {
    const lower = url.toLowerCase();
    return !lower.includes('favicon') && !lower.includes('sprite') && !lower.includes('logo') &&
           !lower.includes('parastorage') && !lower.includes('frog.wix') && !lower.includes('panorama');
  });

  // Get base URLs (remove Wix resize params)
  const cleaned = photos.map(url => url.split('/v1/')[0] || url.split('?')[0]);
  const unique = [...new Set(cleaned)];

  console.log(`\nDownloading ${unique.length} photos...\n`);

  let count = 0;
  for (let i = 0; i < unique.length; i++) {
    const url = unique[i];
    const ext = url.includes('.png') ? 'png' : url.includes('.webp') ? 'webp' : 'jpg';
    const filename = `site_${String(i + 1).padStart(3, '0')}.${ext}`;
    const filepath = path.join(OUTPUT, filename);
    try {
      await downloadFile(url, filepath);
      const stats = fs.statSync(filepath);
      if (stats.size > 5000) {
        console.log(`  ✅ ${filename}: ${(stats.size / 1024).toFixed(0)} KB`);
        count++;
      } else {
        fs.unlinkSync(filepath); // Too small, delete
      }
    } catch (err) {
      console.log(`  ❌ ${filename}: ${err.message}`);
    }
  }

  console.log(`\n🎉 Downloaded ${count} photos to: ${OUTPUT}\n`);
  console.log('Next: Review images, delete junk, add logo.png, then run: node scripts/build.js');
}

main().catch(err => {
  console.error('Scrape failed:', err.message);
  process.exit(1);
});
