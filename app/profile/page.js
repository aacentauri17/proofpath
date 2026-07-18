"use client";

import { useEffect } from "react";
import DarkVeil from "../../components/DarkVeil";
import SpecularBtn from "../../components/SpecularBtn";
import { useSiteChrome } from "../../lib/siteChrome";

const SUPABASE_URL = "https://hyynugpbmvqckksmalel.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_4gD59CrE0ty8H3wDj6EzlQ_Zd7PBKKQ";

export default function ProfilePage() {
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
        } catch (error) { /* never break the page */ }
      }
    };

    const storageKey = "proofpath-demo-profile";
    const roadsKey = "proofpath-roads";
    const certProgressKey = "proofpath-cert-progress";
    const savedCoursesKey = "proofpath-saved-courses";

    const form = document.querySelector("#profileForm");
    const toast = document.querySelector("#toast");

    let certificateData = [];

    function getCompleted() {
      try { return new Set(JSON.parse(localStorage.getItem(certProgressKey)) || []); }
      catch (error) { return new Set(); }
    }
    function setCompleted(set) { localStorage.setItem(certProgressKey, JSON.stringify([...set])); }
    function getRoads() {
      try { return JSON.parse(localStorage.getItem(roadsKey)) || []; }
      catch (error) { return []; }
    }
    function setRoads(roads) { localStorage.setItem(roadsKey, JSON.stringify(roads)); renderAll(); }
    function getSavedCourses() {
      try { return JSON.parse(localStorage.getItem(savedCoursesKey)) || []; }
      catch (error) { return []; }
    }
    function setSavedCourses(list) { localStorage.setItem(savedCoursesKey, JSON.stringify(list)); }

    function findCert(title) { return certificateData.find(item => item.title === title); }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    }

    function showToast(message) {
      toast.textContent = message;
      toast.classList.add("show");
      window.clearTimeout(showToast.timer);
      showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
    }

    function initials(name) {
      return String(name || "").split(" ").filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join("") || "ST";
    }

    function getProfile() {
      const data = new FormData(form);
      return {
        name: data.get("studentName") || "Student", college: data.get("college") || "",
        degree: data.get("degree") || "", role: data.get("targetRole") || "marketing",
        proofs: data.getAll("proof"), weeklyTime: Number(data.get("weeklyTime") || 3),
        achievements: data.get("achievements") || ""
      };
    }

    function applyProfile(profile) {
      form.studentName.value = profile.name === "Student" ? "" : (profile.name || "");
      form.college.value = profile.college || "";
      form.degree.value = profile.degree || "Commerce / BBA";
      form.targetRole.value = profile.role || "marketing";
      form.achievements.value = profile.achievements || "";
      form.querySelectorAll('input[name="proof"]').forEach(input => { input.checked = (profile.proofs || []).includes(input.value); });
      const time = form.querySelector(`input[name="weeklyTime"][value="${profile.weeklyTime || 3}"]`);
      if (time) time.checked = true;
    }

    function saveProfile(silent) {
      localStorage.setItem(storageKey, JSON.stringify(getProfile()));
      document.querySelector("#savedState").textContent = "Saved in this browser";
      if (!silent) showToast("Profile saved.");
    }

    function encodeProfile(profile) { return btoa(unescape(encodeURIComponent(JSON.stringify(profile)))); }

    async function shareProfileLink() {
      const encoded = encodeProfile(getProfile());
      const base = window.location.origin && window.location.origin !== "null" ? `${window.location.origin}/` : "/";
      const url = `${base}?p=${encoded}`;
      try {
        await navigator.clipboard.writeText(url);
        analytics.track("profile_shared", { role: form.targetRole.value });
        showToast("Share link copied.");
      } catch (error) { showToast("Could not copy link in this browser."); }
    }

    function fallbackLinkedInPost(cert) {
      const tag = String(cert.role || "career").replace(/[^a-z0-9]/gi, "");
      return [
        `Just finished "${cert.title}"${cert.provider ? ` from ${cert.provider}` : ""}. 🎓`, "",
        cert.proofTip ? `Next up: ${cert.proofTip}` : "Excited to put this into practice.", "",
        `#Certification #${tag} #StudentLife`
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
      } catch (error) { text = fallbackLinkedInPost(cert); }
      const safeId = escapeHtml(cert.title).replace(/[^a-z0-9]/gi, "");
      container.innerHTML = `
        <label class="label" for="liText-${safeId}">Your draft post</label>
        <textarea id="liText-${safeId}">${escapeHtml(text)}</textarea>
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
      analytics.track("linkedin_post_drafted", { role: cert.role, cert_title: cert.title, cert_provider: cert.provider, meta: { source: "profile" } });
    }

    function renderRoads() {
      const panel = document.querySelector("#roadsPanel");
      const list = document.querySelector("#roadsList");
      const roads = getRoads();
      panel.hidden = !roads.length;
      if (!roads.length) { list.innerHTML = ""; return; }
      const completed = getCompleted();
      list.innerHTML = roads.map((road, ri) => {
        const doneCount = road.certs.filter(c => completed.has(c.title)).length;
        const finished = doneCount === road.certs.length;
        return `
        <div class="road" data-road="${ri}">
          <div class="cert-top">
            <h3 style="margin: 0;">${escapeHtml(road.name)}${finished ? ` <span class="cred cred-yes">&#10003; Complete</span>` : ""}</h3>
            <span class="pill">${doneCount} of ${road.certs.length} done</span>
          </div>
          <div class="mini-meter" style="margin: 10px 0 12px;"><span style="--width:${Math.round((doneCount / road.certs.length) * 100)}%"></span></div>
          ${road.certs.map(c => `
            <label class="check" style="margin-bottom: 8px;">
              <input type="checkbox" data-road-cert="${escapeHtml(c.title)}" ${completed.has(c.title) ? "checked" : ""}>
              <span>${escapeHtml(c.title)}<span class="mini" style="display:block; font-weight: 400;">${escapeHtml(c.provider || "")}</span></span>
              <a class="text-link" style="margin-left:auto;" href="${encodeURI(c.url || "#")}" target="_blank" rel="noreferrer">Open</a>
            </label>`).join("")}
          <div class="cert-actions" style="margin-top: 6px;">
            <button class="text-link" type="button" data-road-delete="${ri}">Remove road</button>
          </div>
        </div>`;
      }).join("");
    }

    const roadsListEl = document.querySelector("#roadsList");
    const onRoadsListClick = event => {
      const del = event.target.closest("[data-road-delete]");
      if (del) {
        const roads = getRoads();
        const removed = roads.splice(Number(del.dataset.roadDelete), 1)[0];
        setRoads(roads);
        if (removed) analytics.track("road_removed", { meta: { name: removed.name } });
        return;
      }
      const box = event.target.closest("[data-road-cert]");
      if (box) {
        const title = box.dataset.roadCert;
        const completed = getCompleted();
        if (completed.has(title)) { completed.delete(title); }
        else {
          completed.add(title);
          const cert = findCert(title);
          analytics.track("cert_completed", { role: cert ? cert.role : null, cert_title: title, cert_provider: cert ? cert.provider : null, meta: { source: "road" } });
          const roads = getRoads();
          const road = roads.find(r => r.certs.some(c => c.title === title));
          if (road && road.certs.every(c => completed.has(c.title) || c.title === title)) {
            analytics.track("road_completed", { meta: { name: road.name } });
            showToast(`Road complete: ${road.name} 🎉`);
          }
        }
        setCompleted(completed);
        renderAll();
      }
    };
    roadsListEl.addEventListener("click", onRoadsListClick);

    function renderMyCourses() {
      const list = document.querySelector("#coursesList");
      const emptyNote = document.querySelector("#coursesEmpty");
      const completed = getCompleted();
      const savedTitles = new Set(getSavedCourses().map(c => c.title));
      const courses = new Map();

      function upsert(base, extra) {
        const full = findCert(base.title) || {};
        const prior = courses.get(base.title) || {};
        courses.set(base.title, {
          title: base.title, provider: base.provider || full.provider || "", url: base.url || full.url || "#",
          cost: full.priceNote || full.cost || base.cost || "", hours: full.hours || base.hours,
          level: full.level || base.level, role: full.role || base.role, proofTip: full.proofTip || "",
          roads: [...(prior.roads || []), ...(extra && extra.road ? [extra.road] : [])]
        });
      }

      getRoads().forEach(road => road.certs.forEach(c => upsert(c, { road: road.name })));
      getSavedCourses().forEach(c => upsert(c));
      completed.forEach(title => { if (!courses.has(title)) upsert({ title }); });

      const rows = [...courses.values()];
      emptyNote.hidden = rows.length > 0;
      if (!rows.length) { list.innerHTML = ""; document.querySelector("#coursesCount").textContent = ""; return; }
      const doneCount = rows.filter(c => completed.has(c.title)).length;
      document.querySelector("#coursesCount").textContent = `${doneCount} of ${rows.length} done`;
      rows.sort((a, b) => Number(completed.has(b.title)) - Number(completed.has(a.title)));

      list.innerHTML = rows.map(c => {
        const done = completed.has(c.title);
        const meta = [c.cost, c.hours ? `&#9201;&#65039; ${c.hours} hrs` : null, c.level].filter(Boolean).join(" &middot; ");
        const tagLine = [meta || null, c.roads.length ? c.roads.join(", ") : null].filter(Boolean).join(" &middot; ");
        const safeId = escapeHtml(c.title).replace(/[^a-z0-9]/gi, "");
        return `
        <div class="road" data-course="${escapeHtml(c.title)}">
          <div class="cert-top">
            <span>
              <strong>${escapeHtml(c.title)}</strong>
              <span class="mini" style="display:block; font-weight: 400;">${escapeHtml(c.provider || "")}${tagLine ? ` &middot; ${tagLine}` : ""}</span>
            </span>
            <span class="cred ${done ? "cred-yes" : "cred-no"}">${done ? "&#10003; Completed" : "In progress"}</span>
          </div>
          <div class="cert-actions" style="margin-top: 8px;">
            <a class="btn ghost" href="${encodeURI(c.url || "#")}" target="_blank" rel="noreferrer">Open</a>
            <button class="text-link" type="button" data-mycourse-done="${escapeHtml(c.title)}">${done ? "Mark not done" : "Mark completed"}</button>
            ${savedTitles.has(c.title) ? `<button class="text-link" type="button" data-mycourse-unsave="${escapeHtml(c.title)}">Remove from space</button>` : ""}
            ${done ? `<button class="text-link" type="button" data-mycourse-linkedin="${escapeHtml(c.title)}">Draft a LinkedIn post</button>` : ""}
          </div>
          <div class="li-post" id="myCourseLi-${safeId}"></div>
        </div>`;
      }).join("");
    }

    const coursesListEl = document.querySelector("#coursesList");
    const onCoursesListClick = event => {
      const doneBtn = event.target.closest("[data-mycourse-done]");
      if (doneBtn) {
        const title = doneBtn.dataset.mycourseDone;
        const completed = getCompleted();
        const cert = findCert(title);
        if (completed.has(title)) { completed.delete(title); }
        else {
          completed.add(title);
          analytics.track("cert_completed", { role: cert ? cert.role : null, cert_title: title, cert_provider: cert ? cert.provider : null, meta: { source: "my_courses" } });
        }
        setCompleted(completed);
        renderAll();
        return;
      }
      const unsaveBtn = event.target.closest("[data-mycourse-unsave]");
      if (unsaveBtn) {
        const title = unsaveBtn.dataset.mycourseUnsave;
        setSavedCourses(getSavedCourses().filter(c => c.title !== title));
        analytics.track("course_unsaved", { cert_title: title, meta: { source: "profile" } });
        showToast("Removed from your space.");
        renderAll();
        return;
      }
      const liBtn = event.target.closest("[data-mycourse-linkedin]");
      if (liBtn) {
        const title = liBtn.dataset.mycourseLinkedin;
        const cert = findCert(title) || getSavedCourses().find(c => c.title === title) || { title };
        const safeId = escapeHtml(title).replace(/[^a-z0-9]/gi, "");
        draftLinkedInPost(cert, document.querySelector(`#myCourseLi-${safeId}`));
      }
    };
    coursesListEl.addEventListener("click", onCoursesListClick);

    function renderAll() {
      document.querySelector("#avatar").textContent = initials(form.studentName.value);
      renderRoads();
      renderMyCourses();
    }

    const onFormSubmit = event => {
      event.preventDefault();
      saveProfile(true);
      const profile = getProfile();
      analytics.track("profile_generated", {
        role: profile.role, degree: profile.degree, college: profile.college,
        meta: { proofs: profile.proofs, weekly_time: profile.weeklyTime, achievements_len: profile.achievements.trim().length, source: "profile" }
      });
      window.location.href = "/?recs=1";
    };
    const onFormInput = () => { document.querySelector("#avatar").textContent = initials(form.studentName.value); };
    form.addEventListener("submit", onFormSubmit);
    form.addEventListener("input", onFormInput);

    const saveBtnEl = document.querySelector("#saveBtn");
    const onSaveClick = () => saveProfile(false);
    saveBtnEl.addEventListener("click", onSaveClick);

    const shareLinkBtnEl = document.querySelector("#shareLinkBtn");
    shareLinkBtnEl.addEventListener("click", shareProfileLink);

    async function loadCatalog() {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/certificates?select=*&order=role.asc`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length) {
            certificateData = rows.map(row => ({
              role: row.role, provider: row.provider, title: row.title, cost: row.cost,
              priceNote: row.price_note, hours: row.hours, level: row.level, url: row.url, proofTip: row.proof_tip
            }));
            renderAll();
            return;
          }
        }
      } catch (error) { /* fall through */ }
      try {
        const res = await fetch("/catalog-data.json");
        if (res.ok) {
          certificateData = await res.json();
          renderAll();
        }
      } catch (error) { /* saved-course base data still renders */ }
    }

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved) {
        applyProfile(saved);
        document.querySelector("#savedState").textContent = "Saved in this browser";
      }
    } catch (error) { localStorage.removeItem(storageKey); }
    renderAll();
    loadCatalog();

    return () => {
      roadsListEl.removeEventListener("click", onRoadsListClick);
      coursesListEl.removeEventListener("click", onCoursesListClick);
      form.removeEventListener("submit", onFormSubmit);
      form.removeEventListener("input", onFormInput);
      saveBtnEl.removeEventListener("click", onSaveClick);
      shareLinkBtnEl.removeEventListener("click", shareProfileLink);
    };
  }, []);

  return (
    <>
      <div id="darkveil-root" aria-hidden="true"><DarkVeil hueShift={18} noiseIntensity={0.035} scanlineIntensity={0} speed={0.3} warpAmount={0.55} resolutionScale={1} /></div>
      <div className="app">
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
            <SpecularBtn as="a" href="/how-it-works" variant="ghost">How it works</SpecularBtn>
            <SpecularBtn as="a" href="/" variant="primary">Find certificates</SpecularBtn>
          </div>
        </nav>

        <main>
          <section style={{ padding: "clamp(20px, 4vw, 40px) 0 clamp(8px, 2vw, 14px)" }}>
            <h1>My space</h1>
            <p className="lede">Your profile, saved courses, and certificate roads - everything you&apos;re working toward, in one place. Stored only in this browser.</p>
          </section>

          <div className="stack">
            <section className="panel intake" aria-labelledby="formTitle">
              <div className="panel-head">
                <div>
                  <h2 id="formTitle">My profile</h2>
                  <p>We use this to pick certificates for you. Nothing leaves this browser unless you share it.</p>
                </div>
                <div className="avatar" id="avatar">ST</div>
              </div>

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
                  <SpecularBtn as="button" type="submit" variant="primary">Save &amp; get recommendations</SpecularBtn>
                  <SpecularBtn as="button" type="button" id="saveBtn" variant="plain">Save</SpecularBtn>
                  <SpecularBtn as="button" type="button" id="shareLinkBtn" variant="ghost">Share link</SpecularBtn>
                  <span className="mini" id="savedState">Not saved yet</span>
                </div>
              </form>
            </section>

            <section className="panel section" id="roadsPanel" hidden aria-labelledby="roadsTitle">
              <div className="section-head">
                <div>
                  <h2 id="roadsTitle">My roads</h2>
                  <p>Your saved certificate paths. Tick each one off as you finish it.</p>
                </div>
              </div>
              <div id="roadsList"></div>
            </section>

            <section className="panel section" id="coursesPanel" aria-labelledby="myCoursesTitle">
              <div className="section-head">
                <div>
                  <h2 id="myCoursesTitle">My courses</h2>
                  <p>Everything you saved or marked completed, from any page.</p>
                </div>
                <span className="pill" id="coursesCount"></span>
              </div>
              <div id="coursesList"></div>
              <p className="empty" id="coursesEmpty" hidden>Nothing saved yet. <a href="/catalog">Browse the catalog</a> and hit &quot;+ Add to my space&quot; on any course.</p>
            </section>
          </div>
        </main>
      </div>

      <div className="toast" id="toast" role="status" aria-live="polite"></div>
    </>
  );
}
