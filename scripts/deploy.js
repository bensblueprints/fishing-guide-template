#!/usr/bin/env node
/**
 * Deploy fishing guide site to Netlify
 *
 * Usage:
 *   node scripts/deploy.js                    # Deploy from current directory
 *   node scripts/deploy.js --dir ../my-site   # Deploy from specified directory
 *   node scripts/deploy.js --create           # Create new Netlify site first
 */

const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));

const args = process.argv.slice(2);
const dirIdx = args.indexOf('--dir');
const SITE_DIR = dirIdx >= 0 ? path.resolve(args[dirIdx + 1]) : ROOT;
const CREATE = args.includes('--create');

const TOKEN = 'nfp_2r8NMnaW5BxpaWHWXXu6ZbePvQAQjqkp682b';
const SITE_NAME = config.site.netlifyName;
let SITE_ID = config.site.netlifyId || '';

function api(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.netlify.com',
      path: '/api/v1' + apiPath,
      method,
      headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }
    };
    if (body) {
      const b = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(b);
    }
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function upload(deployId, filePath, content) {
  return new Promise((resolve, reject) => {
    const encoded = filePath.split('/').map(s => encodeURIComponent(s)).join('/');
    const options = {
      hostname: 'api.netlify.com',
      path: '/api/v1/deploys/' + deployId + '/files' + encoded,
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/octet-stream', 'Content-Length': content.length }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
    req.write(content);
    req.end();
  });
}

function scanFiles(dir, base) {
  const files = {};
  for (const item of fs.readdirSync(dir)) {
    if (item.startsWith('.') || item.startsWith('_') || item === 'node_modules' || item === 'scripts'
        || item.endsWith('.template.html') || item === 'config.json' || item === 'package.json'
        || item === 'CLAUDE.md' || item === '.gitignore') continue;
    const full = path.join(dir, item);
    const rel = base ? base + '/' + item : '/' + item;
    if (fs.statSync(full).isDirectory()) {
      Object.assign(files, scanFiles(full, rel));
    } else {
      const content = fs.readFileSync(full);
      files[rel] = { sha: crypto.createHash('sha1').update(content).digest('hex'), content };
    }
  }
  return files;
}

async function main() {
  console.log(`\n🚀 Deploying ${config.business.name}...\n`);

  // Create site if needed
  if (CREATE || !SITE_ID) {
    console.log('Creating Netlify site:', SITE_NAME);
    const createRes = await api('POST', '/sites', {
      name: SITE_NAME,
      repo: { provider: 'github', repo: 'bensblueprints/' + config.site.repoName, branch: 'master' }
    });
    const site = JSON.parse(createRes.body);
    if (site.id) {
      SITE_ID = site.id;
      console.log('Site created:', site.id);
      console.log('URL:', site.ssl_url || site.url);

      // Enable form processing
      await api('PUT', '/sites/' + SITE_ID, {
        processing_settings: { html: { pretty_urls: true }, ignore_html_forms: false }
      });
      console.log('Form processing enabled');

      // Save site ID back to config
      config.site.netlifyId = SITE_ID;
      fs.writeFileSync(path.join(ROOT, 'config.json'), JSON.stringify(config, null, 2));
    } else {
      console.error('Failed to create site:', createRes.body);
      process.exit(1);
    }
  }

  if (!SITE_ID) {
    // Try to find by name
    const sitesRes = await api('GET', '/sites?filter=all&per_page=100');
    const sites = JSON.parse(sitesRes.body);
    const found = sites.find(s => s.name === SITE_NAME);
    if (found) {
      SITE_ID = found.id;
      console.log('Found existing site:', SITE_ID);
    } else {
      console.error('Site not found. Run with --create flag.');
      process.exit(1);
    }
  }

  // Scan files
  console.log('Scanning files in:', SITE_DIR);
  const files = scanFiles(SITE_DIR);
  const fileHashes = {};
  for (const [p, f] of Object.entries(files)) fileHashes[p] = f.sha;
  console.log('Files:', Object.keys(files).length);

  // Create deploy
  const deployRes = await api('POST', '/sites/' + SITE_ID + '/deploys', { files: fileHashes });
  const deploy = JSON.parse(deployRes.body);
  console.log('Deploy:', deploy.id, '| Need to upload:', deploy.required?.length || 0);

  // Upload required files
  if (deploy.required?.length) {
    const shaToPath = {};
    for (const [p, f] of Object.entries(files)) shaToPath[f.sha] = p;

    let uploaded = 0;
    for (const sha of deploy.required) {
      const fp = shaToPath[sha];
      if (fp && files[fp]) {
        try {
          await upload(deploy.id, fp, files[fp].content);
          uploaded++;
          if (uploaded % 20 === 0) console.log(`  Uploaded ${uploaded}/${deploy.required.length}`);
        } catch (e) {
          console.log(`  FAIL: ${fp} - ${e.message}`);
        }
      }
    }
    console.log(`Uploaded ${uploaded} files`);
  }

  console.log(`\n✅ Live at: https://${config.site.domain}`);
  console.log(`   Admin:  https://${config.site.domain}/admin.html`);
  console.log(`   Blog:   https://${config.site.domain}/blog.html`);
  console.log(`   Password: ${config.site.adminPassword}\n`);
}

main().catch(err => {
  console.error('Deploy failed:', err.message);
  process.exit(1);
});
