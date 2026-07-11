#!/usr/bin/env node
/*
 * Scrape course catalogs from certification providers via the Firecrawl API and
 * merge new entries into catalog-data.json (the master catalog).
 *
 *   node tools/scrape-certs.js                 # scrape all sources, merge new certs
 *   node tools/scrape-certs.js --dry-run       # scrape + report, but do not write
 *   node tools/scrape-certs.js --source=hubspot # only one source (by id)
 *
 * Requires FIRECRAWL_API_KEY in .env (git-ignored). Uses Firecrawl's JSON
 * extraction, so each source only needs a catalog-listing URL - no per-site
 * HTML parsing to maintain.
 *
 * Scraped entries get role-classified by keywords and receive sensible defaults
 * (level, hours, proof tip). They are marked value: "From <provider>'s catalog"
 * so curated entries remain distinguishable. Dedupe is by normalized title.
 * After merging, run `node tools/sync-catalog.js` to push to Supabase.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MASTER = path.join(ROOT, "catalog-data.json");
const DRY_RUN = process.argv.includes("--dry-run");
const ONLY = (process.argv.find(a => a.startsWith("--source=")) || "").split("=")[1] || null;

function loadEnv() {
  const env = {};
  const envPath = path.join(ROOT, ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !line.trim().startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return { fcKey: process.env.FIRECRAWL_API_KEY || env.FIRECRAWL_API_KEY };
}

/* ---------------- Sources ----------------
 * Each source is a catalog listing page. roleHint is used when keyword
 * classification finds nothing. Add more sources here and re-run.
 */
const SOURCES = [
  { id: "hubspot", provider: "HubSpot Academy", url: "https://academy.hubspot.com/courses", cost: "free", priceNote: "Free", recognized: true, certType: "Certificate", roleHint: "marketing", defaultHours: 3 },
  { id: "greatlearning", provider: "Great Learning Academy", url: "https://www.mygreatlearning.com/academy/learn-for-free/courses", cost: "free", priceNote: "Free", recognized: false, certType: "Course certificate", roleHint: "data", defaultHours: 3 },
  { id: "simplilearn", provider: "Simplilearn SkillUp", url: "https://www.simplilearn.com/skillup-free-online-courses", cost: "free", priceNote: "Free", recognized: false, certType: "Course certificate", roleHint: "data", defaultHours: 5 },
  { id: "semrush", provider: "Semrush Academy", url: "https://www.semrush.com/academy/courses/", cost: "free", priceNote: "Free", recognized: true, certType: "Certificate", roleHint: "marketing", defaultHours: 3 },
  { id: "saylor-business", provider: "Saylor Academy", url: "https://learn.saylor.org/course/index.php?categoryid=6", cost: "free", priceNote: "Free, incl. certificate", recognized: true, certType: "Certificate", roleHint: "finance", defaultHours: 20 },
  { id: "saylor-cs", provider: "Saylor Academy", url: "https://learn.saylor.org/course/index.php?categoryid=10", cost: "free", priceNote: "Free, incl. certificate", recognized: true, certType: "Certificate", roleHint: "software", defaultHours: 20 },
  { id: "kaggle", provider: "Kaggle Learn", url: "https://www.kaggle.com/learn", cost: "free", priceNote: "Free", recognized: false, certType: "Course certificate", roleHint: "data", defaultHours: 4 },
  { id: "cisco", provider: "Cisco Networking Academy", url: "https://www.netacad.com/catalogs/learn", cost: "free", priceNote: "Free", recognized: true, certType: "Certificate", roleHint: "software", defaultHours: 15 },
  { id: "alison-it", provider: "Alison", url: "https://alison.com/courses/it", cost: "free", priceNote: "Free (paid cert download)", recognized: false, certType: "Course certificate", roleHint: "software", defaultHours: 6 },
  { id: "alison-marketing", provider: "Alison", url: "https://alison.com/courses/marketing", cost: "free", priceNote: "Free (paid cert download)", recognized: false, certType: "Course certificate", roleHint: "marketing", defaultHours: 6 },
  { id: "alison-business", provider: "Alison", url: "https://alison.com/courses/business", cost: "free", priceNote: "Free (paid cert download)", recognized: false, certType: "Course certificate", roleHint: "finance", defaultHours: 6 },
  { id: "openlearn", provider: "OpenLearn (Open University)", url: "https://www.open.edu/openlearn/free-courses/full-catalogue", cost: "free", priceNote: "Free, incl. statement", recognized: true, certType: "Certificate", roleHint: "finance", defaultHours: 12 }
];

/* ---------------- Role classification ---------------- */
const ROLE_KEYWORDS = {
  marketing: ["marketing", "seo", "social media", "advertis", "email", "content", "brand", "inbound", "crm", "ecommerce", "e-commerce", "sales", "copywriting", "growth", "ppc", "google ads", "campaign"],
  data: ["data", "sql", "analytics", "statistic", "machine learning", "power bi", "tableau", "excel", "big data", "deep learning", " ai ", "artificial intelligence", "visualization", "pandas", "r programming"],
  product: ["product management", "product manager", "agile", "scrum", "project management", "kanban", "roadmap", "jira", "innovation"],
  finance: ["finance", "financ", "accounting", "invest", "trading", "economic", "banking", "tax", "audit", "bookkeeping", "stock", "budget"],
  design: ["design", "ux", "ui", "figma", "photoshop", "graphic", "typography", "canva", "illustrator", "user experience", "3d", "animation"],
  software: ["programming", "developer", "web development", "javascript", "python", "java", "c#", "c++", "coding", "cloud", "aws", "azure", "cyber", "network", "linux", "git", "html", "css", "react", "node", "devops", "software", "computer science", "database", "it "]
};

function classifyRole(text, hint) {
  const hay = ` ${String(text).toLowerCase()} `;
  let best = null;
  let bestScore = 0;
  for (const [role, words] of Object.entries(ROLE_KEYWORDS)) {
    const score = words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0);
    if (score > bestScore) { best = role; bestScore = score; }
  }
  return best || hint;
}

const PROOF_TIPS = {
  marketing: "Apply it to a real campaign or local business and post the results.",
  data: "Analyse one real dataset with what you learned and share 3 insights.",
  product: "Write a one-page teardown or PRD applying the ideas.",
  finance: "Apply one concept to a real company and write a short memo.",
  design: "Redesign one real screen or asset and share the before/after.",
  software: "Build one small project with it and push it to GitHub."
};

function subjectsFrom(text, role) {
  const hay = String(text).toLowerCase();
  const hits = (ROLE_KEYWORDS[role] || []).filter(w => hay.includes(w)).slice(0, 4);
  return hits.map(w => w.trim().replace(/^\w/, ch => ch.toUpperCase()));
}

function normTitle(t) {
  return String(t).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/* ---------------- Firecrawl ---------------- */
async function scrapeSource(source, fcKey) {
  const schema = {
    type: "object",
    properties: {
      courses: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            url: { type: "string" },
            hours: { type: "number" },
            description: { type: "string" }
          },
          required: ["title"]
        }
      }
    },
    required: ["courses"]
  };
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${fcKey}` },
    body: JSON.stringify({
      url: source.url,
      onlyMainContent: true,
      waitFor: 3000,
      formats: [{
        type: "json",
        schema,
        prompt: "Extract every course/certification listed on this catalog page. For each: the course title, its direct link (absolute URL), estimated duration in hours if shown, and a one-line description if shown. Only actual courses, not blog posts or category links."
      }]
    })
  });
  if (!res.ok) throw new Error(`Firecrawl ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  return json?.data?.json?.courses || [];
}

function toCert(raw, source) {
  const text = `${raw.title} ${raw.description || ""}`;
  const role = classifyRole(text, source.roleHint);
  let url = raw.url || source.url;
  try { url = new URL(url, source.url).href; } catch (e) { url = source.url; }
  return {
    role,
    provider: source.provider,
    title: String(raw.title).trim().slice(0, 120),
    cost: source.cost,
    priceNote: source.priceNote,
    hours: Number.isFinite(raw.hours) && raw.hours > 0 && raw.hours < 500 ? Math.round(raw.hours) : source.defaultHours,
    level: "Beginner",
    certType: source.certType,
    recognized: source.recognized,
    subjects: subjectsFrom(text, role),
    value: `From ${source.provider}'s official catalog`,
    url,
    proofTip: PROOF_TIPS[role] || PROOF_TIPS.software
  };
}

async function main() {
  const { fcKey } = loadEnv();
  if (!fcKey) {
    console.error("Missing FIRECRAWL_API_KEY in .env");
    process.exit(1);
  }
  const master = JSON.parse(fs.readFileSync(MASTER, "utf8"));
  const known = new Set(master.map(c => normTitle(c.title)));
  console.log(`Master catalog: ${master.length} courses`);

  const sources = ONLY ? SOURCES.filter(s => s.id === ONLY) : SOURCES;
  if (!sources.length) {
    console.error(`No source matches --source=${ONLY}. Ids: ${SOURCES.map(s => s.id).join(", ")}`);
    process.exit(1);
  }

  const added = [];
  for (const source of sources) {
    process.stdout.write(`Scraping ${source.id} (${source.url}) ... `);
    try {
      const rawCourses = await scrapeSource(source, fcKey);
      let newHere = 0;
      for (const raw of rawCourses) {
        if (!raw.title || String(raw.title).trim().length < 4) continue;
        const key = normTitle(raw.title);
        if (known.has(key)) continue;
        known.add(key);
        const cert = toCert(raw, source);
        added.push(cert);
        newHere++;
      }
      console.log(`${rawCourses.length} found, ${newHere} new`);
    } catch (error) {
      console.log(`FAILED: ${String(error).slice(0, 200)}`);
    }
  }

  const byRole = added.reduce((a, c) => ((a[c.role] = (a[c.role] || 0) + 1), a), {});
  console.log(`\nNew courses: ${added.length}`, byRole);

  if (DRY_RUN) {
    console.log("--dry-run: nothing written. Sample:", JSON.stringify(added[0] || null, null, 2));
    return;
  }
  if (!added.length) { console.log("Nothing to merge."); return; }

  fs.copyFileSync(MASTER, MASTER + ".bak");
  fs.writeFileSync(MASTER, JSON.stringify([...master, ...added], null, 0));
  console.log(`Merged into catalog-data.json: now ${master.length + added.length} courses (backup: catalog-data.json.bak)`);
  console.log("Next: node tools/sync-catalog.js  (pushes the full catalog to Supabase)");
}

main().catch(err => { console.error(err); process.exit(1); });
