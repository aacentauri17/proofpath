/*
 * POST /api/linkedin-post — drafts a short LinkedIn post for a finished certificate.
 *
 * Body: { title, provider, proofTip, role, name, achievements }
 * Returns: { post: "<draft text>" }
 *
 * Needs the same Vercel environment variable as /api/recommend: GEMINI_API_KEY.
 * If it is not configured or the call fails, returns a 200 with a template-based
 * post so the client's own fallback never has to guess a status code.
 */

const GEMINI_MODEL = "gemini-2.0-flash";

function fallbackPost(body) {
  const title = body.title || "a certification";
  const provider = body.provider || "";
  const proofTip = body.proofTip || "";
  const tag = String(body.role || "career").replace(/[^a-z0-9]/gi, "");
  return [
    `Just finished "${title}"${provider ? ` from ${provider}` : ""}. 🎓`,
    "",
    proofTip ? `Next up: ${proofTip}` : "Excited to put this into practice.",
    "",
    `#Certification #${tag} #StudentLife`
  ].join("\n");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.status(200).json({ post: fallbackPost(body) });
    return;
  }

  const prompt = [
    "Write a short, first-person LinkedIn post (max 80 words, no hashtag stuffing, max 3 hashtags)",
    "for a college student who just finished a certificate. Sound like a real student, not a marketer -",
    "specific and a little proud, not salesy. End with 2-3 relevant hashtags on their own line.",
    "",
    `Certificate: ${body.title || ""}`,
    `Provider: ${body.provider || ""}`,
    `Target role: ${body.role || ""}`,
    `Suggested proof/next step: ${body.proofTip || ""}`,
    `Student name: ${body.name || ""}`,
    `What they've done so far: ${body.achievements || ""}`,
    "",
    "Respond with ONLY the post text, no preamble, no quotes."
  ].join("\n");

  try {
    const gRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 }
        })
      }
    );
    if (!gRes.ok) throw new Error("gemini " + gRes.status);
    const gJson = await gRes.json();
    const text = gJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || !text.trim()) throw new Error("empty");
    res.status(200).json({ post: text.trim() });
  } catch (error) {
    res.status(200).json({ post: fallbackPost(body) });
  }
};
