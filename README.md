# ProofPath

A free, zero-backend student career launchpad. Students enter their degree, college,
target role, and existing proof (certificates, projects, LinkedIn, resume, internships,
portfolio) and get:

- an **internship readiness score** with a breakdown of what's missing,
- a **shareable proof profile** (copy-to-clipboard + share link),
- a **14-day action plan** focused on creating *visible* proof, and
- a **certificate finder** that ranks free/cheap certs by role fit, LinkedIn value,
  and effort — and tells them what proof to build after each one.

Everything runs in the browser. No data leaves the device (saved profiles and
completed-certificate progress use `localStorage`).

## Project structure

```
.
├── index.html      # the entire app (HTML + CSS + JS, single file)
├── favicon.svg     # brand mark
├── og-image.png    # social share card (1200x630)
├── vercel.json     # static hosting config (clean URLs + security headers)
└── README.md
```

This is a **static site** — there is no build step.

## Run locally

Just open `index.html` in a browser. For correct share-link behaviour, serve it over HTTP:

```bash
npx serve .
# or
python -m http.server 3000
```

## Deploy to Vercel

### Option A — Git import (recommended)

1. Create a repo and push:
   ```bash
   git add .
   git commit -m "ProofPath MVP"
   git branch -M main
   git remote add origin https://github.com/<you>/proofpath.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Framework preset: **Other**. Build command: *none*. Output directory: `./` (root).
4. Deploy. Every push to `main` auto-deploys.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel        # preview deploy
vercel --prod # production deploy
```

After deploy, update the `og:image` / `twitter:image` URLs in `index.html` to your
production domain if you want absolute URLs (relative paths work on Vercel, but some
scrapers prefer absolute). Re-scrape with the
[LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) to refresh the card.

## Roadmap (turning the MVP into a moat)

The current build is fully client-side. The product's long-term advantage is **student
outcome data**. Next steps that need a backend:

- Capture which certificates students actually finish, and how long they take.
- Track which certs lead to shortlists/interviews, by college, degree, and role.
- Build campus pages ("top certificates at NMIMS / DU / VIT") for SEO + WhatsApp sharing.

A lightweight Supabase or Vercel Postgres + a single capture endpoint is enough to start.
