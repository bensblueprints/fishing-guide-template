#!/usr/bin/env node
/**
 * Fishing Guide Website Builder
 *
 * Reads config.json and template files to generate a complete
 * fishing guide website with admin dashboard.
 *
 * Usage:
 *   node scripts/build.js
 *   node scripts/build.js --output ../my-new-site
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const outputIdx = args.indexOf('--output');
const OUTPUT = outputIdx >= 0 ? path.resolve(args[outputIdx + 1]) : ROOT;

// Load config
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const b = config.business;
const p = config.pricing;
const s = config.site;
const d = config.design;

console.log(`\n🎣 Building fishing guide site for: ${b.name}`);
console.log(`   Captain: ${b.captainName}`);
console.log(`   Lake: ${b.lake}, ${b.state}`);
console.log(`   Output: ${OUTPUT}\n`);

// Ensure output dirs
if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT, { recursive: true });
if (!fs.existsSync(path.join(OUTPUT, 'images'))) fs.mkdirSync(path.join(OUTPUT, 'images'), { recursive: true });

// Generate password hash
const pwHash = crypto.createHash('sha256').update(s.adminPassword).digest('hex');

// ========== REPLACEMENTS MAP ==========
const replacements = {
  // Business
  'SML Wicked Striper Guide Service LLC': b.name,
  'SML Wicked Striper Guide Service': b.name.replace(/ LLC$/, ''),
  'Wicked Striper Guide Service': b.shortName + ' Guide Service',
  'WICKED STRIPER': b.shortName.toUpperCase(),
  'Wicked Striper': b.shortName,
  'Captain Tommy Moore': b.captainName,
  'Captain Tommy': b.captainName.split(' ').slice(0, 2).join(' '),
  'Tommy Moore': b.captainName.replace(/^Captain\s+/i, ''),
  'Tommy': b.captainName.replace(/^Captain\s+/i, '').split(' ')[0],
  'smlwickedstriper@gmail.com': b.email,
  '(434) 610-3255': b.phone,
  '+1-434-610-3255': b.phoneRaw,
  '+14346103255': b.phoneRaw.replace(/[^+\d]/g, ''),
  '434.610.3255': b.phone.replace(/[^\d]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1.$2.$3'),

  // Location
  'Smith Mountain Lake': b.lake,
  'Moneta, VA 24121': `${b.city}, ${b.state} ${b.zip}`,
  'Moneta, VA': `${b.city}, ${b.state}`,
  'Moneta, Virginia': `${b.city}, ${b.region}`,
  'Moneta': b.city,
  '200 Pine Knob Cir': b.address.split(',')[0],
  'Virginia': b.region,
  'Blue Ridge Mountains': b.landmark,
  '37.14113': String(b.lat),
  '-79.65909': String(b.lng),
  'US-VA': `US-${b.state}`,

  // Fish
  'striped bass': b.fishSpecies.toLowerCase(),
  'Striped Bass': b.fishSpecies,
  'striper': b.fishCommon,
  'Striper': b.fishCommon.charAt(0).toUpperCase() + b.fishCommon.slice(1),
  'stripers': b.fishCommon + 's',
  'Stripers': b.fishCommon.charAt(0).toUpperCase() + b.fishCommon.slice(1) + 's',

  // Site
  'sml-wicked-striper.netlify.app': s.domain,
  'sml-wicked-striper': s.netlifyName,

  // Social
  'https://www.facebook.com/SMLWickedStriper-2160188210958596/': b.facebook || '#',
  'ChIJn0TwYxhBTYgRBZmrbGYAlPc': b.googlePlaceId || '',

  // License
  'Virginia DWR freshwater fishing license': p.licenseRequired,
  'Virginia DWR freshwater': p.licenseRequired.replace(/ fishing license$/, ''),
  'Virginia DWR': p.licenseRequired.split(' ').slice(0, 2).join(' '),
  'https://www.dgif.virginia.gov/licenses/': p.licenseUrl,

  // Admin password hash
  '19e86a91003b7fd4eb60d2b2e1b710413bb15f95a36884e2e58b818a6add67d5': pwHash,
};

function applyReplacements(content) {
  let result = content;
  // Sort by length descending so longer strings are replaced first
  const sorted = Object.entries(replacements).sort((a, b) => b[0].length - a[0].length);
  for (const [find, replace] of sorted) {
    if (find && replace) {
      result = result.split(find).join(replace);
    }
  }
  return result;
}

// ========== PROCESS TEMPLATES ==========
const templates = ['index.template.html', 'admin.template.html', 'blog.template.html'];
const outputNames = ['index.html', 'admin.html', 'blog.html'];

templates.forEach((tpl, i) => {
  const tplPath = path.join(ROOT, tpl);
  if (!fs.existsSync(tplPath)) {
    console.log(`⚠️  Template not found: ${tpl}`);
    return;
  }
  let content = fs.readFileSync(tplPath, 'utf8');
  content = applyReplacements(content);

  const outPath = path.join(OUTPUT, outputNames[i]);
  fs.writeFileSync(outPath, content);
  console.log(`✅ ${outputNames[i]} (${(content.length / 1024).toFixed(1)} KB)`);
});

// Copy blog-data.json if exists
const blogData = path.join(ROOT, 'blog-data.json');
if (fs.existsSync(blogData)) {
  let bd = fs.readFileSync(blogData, 'utf8');
  bd = applyReplacements(bd);
  fs.writeFileSync(path.join(OUTPUT, 'blog-data.json'), bd);
  console.log(`✅ blog-data.json`);
}

// ========== COPY IMAGES ==========
const imgSrc = path.join(ROOT, 'images');
const imgDst = path.join(OUTPUT, 'images');
if (fs.existsSync(imgSrc)) {
  const imgs = fs.readdirSync(imgSrc);
  let copied = 0;
  imgs.forEach(f => {
    fs.copyFileSync(path.join(imgSrc, f), path.join(imgDst, f));
    copied++;
  });
  console.log(`✅ ${copied} images copied`);
}

console.log(`\n🎉 Build complete! Site ready at: ${OUTPUT}`);
console.log(`\nNext steps:`);
console.log(`  1. Add photos to ${path.join(OUTPUT, 'images/')}`);
console.log(`  2. Add logo as ${path.join(OUTPUT, 'images/logo.png')}`);
console.log(`  3. Run: node scripts/deploy.js`);
console.log(`  4. Admin password: ${s.adminPassword}\n`);
