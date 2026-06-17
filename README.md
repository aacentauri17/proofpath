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
2. In the **SQL Editor**, run:

   ```sql
   create table if not exists public.events (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz not null default now(),
     session_id text,
     type text not null,
     role text,
     degree text,
     college text,
     score int,
     cert_title text,
     cert_provider text,
     meta jsonb
   );

   alter table public.events enable row level security;

   -- Anonymous students can only INSERT events. No one can read/update/delete
   -- from the browser; you read the data via the Supabase dashboard / service role.
   create policy "anon can insert events"
     on public.events for insert to anon with check (true);
   ```

3. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.
4. Paste both into the config block at the top of the `<script>` in `index.html`:

   ```js
   const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
   const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
   ```

5. Commit and push — Vercel auto-deploys. Events now flow into the `events` table.

The anon key is safe to expose: row-level security allows inserts only, so the public
key cannot read or modify data. Add rate-limiting / a captcha later if you see abuse.

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
