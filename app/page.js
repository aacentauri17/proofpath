"use client";

import { useEffect } from "react";
import DarkVeil from "../components/DarkVeil";
import SpecularBtn from "../components/SpecularBtn";
import { useSiteChrome } from "../lib/siteChrome";

const SUPABASE_URL = "https://hyynugpbmvqckksmalel.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_4gD59CrE0ty8H3wDj6EzlQ_Zd7PBKKQ";

const roleData = {
  marketing: {
    label: "Marketing internship", base: 22, lift: "Add a public campaign teardown", angle: "Proof over claims",
    summary: "Marketing internship candidate with early certificates and campus social proof. Needs one visible project and a cleaner story.",
    roadmap: [
      ["Audit", "Rewrite LinkedIn headline around one target: growth, content, brand, or performance.", "30 min"],
      ["Create", "Publish a teardown of a brand campaign with 3 insights and 1 improvement idea.", "2 hrs"],
      ["Package", "Turn your best certificate + teardown into a pinned proof post.", "45 min"]
    ],
    recs: [
      ["certificate", "Google Digital Marketing", "Free, recognizable, and broad enough for beginners. Add only after writing one applied takeaway.", "4-8 hrs"],
      ["project", "Campus growth teardown", "Pick one college club or small business and write a simple acquisition plan.", "Weekend"],
      ["proof", "LinkedIn proof post", "Show certificate, teardown link, and one metric you would track.", "20 min"]
    ]
  },
  data: {
    label: "Data analyst internship", base: 24, lift: "Publish a dashboard with a short readme", angle: "Show the analysis path",
    summary: "Data analyst candidate with basic learning proof. Needs a public dashboard and clearer tool stack.",
    roadmap: [
      ["Clean", "Choose one dataset and document the cleaning choices in plain English.", "1 hr"],
      ["Build", "Create a small dashboard with 3 charts and 3 business recommendations.", "3 hrs"],
      ["Share", "Post the dashboard with a before/after insight, not just screenshots.", "30 min"]
    ],
    recs: [
      ["certificate", "Kaggle Intro to SQL or Pandas", "Fast, free, and practical. Pair it with one notebook.", "3-5 hrs"],
      ["project", "Internship stipend dashboard", "Analyze stipends, roles, or locations from public listings.", "Weekend"],
      ["proof", "One-page analysis memo", "Recruiters understand decisions faster than notebooks.", "45 min"]
    ]
  },
  product: {
    label: "Product internship", base: 20, lift: "Write a teardown of one app flow", angle: "Think like a builder",
    summary: "Product internship candidate with broad interest. Needs sharper user insight and product judgment proof.",
    roadmap: [
      ["Observe", "Interview 3 students about one painful workflow.", "1 hr"],
      ["Teardown", "Map an app flow and identify one friction point.", "2 hrs"],
      ["Spec", "Write a one-page PRD for a tiny fix with success metrics.", "90 min"]
    ],
    recs: [
      ["certificate", "Product analytics mini-course", "Useful only if paired with an actual product teardown.", "4-6 hrs"],
      ["project", "Student workflow PRD", "Pick attendance, notes, internships, or payments and write a tiny spec.", "Weekend"],
      ["proof", "Before/after flow post", "A visual post can travel well in student circles.", "40 min"]
    ]
  },
  finance: {
    label: "Finance internship", base: 23, lift: "Build a simple valuation or market memo", angle: "Numbers plus judgment",
    summary: "Finance internship candidate with early coursework proof. Needs an applied model and a concise memo.",
    roadmap: [
      ["Model", "Recreate a simple company revenue and margin model.", "2 hrs"],
      ["Explain", "Write a 300-word memo with assumptions and risks.", "1 hr"],
      ["Package", "Add screenshots and a downloadable spreadsheet link.", "30 min"]
    ],
    recs: [
      ["certificate", "Corporate finance fundamentals", "Brand matters, but applied models matter more.", "6-10 hrs"],
      ["project", "One-company mini model", "Choose a business you actually understand and explain drivers.", "Weekend"],
      ["proof", "Market memo", "Short, specific, and easier to review than a huge spreadsheet.", "45 min"]
    ]
  },
  design: {
    label: "Design internship", base: 21, lift: "Publish one case study with constraints", angle: "Taste plus reasoning",
    summary: "Design internship candidate with scattered proof. Needs a case study that explains decisions.",
    roadmap: [
      ["Select", "Pick one ugly student workflow and define the user problem.", "45 min"],
      ["Redesign", "Create 3 key screens with states, not just a landing page.", "3 hrs"],
      ["Narrate", "Write the case study: problem, constraints, decisions, tradeoffs.", "1 hr"]
    ],
    recs: [
      ["certificate", "Figma basics", "Helpful only when the portfolio shows applied decisions.", "2-4 hrs"],
      ["project", "Campus app redesign", "Redesign attendance, events, clubs, or placements.", "Weekend"],
      ["proof", "Case study carousel", "Explain why, not just what it looks like.", "45 min"]
    ]
  },
  software: {
    label: "Software dev internship", base: 24, lift: "Ship a small app to GitHub with a clear README", angle: "Working code over claims",
    summary: "Software dev candidate with early fundamentals. Needs one shipped, running project and a readable GitHub.",
    roadmap: [
      ["Build", "Pick one small, real problem and build a working prototype.", "3 hrs"],
      ["Ship", "Push it to GitHub with a README, screenshots, and setup steps.", "1 hr"],
      ["Explain", "Write a short post on what you built and one hard bug you fixed.", "30 min"]
    ],
    recs: [
      ["certificate", "CS50 or freeCodeCamp", "Free, respected fundamentals. Pair with one shipped project.", "Weekend+"],
      ["project", "One deployed mini-app", "A tracker, API, or tool that actually runs beats a tutorial clone.", "Weekend"],
      ["proof", "GitHub + demo link post", "Show the repo, a live link, and one technical decision.", "30 min"]
    ]
  }
};

export default function HomePage() {
  useSiteChrome();

  useEffect(() => {
    const analytics = {
      enabled() { return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY); },
      sessionId() {
        let id = localStorage.getItem("proofpath-session");
        if (!id) {
          id = (crypto.randomUUID && crypto.randomUUID()) || `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          localStorage.setItem("proofpath-session", id);
        }
        return id;
      },
      track(type, payload = {}) {
        if (!this.enabled()) return;
        try {
          fetch(`${SUPABASE_URL}/rest/v1/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: "return=minimal" },
            body: JSON.stringify({ session_id: this.sessionId(), type, ...payload }),
            keepalive: true
          }).catch(() => {});
        } catch (error) { /* never let analytics break the app */ }
      }
    };

    function normalizeCert(row) {
      return {
        role: row.role, provider: row.provider, title: row.title, cost: row.cost,
        priceNote: row.price_note, hours: row.hours, level: row.level, certType: row.cert_type,
        recognized: row.recognized, subjects: Array.isArray(row.subjects) ? row.subjects : (row.subjects || []),
        value: row.value, url: row.url, proofTip: row.proof_tip
      };
    }

    // Supabase first, then the static tools/sync-catalog.js snapshot as a
    // second line of defence - same two-tier pattern as /catalog and /profile.
    async function loadCatalog() {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/certificates?select=*&order=role.asc`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length) {
            certificateData = rows.map(normalizeCert);
            render();
            return;
          }
        }
      } catch (error) { /* fall through to the static fallback below */ }
      try {
        const res = await fetch("/catalog-data.json");
        if (!res.ok) return;
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length) {
          certificateData = rows.map(cert => ({ ...cert, hours: cert.hours == null ? null : Number(cert.hours) }));
          render();
        }
      } catch (error) { /* nothing more to fall back to */ }
    }

    let certificateData = [];

    const PROOF_WEIGHTS = { certificate: 10, project: 18, linkedin: 8, resume: 9, internship: 17, portfolio: 15 };
    const PROOF_MAX = Object.values(PROOF_WEIGHTS).reduce((a, b) => a + b, 0);
    const PROOF_LABELS = { certificate: "Certificate", project: "Public project", linkedin: "LinkedIn", resume: "Resume", internship: "Prior internship", portfolio: "Portfolio" };
    const certProgressKey = "proofpath-cert-progress";

    function getCompleted() {
      try { return new Set(JSON.parse(localStorage.getItem(certProgressKey)) || []); }
      catch (error) { return new Set(); }
    }
    function setCompleted(set) { localStorage.setItem(certProgressKey, JSON.stringify([...set])); }

    const certOutcomeKey = "proofpath-cert-outcomes";
    function getOutcomes() {
      try { return JSON.parse(localStorage.getItem(certOutcomeKey)) || {}; }
      catch (error) { return {}; }
    }

    const savedCoursesKey = "proofpath-saved-courses";
    function getSavedCourses() {
      try { return JSON.parse(localStorage.getItem(savedCoursesKey)) || []; }
      catch (error) { return []; }
    }
    function isSaved(title) { return getSavedCourses().some(c => c.title === title); }

    function toggleSaved(cert) {
      const saved = getSavedCourses();
      const idx = saved.findIndex(c => c.title === cert.title);
      let nowSaved;
      if (idx >= 0) { saved.splice(idx, 1); nowSaved = false; }
      else {
        saved.push({ title: cert.title, provider: cert.provider, url: cert.url, cost: cert.priceNote || cert.cost, hours: cert.hours, level: cert.level, role: cert.role, addedAt: Date.now() });
        nowSaved = true;
      }
      localStorage.setItem(savedCoursesKey, JSON.stringify(saved));
      analytics.track(nowSaved ? "course_saved" : "course_unsaved", { role: cert.role, cert_title: cert.title, cert_provider: cert.provider });
      if (typeof renderMySpace === "function") renderMySpace();
      return nowSaved;
    }

    function setOutcome(title, outcome) {
      const outcomes = getOutcomes();
      outcomes[title] = outcome;
      localStorage.setItem(certOutcomeKey, JSON.stringify(outcomes));
    }

    const form = document.querySelector("#profileForm");
    const saveBtn = document.querySelector("#saveBtn");
    const resetBtn = document.querySelector("#resetBtn");
    const shareLinkBtn = document.querySelector("#shareLinkBtn");
    const certSearch = document.querySelector("#certSearch");
    const certRole = document.querySelector("#certRole");
    const certCost = document.querySelector("#certCost");
    const certTime = document.querySelector("#certTime");
    const toast = document.querySelector("#toast");
    const storageKey = "proofpath-demo-profile";

    function getProfile() {
      const data = new FormData(form);
      return {
        name: data.get("studentName") || "Student", college: data.get("college") || "Campus",
        degree: data.get("degree") || "Student", role: data.get("targetRole") || "marketing",
        proofs: data.getAll("proof"), weeklyTime: Number(data.get("weeklyTime") || 3),
        achievements: data.get("achievements") || ""
      };
    }

    function proofScoreOf(profile) { return profile.proofs.reduce((sum, item) => sum + (PROOF_WEIGHTS[item] || 0), 0); }
    function storyScoreOf(profile) { return Math.min(12, Math.floor(profile.achievements.trim().length / 28)); }
    function paceScoreOf(profile) { return profile.weeklyTime >= 10 ? 10 : profile.weeklyTime >= 6 ? 7 : 4; }

    function render() { renderCertificates(); renderMySpace(); }

    function linkedinTier(value) {
      if (/high|strong/i.test(value)) return 3;
      if (/medium/i.test(value)) return 2;
      return 1;
    }

    function costBadge(cert) {
      if (cert.cost === "free") return "Free";
      if (cert.cost === "cheap") return "Low cost";
      return "Paid";
    }

    function tileMark(provider) {
      return String(provider || "?").split(/[\s/]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
    }

    function domainLogo(url) {
      try {
        const host = new URL(url).hostname.replace(/^www\./, "");
        return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
      } catch (error) { return null; }
    }

    function tileHtml(cert, cls) {
      const logo = domainLogo(cert.url);
      const img = logo ? `<img src="${logo}" alt="" loading="lazy" onerror="this.remove()">` : "";
      return `<div class="${cls} tile-fallback" data-role="${cert.role}">${img}${tileMark(cert.provider)}</div>`;
    }

    function certRank(cert, targetRole) {
      return (cert.role === targetRole ? 100 : 0) + (cert.recognized ? 12 : 0) + linkedinTier(cert.value) * 10 - cert.hours * 0.2;
    }

    const NO_CERTIFICATE_TITLES = new Set([
      "ProductTank Talks & Resources", "Material Design Foundations", "Full Stack JavaScript Path",
      "Tableau Public Training", "Finance & Capital Markets", "Figma for Beginners",
      "Learn Figma for UI/UX (full course)", "Graphic Design Essentials"
    ]);
    function credentialOf(cert) {
      if (NO_CERTIFICATE_TITLES.has(cert.title)) return { label: "No certificate", has: false };
      const type = (cert.certType || "").toLowerCase();
      if (/resource|curriculum|elearning|talks/.test(type)) return { label: "No certificate", has: false };
      if (/badge|superbadge/.test(type)) return { label: "Shareable badge", has: true };
      if (/learning path|courses \/ certification/.test(type)) return { label: "Cert via exam", has: true };
      return { label: "Certificate", has: true };
    }

    const openCards = new Set();
    function toggleCard(card) {
      if (!card) return;
      const title = card.dataset.title;
      const details = card.querySelector(".cert-details");
      if (!details) return;
      const isOpen = openCards.has(title);
      if (isOpen) openCards.delete(title); else openCards.add(title);
      details.hidden = isOpen;
      card.classList.toggle("is-open", !isOpen);
      const toggle = card.querySelector("[data-toggle]");
      if (toggle) {
        toggle.textContent = isOpen ? "Details" : "Hide details";
        toggle.setAttribute("aria-expanded", String(!isOpen));
      }
    }

    function renderCertificates() {
      const query = certSearch.value.trim().toLowerCase();
      const role = certRole.value;
      const cost = certCost.value;
      const time = certTime.value;
      const targetRole = form.targetRole.value;
      const completed = getCompleted();

      const matches = certificateData.filter(cert => {
        const text = `${cert.provider} ${cert.title} ${cert.value} ${cert.proofTip} ${(cert.subjects || []).join(" ")} ${cert.level || ""}`.toLowerCase();
        const roleOk = role === "all" || cert.role === role;
        const costOk = cost === "all" || (cost === "free" && cert.cost === "free") || (cost === "cheap" && ["free", "cheap"].includes(cert.cost));
        const timeOk = time === "all" || (time === "short" && cert.hours <= 5) || (time === "weekend" && cert.hours <= 10);
        return roleOk && costOk && timeOk && (!query || text.includes(query));
      }).sort((a, b) => certRank(b, targetRole) - certRank(a, targetRole));

      const grid = document.querySelector("#certificateGrid");
      grid.innerHTML = "";
      const doneCount = certificateData.filter(cert => completed.has(cert.title)).length;
      const doneNote = doneCount ? ` · ${doneCount} done` : "";
      document.querySelector("#certCount").textContent = `${matches.length} of ${certificateData.length}${doneNote}`;

      if (!matches.length) {
        grid.innerHTML = `<p class="empty">No matches yet. This is a good signal to add that certificate to the seed database.</p>`;
        return;
      }

      const outcomes = getOutcomes();
      matches.forEach((cert, index) => {
        const done = completed.has(cert.title);
        const outcome = outcomes[cert.title];
        const saved = isSaved(cert.title);
        const cred = credentialOf(cert);
        const subjects = cert.subjects || [];
        const isOpen = openCards.has(cert.title);
        const card = document.createElement("article");
        card.className = "cert-card" + (index === 0 ? " is-top" : "") + (isOpen ? " is-open" : "");
        card.dataset.title = cert.title;
        card.innerHTML = `
          <div class="cert-head">
            ${tileHtml(cert, "cert-tile")}
            <div class="cert-body">
              <div class="cert-top">
                <span class="cert-provider">${index === 0 ? `<span class="top-flag">Top pick</span> &middot; ` : ""}${cert.provider}</span>
                <span class="cred ${cred.has ? "cred-yes" : "cred-no"}">${cred.label}</span>
              </div>
              <h3>${cert.title}</h3>
              <p class="cert-line">${costBadge(cert)} &middot; ${cert.hours} hrs &middot; ${cert.level || "All levels"}${done ? ` &middot; <span class="done">&#10003; Completed</span>` : ""}</p>
            </div>
          </div>
          <div class="cert-foot">
            <span class="tag-chip">${cert.role}</span>
            <div style="display:flex; gap:8px; align-items:center;">
              <button class="text-link" type="button" data-toggle aria-expanded="${isOpen}">${isOpen ? "Hide" : "Details"}</button>
              <a class="icon-btn open-btn" href="${cert.url}" target="_blank" rel="noreferrer" data-open="${cert.title}" aria-label="Open course" title="Open course">&#8599;</a>
              <button class="save-toggle${saved ? " is-saved" : ""}" type="button" data-save="${cert.title}" aria-label="${saved ? "Remove from my space" : "Add to my space"}" title="${saved ? "Saved - click to remove" : "Add to my space"}">${saved ? "&#10003;" : "+"}</button>
            </div>
          </div>
          <div class="cert-details"${isOpen ? "" : " hidden"}>
            ${cert.priceNote ? `<p class="mini">Cost: ${cert.priceNote}</p>` : ""}
            <p class="cert-value">${cert.value}</p>
            ${subjects.length ? `<p class="cert-covers">Covers ${subjects.slice(0, 4).join(", ")}</p>` : ""}
            <p class="cert-proof"><strong>Proof to create:</strong> ${cert.proofTip}</p>
            <div class="cert-actions">
              <button class="text-link" type="button" data-cert="${cert.title}">Copy proof idea</button>
              <button class="text-link" type="button" data-done="${cert.title}">${done ? "Mark not done" : "Mark completed"}</button>
            </div>
            ${done ? (outcome
              ? `<p class="mini">Thanks - logged that it ${outcome === "yes" ? "helped you get shortlisted" : "has not helped yet"}.</p>`
              : `<div class="cert-actions" style="margin-top: 2px; padding-top: 10px; border-top: 1px solid var(--line);">
                  <span class="mini">Did this help you get shortlisted?</span>
                  <button class="text-link" type="button" data-outcome="yes" data-outcome-cert="${cert.title}">Yes</button>
                  <button class="text-link" type="button" data-outcome="not-yet" data-outcome-cert="${cert.title}">Not yet</button>
                </div>`)
              : ""}
            ${done ? `<div class="li-post" id="liPost-${escapeHtml(cert.title).replace(/[^a-z0-9]/gi, "")}"><button class="text-link" type="button" data-linkedin="${cert.title}">Draft a LinkedIn post about this</button></div>` : ""}
          </div>
        `;
        grid.appendChild(card);
      });
    }

    function showToast(message) {
      toast.textContent = message;
      toast.classList.add("show");
      window.clearTimeout(showToast.timer);
      showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
    }

    function saveProfile() {
      localStorage.setItem(storageKey, JSON.stringify(getProfile()));
      document.querySelector("#savedState").textContent = "Saved in this browser";
      showToast("Profile saved locally.");
    }

    function encodeProfile(profile) { return btoa(unescape(encodeURIComponent(JSON.stringify(profile)))); }
    function decodeProfile(value) { return JSON.parse(decodeURIComponent(escape(atob(value)))); }

    function applyProfile(profile) {
      form.studentName.value = profile.name || "";
      form.college.value = profile.college || "";
      form.degree.value = profile.degree || "Commerce / BBA";
      form.targetRole.value = profile.role || "marketing";
      form.achievements.value = profile.achievements || "";
      form.querySelectorAll('input[name="proof"]').forEach(input => { input.checked = (profile.proofs || []).includes(input.value); });
      const time = form.querySelector(`input[name="weeklyTime"][value="${profile.weeklyTime || 3}"]`);
      if (time) time.checked = true;
    }

    function loadProfile() {
      const shared = new URLSearchParams(window.location.search).get("p");
      if (shared) {
        try {
          applyProfile(decodeProfile(shared));
          document.querySelector("#savedState").textContent = "Loaded shared profile";
          return;
        } catch (error) { showToast("Shared link could not be read."); }
      }
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      try {
        applyProfile(JSON.parse(saved));
        document.querySelector("#savedState").textContent = "Loaded saved profile";
      } catch (error) { localStorage.removeItem(storageKey); }
    }

    function resetSample() {
      applyProfile({
        name: "Aarav Mehta", college: "NMIMS Mumbai, 2nd year", degree: "Commerce / BBA", role: "marketing",
        proofs: ["certificate", "linkedin"], weeklyTime: 6,
        achievements: "Completed Google Fundamentals of Digital Marketing, managed college fest Instagram, made a basic Excel dashboard."
      });
      document.querySelector("#savedState").textContent = "Example profile - replace with your details";
      render();
      showToast("Example loaded - edit it with your own details.");
    }

    async function shareProfileLink() {
      const encoded = encodeProfile(getProfile());
      const base = window.location.origin && window.location.origin !== "null" ? `${window.location.origin}${window.location.pathname}` : window.location.href.split("?")[0].split("#")[0];
      const url = `${base}?p=${encoded}`;
      try {
        await navigator.clipboard.writeText(url);
        analytics.track("profile_shared", { role: form.targetRole.value });
        showToast("Share link copied.");
      } catch (error) { showToast("Could not copy link in this browser."); }
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    }

    function fallbackLinkedInPost(cert, profile) {
      const role = (roleData[cert.role] || {}).label || cert.role;
      return [
        `Just finished "${cert.title}" from ${cert.provider}. 🎓`, "",
        cert.proofTip ? `Next up: ${cert.proofTip}` : `Working toward a ${role}.`, "",
        `#Certification #${String(cert.role || "career").replace(/[^a-z0-9]/gi, "")} #StudentLife`
      ].join("\n");
    }

    async function draftLinkedInPost(cert, container) {
      if (!container) return;
      container.innerHTML = `<p class="mini">Writing your post…</p>`;
      const profile = getProfile();
      let text;
      try {
        const res = await fetch("/api/linkedin-post", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: cert.title, provider: cert.provider, proofTip: cert.proofTip, role: cert.role, name: profile.name, achievements: profile.achievements })
        });
        if (!res.ok) throw new Error("http " + res.status);
        const data = await res.json();
        text = data.post;
        if (!text) throw new Error("empty");
      } catch (error) { text = fallbackLinkedInPost(cert, profile); }
      container.innerHTML = `
        <label class="label" for="liText-${escapeHtml(cert.title).replace(/[^a-z0-9]/gi, "")}">Your draft post</label>
        <textarea id="liText-${escapeHtml(cert.title).replace(/[^a-z0-9]/gi, "")}">${escapeHtml(text)}</textarea>
        <div class="cert-actions" style="margin-top: 8px;">
          <button class="text-link" type="button" data-li-copy>Copy post</button>
          <a class="text-link" href="https://www.linkedin.com/feed/?shareActive=true" target="_blank" rel="noreferrer">Open LinkedIn</a>
        </div>`;
      container.querySelector("[data-li-copy]").addEventListener("click", () => {
        navigator.clipboard.writeText(container.querySelector("textarea").value).then(
          () => showToast("Post copied - paste it into LinkedIn."),
          () => showToast("Copy failed. Select the text manually.")
        );
      });
      analytics.track("linkedin_post_drafted", { role: cert.role, cert_title: cert.title, cert_provider: cert.provider });
    }

    const roadsKey = "proofpath-roads";
    let lastRecs = [];
    let lastRecsRole = "";

    function getRoads() {
      try { return JSON.parse(localStorage.getItem(roadsKey)) || []; }
      catch (error) { return []; }
    }
    function setRoads(roads) { localStorage.setItem(roadsKey, JSON.stringify(roads)); renderMySpace(); }

    function renderMySpace() {
      const savedCount = getSavedCourses().length;
      const badge = document.querySelector("#spaceBadge");
      badge.hidden = savedCount === 0;
      badge.textContent = savedCount;
    }

    function saveRoad() {
      if (!lastRecs.length) return;
      const label = (roleData[lastRecsRole] || {}).label || lastRecsRole;
      const name = `Road to ${label.replace(/ internship$/i, "")}`;
      const roads = getRoads();
      const certs = lastRecs.map(r => ({ title: r.title, provider: r.provider, url: r.url }));
      const existing = roads.findIndex(r => r.name === name);
      if (existing >= 0) roads[existing] = { name, role: lastRecsRole, certs, created: Date.now() };
      else roads.push({ name, role: lastRecsRole, certs, created: Date.now() });
      setRoads(roads);
      analytics.track("road_saved", { role: lastRecsRole, meta: { name, certs: certs.map(c => c.title) } });
      showToast(`Saved "${name}" - track it in My space.`);
    }

    function fallbackRecs(profile) {
      return certificateData
        .filter(cert => cert.role === profile.role)
        .sort((a, b) => certRank(b, profile.role) - certRank(a, profile.role))
        .slice(0, 4)
        .map(cert => ({ title: cert.title, provider: cert.provider, url: cert.url, reason: cert.value, proof: cert.proofTip }));
    }

    function renderRecs(recs, profile, personalised) {
      const container = document.querySelector("#aiRecs");
      const label = (roleData[profile.role] || {}).label || profile.role;
      container.className = "";
      container.innerHTML = `
        <div class="cert-grid">${recs.map((r, i) => `
          <article class="cert-card airec">
            <div class="cert-head">
              ${tileHtml(r, "cert-tile")}
              <div class="cert-body">
                <div class="cert-top">
                  <span class="cert-provider">${escapeHtml(r.provider || "")}</span>
                  <span class="cred cred-yes">Pick ${i + 1}</span>
                </div>
                <h3>${escapeHtml(r.title)}</h3>
              </div>
            </div>
            <div class="cert-details">
              <p class="cert-value">${escapeHtml(r.reason || "")}</p>
              ${r.proof ? `<p class="cert-proof"><strong>Build:</strong> ${escapeHtml(r.proof)}</p>` : ""}
            </div>
            <div class="cert-foot">
              <span class="tag-chip">${escapeHtml(profile.role)}</span>
              <a class="icon-btn open-btn" href="${encodeURI(r.url || "#")}" target="_blank" rel="noreferrer" aria-label="Open course" title="Open course">&#8599;</a>
            </div>
          </article>`).join("")}
        </div>
        <div class="cert-actions" style="margin-top: 14px;">
          <button class="btn primary" type="button" id="saveRoadBtn">Save as my Road to ${escapeHtml(label.replace(/ internship$/i, ""))}</button>
          <span class="mini">${personalised ? "Personalised picks for your profile." : "Top-rated picks for this role."}</span>
        </div>`;
      document.querySelector("#saveRoadBtn").addEventListener("click", saveRoad);
    }

    async function loadAiRecs(profile) {
      const section = document.querySelector("#recSection");
      const container = document.querySelector("#aiRecs");
      section.hidden = false;
      container.className = "";
      container.innerHTML = `<p class="mini">Finding your best matches…</p>`;
      lastRecsRole = profile.role;
      try {
        const res = await fetch("/api/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
        if (!res.ok) throw new Error("http " + res.status);
        const data = await res.json();
        const recs = data.recommendations || [];
        if (!recs.length) throw new Error("no recs");
        lastRecs = recs;
        renderRecs(recs, profile, true);
        analytics.track("ai_recs_shown", { role: profile.role, meta: { count: recs.length } });
      } catch (error) {
        const recs = fallbackRecs(profile);
        if (!recs.length) { section.hidden = true; return; }
        lastRecs = recs;
        renderRecs(recs, profile, false);
      }
    }

    function findCert(title) { return certificateData.find(item => item.title === title); }

    const onFormSubmit = event => {
      event.preventDefault();
      render();
      document.querySelector("#results").hidden = false;
      const profile = getProfile();
      analytics.track("profile_generated", {
        role: profile.role, degree: profile.degree, college: profile.college,
        meta: { proofs: profile.proofs, weekly_time: profile.weeklyTime, achievements_len: profile.achievements.trim().length }
      });
      loadAiRecs(profile);
      closeProfileModal();
      document.querySelector("#recSection").scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const profileModal = document.querySelector("#profileModal");
    function openProfileModal() { profileModal.hidden = false; document.body.style.overflow = "hidden"; }
    function closeProfileModal() { profileModal.hidden = true; document.body.style.overflow = ""; }

    const onKeydown = event => { if (event.key === "Escape" && !profileModal.hidden) closeProfileModal(); };
    const onModalClick = event => { if (event.target === profileModal) closeProfileModal(); };
    const onMySpaceClick = () => { window.location.href = "/profile"; };
    const onHeroClick = () => openProfileModal();
    const onModalCloseClick = () => closeProfileModal();

    const onGridClick = event => {
      const outcomeBtn = event.target.closest("[data-outcome]");
      if (outcomeBtn) {
        const title = outcomeBtn.dataset.outcomeCert;
        const outcome = outcomeBtn.dataset.outcome;
        const cert = findCert(title);
        setOutcome(title, outcome);
        analytics.track("outcome_reported", { role: cert ? cert.role : null, cert_title: title, cert_provider: cert ? cert.provider : null, meta: { outcome } });
        showToast(outcome === "yes" ? "Great - thanks for sharing!" : "Thanks - keep building proof.");
        renderCertificates();
        return;
      }
      const openBtn = event.target.closest("[data-open]");
      if (openBtn) {
        const cert = findCert(openBtn.dataset.open);
        if (cert) analytics.track("cert_opened", { role: cert.role, cert_title: cert.title, cert_provider: cert.provider });
        return;
      }
      const doneBtn = event.target.closest("[data-done]");
      if (doneBtn) {
        const completed = getCompleted();
        const title = doneBtn.dataset.done;
        const cert = findCert(title);
        if (completed.has(title)) { completed.delete(title); showToast("Marked as not done."); }
        else {
          completed.add(title);
          showToast("Nice - logged as completed.");
          analytics.track("cert_completed", { role: cert ? cert.role : null, cert_title: title, cert_provider: cert ? cert.provider : null });
        }
        setCompleted(completed);
        renderCertificates();
        renderMySpace();
        return;
      }
      const copyBtn = event.target.closest("[data-cert]");
      if (copyBtn) {
        const cert = findCert(copyBtn.dataset.cert);
        if (!cert) return;
        analytics.track("proof_idea_copied", { role: cert.role, cert_title: cert.title, cert_provider: cert.provider });
        navigator.clipboard.writeText(`${cert.title}: ${cert.proofTip}`).then(
          () => showToast("Proof idea copied."),
          () => showToast("Copy failed in this browser.")
        );
        return;
      }
      const saveToggleBtn = event.target.closest("[data-save]");
      if (saveToggleBtn) {
        const cert = findCert(saveToggleBtn.dataset.save);
        if (!cert) return;
        const nowSaved = toggleSaved(cert);
        showToast(nowSaved ? "Added to your space." : "Removed from your space.");
        renderCertificates();
        return;
      }
      const liBtn = event.target.closest("[data-linkedin]");
      if (liBtn) {
        const cert = findCert(liBtn.dataset.linkedin);
        if (cert) draftLinkedInPost(cert, liBtn.closest(".li-post"));
        return;
      }
      const toggleBtn = event.target.closest("[data-toggle]");
      if (toggleBtn) { toggleCard(toggleBtn.closest(".cert-card")); return; }
      const card = event.target.closest(".cert-card");
      if (card && !event.target.closest("a, button")) toggleCard(card);
    };

    const onFinderInput = () => renderCertificates();
    const onTargetRoleChange = () => { certRole.value = form.targetRole.value; renderCertificates(); };

    form.addEventListener("submit", onFormSubmit);
    form.addEventListener("input", render);
    saveBtn.addEventListener("click", saveProfile);
    resetBtn.addEventListener("click", resetSample);
    shareLinkBtn.addEventListener("click", shareProfileLink);
    [certSearch, certRole, certCost, certTime].forEach(control => control.addEventListener("input", onFinderInput));
    form.targetRole.addEventListener("change", onTargetRoleChange);
    document.querySelector("#heroProfileBtn").addEventListener("click", onHeroClick);
    document.querySelector("#profileModalClose").addEventListener("click", onModalCloseClick);
    profileModal.addEventListener("click", onModalClick);
    document.addEventListener("keydown", onKeydown);
    document.querySelector("#mySpaceBtn").addEventListener("click", onMySpaceClick);
    document.querySelector("#certificateGrid").addEventListener("click", onGridClick);

    loadProfile();
    certRole.value = form.targetRole.value;
    render();
    loadCatalog();

    if (new URLSearchParams(window.location.search).get("recs")) {
      loadAiRecs(getProfile());
      document.querySelector("#recSection").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    return () => {
      form.removeEventListener("submit", onFormSubmit);
      form.removeEventListener("input", render);
      saveBtn.removeEventListener("click", saveProfile);
      resetBtn.removeEventListener("click", resetSample);
      shareLinkBtn.removeEventListener("click", shareProfileLink);
      [certSearch, certRole, certCost, certTime].forEach(control => control.removeEventListener("input", onFinderInput));
      form.targetRole.removeEventListener("change", onTargetRoleChange);
      document.querySelector("#heroProfileBtn")?.removeEventListener("click", onHeroClick);
      document.querySelector("#profileModalClose")?.removeEventListener("click", onModalCloseClick);
      profileModal.removeEventListener("click", onModalClick);
      document.removeEventListener("keydown", onKeydown);
      document.querySelector("#mySpaceBtn")?.removeEventListener("click", onMySpaceClick);
      document.querySelector("#certificateGrid")?.removeEventListener("click", onGridClick);
    };
  }, []);

  return (
    <>
      <div id="darkveil-root" aria-hidden="true"><DarkVeil hueShift={220} noiseIntensity={0.08} scanlineIntensity={0.12} speed={0.45} scanlineFrequency={0.35} warpAmount={1.2} resolutionScale={1} /></div>
      <div className="app">
        <header className="masthead">
          <nav className="nav" aria-label="Primary">
            <a className="brand" href="/">
              <svg className="brand-logo" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
                <rect x="10" y="3" width="21" height="21" rx="5.5" fill="#cf8047" opacity="0.35"></rect>
                <rect x="6.5" y="7.5" width="21" height="21" rx="5.5" fill="#cf8047" opacity="0.7"></rect>
                <rect x="3" y="12" width="21" height="21" rx="5.5" fill="#f5f7fa"></rect>
                <path d="M8.5 23l4 4 8-9" fill="none" stroke="#0b1224" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>CredKit</span>
            </a>
            <div className="nav-actions">
              <SpecularBtn as="a" href="/catalog" variant="ghost">Browse certificates</SpecularBtn>
              <SpecularBtn as="button" type="button" id="mySpaceBtn" variant="plain" className="nav-btn-badge">My space<span className="badge-count" id="spaceBadge" hidden>0</span></SpecularBtn>
              <SpecularBtn as="a" href="/how-it-works" variant="ghost">How it works</SpecularBtn>
            </div>
          </nav>

          <div className="shell">
            <section className="hero" aria-labelledby="pageTitle">
              <h1 id="pageTitle" className="shimmer-text">Find the certificates that actually get you hired.</h1>
              <p className="lede">Browse 150+ free and low-cost certifications, get picks matched to your degree and target role, and save your own road to your first internship.</p>
              <div className="cert-actions" style={{ justifyContent: "center" }}>
                <SpecularBtn as="button" type="button" id="heroProfileBtn" variant="primary">Get certificates picked for me</SpecularBtn>
                <SpecularBtn as="a" href="#finderTitle" variant="ghost">Browse the catalog</SpecularBtn>
              </div>
            </section>
          </div>
        </header>

        <div className="modal-overlay" id="profileModal" hidden>
          <div className="modal">
            <button className="modal-close" type="button" id="profileModalClose" aria-label="Close">&times;</button>
            <section className="panel intake" aria-labelledby="formTitle">
              <div className="panel-head">
                <div>
                  <h2 id="formTitle">Get certificates picked for you</h2>
                  <p>Tell us about yourself and we&apos;ll match certificates to your degree, role, and experience.</p>
                </div>
                <span className="stamp">100%<br />FREE</span>
              </div>

              <noscript>
                <div className="noscript">JavaScript is off, so recommendations cannot run. You can still browse the full catalog below.</div>
              </noscript>

              <form className="form-grid" id="profileForm">
                <div className="field">
                  <label className="label" htmlFor="studentName">Name</label>
                  <input id="studentName" name="studentName" autoComplete="name" placeholder="Your name" />
                </div>
                <div className="field">
                  <label className="label" htmlFor="college">College or city</label>
                  <input id="college" name="college" placeholder="e.g. NMIMS Mumbai, 2nd year" />
                </div>
                <div className="field">
                  <label className="label" htmlFor="degree">Degree</label>
                  <select id="degree" name="degree" defaultValue="Commerce / BBA">
                    <option>Commerce / BBA</option>
                    <option>Engineering / CS</option>
                    <option>Design / Media</option>
                    <option>Economics / Finance</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="targetRole">Target role</label>
                  <select id="targetRole" name="targetRole" defaultValue="marketing">
                    <option value="marketing">Marketing internship</option>
                    <option value="data">Data analyst internship</option>
                    <option value="product">Product internship</option>
                    <option value="finance">Finance internship</option>
                    <option value="design">Design internship</option>
                    <option value="software">Software dev internship</option>
                  </select>
                </div>
                <div className="field full">
                  <span className="label">Current proof</span>
                  <div className="checks">
                    <label className="check"><input type="checkbox" name="proof" value="certificate" /> 1+ certificate</label>
                    <label className="check"><input type="checkbox" name="proof" value="project" /> Public project</label>
                    <label className="check"><input type="checkbox" name="proof" value="linkedin" /> LinkedIn profile</label>
                    <label className="check"><input type="checkbox" name="proof" value="resume" /> Resume draft</label>
                    <label className="check"><input type="checkbox" name="proof" value="internship" /> Prior internship</label>
                    <label className="check"><input type="checkbox" name="proof" value="portfolio" /> Portfolio link</label>
                  </div>
                </div>
                <div className="field full">
                  <span className="label">Weekly time</span>
                  <div className="segmented">
                    <input id="time1" type="radio" name="weeklyTime" value="3" defaultChecked />
                    <label htmlFor="time1">3 hrs</label>
                    <input id="time2" type="radio" name="weeklyTime" value="6" />
                    <label htmlFor="time2">6 hrs</label>
                    <input id="time3" type="radio" name="weeklyTime" value="10" />
                    <label htmlFor="time3">10+ hrs</label>
                  </div>
                </div>
                <div className="field full">
                  <label className="label" htmlFor="achievements">Raw achievements</label>
                  <textarea id="achievements" name="achievements" placeholder="e.g. Completed one online course, ran my club's Instagram, built a small Excel dashboard…"></textarea>
                </div>
                <div className="form-actions">
                  <SpecularBtn as="button" type="submit" variant="primary">Get recommendations</SpecularBtn>
                  <SpecularBtn as="button" type="button" id="saveBtn" variant="plain">Save locally</SpecularBtn>
                  <SpecularBtn as="button" type="button" id="resetBtn" variant="ghost">Load example</SpecularBtn>
                  <SpecularBtn as="button" type="button" id="shareLinkBtn" variant="ghost">Share link</SpecularBtn>
                  <span className="mini" id="savedState">Not saved yet</span>
                </div>
              </form>
            </section>
          </div>
        </div>

        <main>
          <section className="results" id="results" aria-live="polite">
            <div className="stack">
              <section className="panel section" id="recSection" aria-labelledby="recTitle2" hidden>
                <div className="section-head">
                  <div>
                    <h2 id="recTitle2">Recommended for you</h2>
                    <p>Personalised picks based on your degree, role, and what you have already done.</p>
                  </div>
                </div>
                <div id="aiRecs"></div>
              </section>

              <section className="panel section" aria-labelledby="finderTitle">
                <div className="section-head">
                  <div>
                    <h2 id="finderTitle">Certificate finder</h2>
                    <p>Free and cheap certificates ranked for your target role. Each one tells you the proof to build after.</p>
                  </div>
                  <span className="pill" id="certCount">0 matches</span>
                </div>
                <div className="finder-controls">
                  <input id="certSearch" type="search" placeholder="Search provider, skill, certificate" />
                  <select id="certRole" defaultValue="all">
                    <option value="all">All roles</option>
                    <option value="marketing">Marketing</option>
                    <option value="data">Data</option>
                    <option value="product">Product</option>
                    <option value="finance">Finance</option>
                    <option value="design">Design</option>
                    <option value="software">Software dev</option>
                  </select>
                  <select id="certCost" defaultValue="all">
                    <option value="all">Any cost (incl. paid)</option>
                    <option value="free">Free only</option>
                    <option value="cheap">Free or cheap</option>
                  </select>
                  <select id="certTime" defaultValue="all">
                    <option value="all">Any time</option>
                    <option value="short">Under 5 hrs</option>
                    <option value="weekend">Weekend</option>
                  </select>
                </div>
                <div className="cert-grid" id="certificateGrid"></div>
              </section>
            </div>
          </section>
        </main>
      </div>

      <div className="toast" id="toast" role="status" aria-live="polite"></div>
    </>
  );
}
