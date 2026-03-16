# Fishing Guide Website Template

**A complete, production-ready website system for fishing guides and charter services.** Built by [Advanced Marketing](https://advancedmarketing.co) — designed to be cloned, customized, and deployed in minutes.

---

## What You Get

### Public Website
- Full-page cinematic hero with boat/lake photo
- About section with captain bio and feature highlights
- 3-tier pricing cards with live price calculator
- Photo gallery with lightbox (expandable "Show All")
- Booking request form with automatic price estimation
- Fishing license banner with direct purchase link
- Google Maps "Get Directions" to the dock
- Testimonials section
- SEO blog with 15+ pre-written articles
- Built-in visitor analytics tracking
- Google Analytics integration
- Fully responsive (mobile, tablet, desktop)
- Schema.org structured data (LocalBusiness, FAQPage, Offers)
- Open Graph + Twitter Card meta tags

### Admin Dashboard (`/admin.html`)
Password-protected control panel for the guide:

| Tab | Features |
|-----|----------|
| **Bookings** | View all submissions, confirm/cancel/complete, edit dates, search & filter, add to Google Calendar |
| **Blog** | Create/edit/delete posts, HTML toolbar, image upload, SEO fields |
| **Trip Calendar** | Monthly view, click-to-block dates, add manual trips, color-coded events |
| **Traffic** | Session tracking, daily visitor chart, top pages, referrers, devices |
| **Settings** | Google Calendar sync, email notifications, Google Analytics ID |

### Blog System
- 15+ SEO-optimized articles targeting local fishing keywords
- Admin blog editor with formatting toolbar
- Photo support in posts
- Automatic CTAs linking back to booking form

---

## Quick Start

### 1. Edit Config
All settings live in one file. Open `config.json` and fill in:

```json
{
  "business": {
    "name": "Your Guide Service LLC",
    "captainName": "Captain John Smith",
    "phone": "(555) 123-4567",
    "email": "john@example.com",
    "lake": "Lake Anna",
    "city": "Bumpass",
    "state": "VA"
  },
  "pricing": {
    "tiers": [
      { "name": "Half Day", "hours": 4, "basePrice": 400 },
      { "name": "Full Day", "hours": 6, "basePrice": 600 },
      { "name": "Marathon", "hours": 8, "basePrice": 800 }
    ]
  }
}
```

See `config.json` for the full list of options.

### 2. Scrape Photos
Pull all images from the guide's existing website:

```bash
node scripts/scrape-photos.js https://their-current-site.com
```

Review the `images/` folder — delete junk (business cards, icons, duplicates). Add the logo as `images/logo.png`.

### 3. Build
Generate the site from templates + config:

```bash
node scripts/build.js
```

This creates `index.html`, `admin.html`, and `blog.html` with all content customized.

### 4. Deploy
Push to GitHub and deploy to Netlify:

```bash
git init && git add -A && git commit -m "Initial site"
gh repo create bensblueprints/site-name --public --source=. --remote=origin --push
node scripts/deploy.js --create
```

Your site is live.

---

## File Structure

```
fishing-guide-template/
├── config.json              # All settings (edit this first)
├── index.template.html      # Public website template
├── admin.template.html      # Admin dashboard template
├── blog.template.html       # Blog page template
├── blog-data.json           # Pre-written SEO blog posts
├── CLAUDE.md                # AI assistant instructions
├── README.md                # This file
├── .gitignore
├── images/                  # Photos + logo (add yours here)
│   ├── logo.png
│   ├── captain-tommy.jpg
│   ├── site_001.jpg
│   └── ...
└── scripts/
    ├── build.js             # Generate site from config + templates
    ├── deploy.js            # Deploy to Netlify via API
    └── scrape-photos.js     # Scrape photos from existing sites
```

---

## Config Reference

### `business`
| Field | Example | Description |
|-------|---------|-------------|
| `name` | `"Lake Anna Fishing Charters LLC"` | Full business name |
| `shortName` | `"Lake Anna Charters"` | Short name for nav/logo |
| `captainName` | `"Captain John Smith"` | Guide's name |
| `phone` | `"(555) 123-4567"` | Display phone |
| `email` | `"john@example.com"` | Contact email |
| `address` | `"123 Dock Rd, Bumpass, VA 23024"` | Dock address |
| `lake` | `"Lake Anna"` | Lake name (used everywhere) |
| `city` / `state` / `zip` | `"Bumpass"` / `"VA"` / `"23024"` | Location |
| `region` | `"Virginia"` | State full name |
| `lat` / `lng` | `37.123` / `-77.456` | GPS coordinates |
| `fishSpecies` | `"Largemouth Bass"` | Target species |
| `fishCommon` | `"bass"` | Common name (lowercase) |
| `facebook` | `"https://facebook.com/..."` | Facebook page URL |
| `googlePlaceId` | `"ChIJ..."` | Google Maps Place ID |

### `pricing`
| Field | Example | Description |
|-------|---------|-------------|
| `tiers` | Array of objects | Each trip type (name, hours, basePrice, features) |
| `additionalPersonCost` | `25` | Per extra person above basePeople |
| `maxGuests` | `6` | Maximum group size |
| `licenseUrl` | `"https://..."` | State fishing license purchase URL |

### `site`
| Field | Example | Description |
|-------|---------|-------------|
| `domain` | `"my-site.netlify.app"` | Netlify domain |
| `netlifyName` | `"my-site"` | Netlify site slug |
| `repoName` | `"my-site"` | GitHub repo name |
| `adminPassword` | `"mypassword123"` | Admin dashboard login |

### `design`
| Field | Description |
|-------|-------------|
| `colors.navy` | Primary dark background |
| `colors.gold` | CTA buttons and highlights |
| `colors.teal` | Accents and labels |
| `heroImage` | Hero section background |
| `captainImage` | About section photo |
| `logo` | Nav and footer logo |

---

## Blog Posts

The template includes 15+ SEO blog posts in `blog-data.json`. For a new client, regenerate these targeting their specific lake and location. Each post should target keywords like:

- `[lake name] fishing guide`
- `best time to fish [lake name]`
- `[state] fishing license`
- `fishing charter rates [area]`
- `family fishing trips [lake name]`
- `[fish species] fishing techniques`
- `best fishing spots [lake name]`

---

## Admin Dashboard

### Default Login
- **URL**: `https://your-site.netlify.app/admin.html`
- **Password**: Set in `config.json` → `site.adminPassword`

### Booking Workflow
```
New → Confirm → Add to Calendar → Complete
                                 → Cancel (with restore option)
```

### Data Storage
- **Bookings**: Netlify Forms (server-side, persisted)
- **Statuses / dates / manual trips / blocked dates**: localStorage (per-browser)
- **Blog posts (custom)**: localStorage (pre-built posts in blog-data.json)
- **Analytics**: Netlify Forms pageview tracking

---

## Scripts

### `node scripts/build.js`
Reads `config.json` and template files, performs find-and-replace on all business-specific text, outputs production-ready HTML files.

Options:
- `--output ../other-dir` — Build to a different directory

### `node scripts/deploy.js`
Deploys the site to Netlify using the file upload API. Handles files with spaces in names.

Options:
- `--create` — Create a new Netlify site first
- `--dir ../other-dir` — Deploy from a different directory

### `node scripts/scrape-photos.js [url]`
Uses Puppeteer to crawl a website, scroll all pages to trigger lazy loading, and download every image over 5KB.

---

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (zero dependencies, zero build step)
- **Fonts**: Bebas Neue + Inter (Google Fonts)
- **Hosting**: Netlify (static)
- **Forms**: Netlify Forms
- **Analytics**: Built-in session tracker + optional Google Analytics
- **Calendar**: Google Calendar URL links (zero-setup) or OAuth API

---

## Requirements

- Node.js 18+
- GitHub CLI (`gh`)
- Git
- Puppeteer (`npm install puppeteer` — for photo scraping only)

---

## Credits

Built by [Advanced Marketing](https://advancedmarketing.co) | Benjamin Boyce
