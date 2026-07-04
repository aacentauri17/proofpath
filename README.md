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
├── index.html                       # the entire app (HTML + CSS + JS, single file)
├── favicon.svg                      # brand mark
├── og-image.png                     # social share card (1200x630)
├── vercel.json                      # static hosting config (clean URLs + headers)
├── supabase/
│   ├── schema.sql                   # events + certificates tables (+ RLS)
│   └── certificates_seed.sql        # 72-cert catalog seed (generated)
└── README.md
```

This is a **static site** — there is no build step. The 72-cert catalog ships
embedded in `index.html` and works with zero backend. When Supabase is configured,
the app loads the catalog from the `certificates` table instead (see below).

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

## The moat: outcome-data capture (Supabase)

The product's long-term advantage is **student outcome data** — which certificates
students actually finish, and which ones help them get shortlisted, by role / degree /
college. The frontend is already instrumented to capture this. It is **off by default**
and the site works identically until you turn it on.

### Events captured

| Event | When |
|-------|------|
| `profile_generated` | student clicks "Generate plan" (role, degree, college, score) |
| `cert_completed` | student marks a certificate completed |
| `cert_opened` | student clicks "Open" on a certificate |
| `proof_idea_copied` | student copies a proof idea |
| `outcome_reported` | student answers "Did this help you get shortlisted?" (the gold signal) |
| `profile_shared` / `profile_copied` | student shares their profile |

### Setup (about 5 minutes)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql) — this creates
   both the `events` table (insert-only) and the `certificates` table (read-only).
3. (Optional, to make the catalog data-driven) run
   [`supabase/certificates_seed.sql`](supabase/certificates_seed.sql) to load all 72 certs.
4. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.
5. Paste both into the config block at the top of the `<script>` in `index.html`:

   ```js
   const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
   const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
   ```

6. Commit and push — Vercel auto-deploys. Events now flow into `events`, and the finder
   loads its catalog from `certificates` (falling back to the embedded list on any error).

The anon key is safe to expose: row-level security allows the public to **insert** events
and **read** the catalog only — it cannot read events or modify the catalog. Add
rate-limiting / a captcha later if you see abuse.

### Editing the catalog without code changes

Once the catalog lives in Supabase, add or edit certs directly in the
**Table Editor → certificates** — no redeploy needed; students see changes on next load.
`subjects` is a JSON array, e.g. `["SEO","Email"]`.

### One-command catalog sync (recommended after expanding `index.html`)

Instead of pasting `supabase/certificates_seed.sql` into the SQL Editor each time,
push the embedded catalog straight to Supabase:

```bash
# one-time setup
cp .env.example .env         # then paste your SUPABASE_URL + SUPABASE_SECRET_KEY

# preview what will be pushed (no writes, no keys needed)
node tools/sync-catalog.js --dry-run

# push the current catalog from index.html to Supabase
node tools/sync-catalog.js
```

It reads `certificateData` from `index.html`, clears the `certificates` table, and
re-inserts every course, then prints the live row count. Needs Node 18+.

> Uses the **SECRET** key (catalog writes bypass row-level security). Keep `.env`
> private — it is git-ignored. The publishable key in `index.html` stays read-only.

### Querying the moat (examples)

```sql
-- Most-completed certificates
select cert_title, count(*) from events
where type = 'cert_completed' group by 1 order by 2 desc;

-- Which certs students say helped them get shortlisted
select cert_title, meta->>'outcome' as outcome, count(*) from events
where type = 'outcome_reported' group by 1, 2 order by 3 desc;

-- Demand by target role
select role, count(*) from events
where type = 'profile_generated' group by 1 order by 2 desc;
```

## Further roadmap

- Campus pages ("top certificates at NMIMS / DU / VIT") for SEO + WhatsApp sharing.
- A custom domain (e.g. `proofpath.in`) for trust and shareable links.
- Public, aggregated outcome stats once enough data is collected.
