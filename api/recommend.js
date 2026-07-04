/*
 * POST /api/recommend  — personalised course recommendations via Gemini.
 *
 * Body: { degree, role, college, proofs: [], achievements }
 * Returns: { recommendations: [{ title, provider, url, reason, proof }] }
 *
 * Needs a Vercel environment variable GEMINI_API_KEY (from Google AI Studio).
 * The Supabase values below are the PUBLIC ones (safe to expose); only the
 * Gemini key is secret and comes from the environment.
 */

const SUPABASE_URL = "https://hyynugpbmvqckksmalel.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_4gD59CrE0ty8H3wDj6EzlQ_Zd7PBKKQ";
const GEMINI_MODEL = "gemini-2.0-flash"; // change if your key exposes a different free model

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    // Not configured yet - tell the client so it can hide the section gracefully.
    res.status(200).json({ recommendations: [], disabled: true });
    return;
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const role = String(body.role || "").toLowerCase();
  const degree = body.degree || "";
  const college = body.college || "";
  const proofs = Array.isArray(body.proofs) ? body.proofs : [];
  const achievements = body.achievements || "";

  try {
    // 1) Pull the courses for this role from Supabase.
    const catRes = await fetch(
      `${SUPABASE_URL}/rest/v1/certificates?select=title,provider,cost,hours,level,subjects,proof_tip,url&role=eq.${encodeURIComponent(role)}`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const courses = catRes.ok ? await catRes.json() : [];
    if (!courses.length) {
      res.status(200).json({ recommendations: [] });
      return;
    }
    const byTitle = new Map(courses.map(c => [c.title, c]));

    const compact = courses.map(c => ({
      title: c.title, provider: c.provider, cost: c.cost, hours: c.hours,
      level: c.level, subjects: c.subjects
    }));

    const prompt = [
      "You are a career mentor helping a college student pick internship-ready certifications.",
      "",
      "Student:",
      `- Degree: ${degree}`,
      `- Target role: ${role}`,
      `- College / city: ${college}`,
      `- Proof they already have: ${proofs.length ? proofs.join(", ") : "none"}`,
      `- In their own words: "${achievements}"`,
      "",
      "Pick the 5 BEST courses for THIS student, ONLY from the list below, using the exact `title`.",
      "Prefer courses that match the target role, fill gaps in what they already have, and are realistic",
      "for a student (free or cheap first). For each pick, write one sentence of reasoning that references",
      "something specific about this student, and one concrete proof artefact to build afterwards.",
      "",
      `Courses (JSON): ${JSON.stringify(compact)}`,
      "",
      'Respond with ONLY a JSON array: [{"title":"<exact title>","reason":"<one sentence>","proof":"<one concrete artefact>"}]'
    ].join("\n");

    // 2) Ask Gemini.
    const gRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.4 }
        })
      }
    );
    if (!gRes.ok) {
      res.status(502).json({ error: "gemini_error", status: gRes.status, detail: await gRes.text() });
      return;
    }
    const gJson = await gRes.json();
    const text = gJson?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    let picks = [];
    try { picks = JSON.parse(text); } catch (e) { picks = []; }
    if (!Array.isArray(picks)) picks = [];

    // 3) Map back to the authoritative catalog rows (drop any hallucinated titles).
    const recommendations = picks
      .map(p => {
        const cert = byTitle.get(p.title);
        if (!cert) return null;
        return {
          title: cert.title,
          provider: cert.provider,
          url: cert.url,
          reason: String(p.reason || "").slice(0, 240),
          proof: String(p.proof || "").slice(0, 240)
        };
      })
      .filter(Boolean)
      .slice(0, 6);

    res.status(200).json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: "server_error", detail: String(error) });
  }
};
