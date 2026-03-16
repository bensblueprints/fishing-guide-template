# Fishing Guide Website Template

## What This Is
Complete template for building fishing guide/charter websites with booking system, admin dashboard, blog, and analytics. Built for Advanced Marketing by Benjamin Boyce.

## How To Build A New Fishing Guide Site

When Ben says something like "build a new fishing guide site for [Business Name] based on [their website]", follow these exact steps:

### Step 1: Clone & Configure
```bash
cp -r fishing-guide-template/ new-site-name/
cd new-site-name/
```
Edit `config.json` with the client's info:
- Business name, captain name, phone, email, address
- Lake name, city, state, region
- Pricing tiers (hours, prices, features)
- Fish species they target
- Their existing website URL (for photo scraping)
- Netlify site name (slug)
- Admin password

### Step 2: Scrape Photos
```bash
node scripts/scrape-photos.js https://their-existing-site.com
```
This downloads all photos to `images/`. Review them, delete junk (business cards, flyers, icons, duplicates). Ask client for logo → save as `images/logo.png`.

### Step 3: Build Site
```bash
node scripts/build.js
```
This reads config.json + templates and generates index.html, admin.html, blog.html with all content customized.

### Step 4: Create Blog Posts
Generate 15 SEO blog posts targeting "[lake name] fishing guide" keywords. Save as `blog-data.json`. Use the blog post agent prompt from the SML Wicked Striper build as reference.

### Step 5: Git + Deploy
```bash
git init && git add -A && git commit -m "Initial site"
gh repo create bensblueprints/site-name --public --source=. --remote=origin --push
node scripts/deploy.js --create
```

### Step 6: Verify
- Check main site loads with correct photos, pricing, content
- Submit test booking
- Login to admin dashboard
- Check blog posts load
- Test "Get Directions" link
- Test booking form submission

## Files
- `config.json` — All customizable settings (edit this first)
- `index.template.html` — Public website template
- `admin.template.html` — Admin dashboard template
- `blog.template.html` — Blog page template
- `blog-data.json` — SEO blog posts (regenerate per client)
- `scripts/build.js` — Generates site from config + templates
- `scripts/deploy.js` — Deploys to Netlify via API
- `scripts/scrape-photos.js` — Scrapes photos from existing site
- `images/` — All local photos + logo

## Important Notes
- Netlify token: nfp_2r8NMnaW5BxpaWHWXXu6ZbePvQAQjqkp682b
- Git branch must be `master` not `main`
- After creating Netlify site, MUST patch `ignore_html_forms: false` (deploy.js does this)
- Files with spaces need URL-encoding when uploading (deploy.js handles this)
- Admin statuses/manual trips/blocked dates stored in localStorage (per-browser)
- Blog posts: pre-built in blog-data.json + custom posts in localStorage via admin
- Always push to GitHub after changes
- Always deploy after code changes
