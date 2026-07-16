#!/usr/bin/env node
/*
 * Sync the CredKit certificate catalog from index.html into Supabase.
 *
 *   node tools/sync-catalog.js            # push the catalog
 *   node tools/sync-catalog.js --dry-run  # show what would happen, no writes
 *
 * Requires a .env file (git-ignored) in the project root:
 *   SUPABASE_URL=https://YOUR-PROJECT.supabase.co
 *   SUPABASE_SECRET_KEY=sb_secret_...     # the SECRET/service key - NEVER commit this
 *
 * Writing to the certificates table bypasses row-level security, which is why the
 * SECRET key is required here (the publishable key is read-only on the catalog).
 * Needs Node 18+ (built-in fetch). Yours: run `node --version`.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

function loadEnv() {
  const env = {};
  const envPath = path.join(ROOT, ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !line.trim().startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  // process.env overrides .env, so you can also run: SUPABASE_SECRET_KEY=... node tools/sync-catalog.js
  return {
    url: process.env.SUPABASE_URL || env.SUPABASE_URL,
    key: process.env.SUPABASE_SECRET_KEY || env.SUPABASE_SECRET_KEY
  };
}

function extractCatalog() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const start = html.indexOf("let certificateData = [");
  if (start < 0) throw new Error("certificateData not found in index.html");
  let i = html.indexOf("[", start);
  let depth = 0;
  let end = -1;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end < 0) throw new Error("Could not find the end of the certificateData array");
  // The array is a plain literal (objects, strings, arrays) - safe to evaluate.
  return eval(html.slice(html.indexOf("[", start), end + 1));
}

function toRow(c) {
  return {
    role: c.role,
    provider: c.provider,
    title: c.title,
    cost: c.cost,
    price_note: c.priceNote,
    hours: c.hours,
    level: c.level,
    cert_type: c.certType,
    recognized: !!c.recognized,
    subjects: c.subjects || [],
    value: c.value,
    url: c.url,
    proof_tip: c.proofTip
  };
}

// catalog-data.json is the MASTER catalog: the curated entries embedded in
// index.html plus everything tools/scrape-certs.js has merged in. This function
// unions the two (curated wins on title collisions) and writes the master back,
// so re-running never loses scraped entries.
function buildMaster(curated) {
  const masterPath = path.join(ROOT, "catalog-data.json");
  let existing = [];
  try { existing = JSON.parse(fs.readFileSync(masterPath, "utf8")); } catch (e) { /* first run */ }
  const norm = t => String(t).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const merged = new Map();
  for (const c of existing) merged.set(norm(c.title), c);
  for (const c of curated) merged.set(norm(c.title), c); // curated wins
  const catalog = [...merged.values()];
  fs.writeFileSync(masterPath, JSON.stringify(catalog, null, 0));
  console.log(`Master catalog-data.json: ${catalog.length} courses (${curated.length} curated, ${catalog.length - curated.length} scraped/other)`);
  return catalog;
}

async function main() {
  if (typeof fetch !== "function") {
    console.error("This script needs Node 18+ (built-in fetch). Your version: " + process.version);
    process.exit(1);
  }

  const curated = extractCatalog();
  console.log(`Read ${curated.length} curated courses from index.html`);
  const catalog = buildMaster(curated);
  const rows = catalog.map(toRow);
  const byRole = rows.reduce((a, r) => ((a[r.role] = (a[r.role] || 0) + 1), a), {});
  console.log("By role:", byRole);

  if (DRY_RUN) {
    console.log("--dry-run: no Supabase changes made. First row:", JSON.stringify(rows[0], null, 2));
    return;
  }

  const { url, key } = loadEnv();
  if (!url || !key) {
    console.error("Missing config. Create a .env file (see .env.example) with SUPABASE_URL and SUPABASE_SECRET_KEY.");
    process.exit(1);
  }
  if (!/^sb_secret_|^eyJ/.test(key)) {
    console.error("SUPABASE_SECRET_KEY does not look like a secret key. Catalog writes need the SECRET (service) key, not the publishable key.");
    process.exit(1);
  }

  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  // 1) Clear the existing catalog (id=not.is.null matches every row).
  const del = await fetch(`${url}/rest/v1/certificates?id=not.is.null`, {
    method: "DELETE",
    headers: { ...headers, Prefer: "return=minimal" }
  });
  if (!del.ok) {
    console.error("Delete failed:", del.status, await del.text());
    process.exit(1);
  }
  console.log("Cleared existing catalog rows");

  // 2) Insert the current catalog in one batch.
  const ins = await fetch(`${url}/rest/v1/certificates`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(rows)
  });
  if (!ins.ok) {
    console.error("Insert failed:", ins.status, await ins.text());
    process.exit(1);
  }
  console.log(`Inserted ${rows.length} courses`);

  // 3) Verify the live count.
  const check = await fetch(`${url}/rest/v1/certificates?select=id`, {
    headers: { ...headers, Prefer: "count=exact", Range: "0-0" }
  });
  const range = check.headers.get("content-range");
  console.log("Done ✓  Supabase now reports:", range ? range.split("/")[1] + " rows" : "(count unavailable)");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
