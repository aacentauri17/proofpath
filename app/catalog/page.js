"use client";

import { useEffect } from "react";
import DotGrid from "../../components/DotGrid";
import SpecularBtn from "../../components/SpecularBtn";
import { useSiteChrome } from "../../lib/siteChrome";

const SUPABASE_URL = "https://hyynugpbmvqckksmalel.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_4gD59CrE0ty8H3wDj6EzlQ_Zd7PBKKQ";

export default function CatalogPage() {
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

    let certificateData = [];

    const certSearch = document.querySelector("#certSearch");
    const certRole = document.querySelector("#certRole");
    const certCost = document.querySelector("#certCost");
    const certTime = document.querySelector("#certTime");
    const toast = document.querySelector("#toast");

    const certProgressKey = "proofpath-cert-progress";
    const certOutcomeKey = "proofpath-cert-outcomes";

    function getCompleted() {
      try { return new Set(JSON.parse(localStorage.getItem(certProgressKey)) || []); }
      catch (error) { return new Set(); }
    }
    function setCompleted(set) { localStorage.setItem(certProgressKey, JSON.stringify([...set])); }
    function getOutcomes() {
      try { return JSON.parse(localStorage.getItem(certOutcomeKey)) || {}; }
      catch (error) { return {}; }
    }
    function setOutcome(title, outcome) {
      const outcomes = getOutcomes();
      outcomes[title] = outcome;
      localStorage.setItem(certOutcomeKey, JSON.stringify(outcomes));
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
      analytics.track(nowSaved ? "course_saved" : "course_unsaved", { role: cert.role, cert_title: cert.title, cert_provider: cert.provider, meta: { source: "catalog" } });
      updateSpaceBadge();
      return nowSaved;
    }

    function updateSpaceBadge() {
      const count = getSavedCourses().length;
      const badge = document.querySelector("#spaceBadge");
      badge.hidden = count === 0;
      badge.textContent = count;
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    }

    function currentStudentInfo() {
      try {
        const raw = JSON.parse(localStorage.getItem("proofpath-demo-profile") || "null");
        return { name: raw?.name || "", achievements: raw?.achievements || "" };
      } catch (error) { return { name: "", achievements: "" }; }
    }

    function fallbackLinkedInPost(cert) {
      const tag = String(cert.role || "career").replace(/[^a-z0-9]/gi, "");
      return [
        `Just finished "${cert.title}" from ${cert.provider}. 🎓`, "",
        cert.proofTip ? `Next up: ${cert.proofTip}` : "Excited to put this into practice.", "",
        `#Certification #${tag} #StudentLife`
      ].join("\n");
    }

    async function draftLinkedInPost(cert, container) {
      if (!container) return;
      container.innerHTML = `<p class="mini">Writing your post…</p>`;
      const info = currentStudentInfo();
      let text;
      try {
        const res = await fetch("/api/linkedin-post", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: cert.title, provider: cert.provider, proofTip: cert.proofTip, role: cert.role, name: info.name, achievements: info.achievements })
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
      analytics.track("linkedin_post_drafted", { role: cert.role, cert_title: cert.title, cert_provider: cert.provider, meta: { source: "catalog" } });
    }

    function normalizeCert(row) {
      return {
        role: row.role, provider: row.provider, title: row.title, cost: row.cost,
        priceNote: row.price_note, hours: row.hours, level: row.level, certType: row.cert_type,
        recognized: row.recognized, subjects: Array.isArray(row.subjects) ? row.subjects : (row.subjects || []),
        value: row.value, url: row.url, proofTip: row.proof_tip
      };
    }

    function linkedinTier(value) {
      if (/high|strong/i.test(value)) return 3;
      if (/medium/i.test(value)) return 2;
      return 1;
    }
    function certRank(cert, targetRole) {
      return (cert.role === targetRole ? 100 : 0) + (cert.recognized ? 12 : 0) + linkedinTier(cert.value || "") * 10 - (cert.hours || 0) * 0.2;
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

    function findCert(title) { return certificateData.find(item => item.title === title); }

    function showToast(message) {
      toast.textContent = message;
      toast.classList.add("show");
      window.clearTimeout(showToast.timer);
      showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
    }

    function getMatches() {
      const query = certSearch.value.trim().toLowerCase();
      const role = certRole.value;
      const cost = certCost.value;
      const time = certTime.value;
      const targetRole = role;
      return certificateData.filter(cert => {
        const text = `${cert.provider} ${cert.title} ${cert.value} ${cert.proofTip} ${(cert.subjects || []).join(" ")} ${cert.level || ""}`.toLowerCase();
        const roleOk = role === "all" || cert.role === role;
        const costOk = cost === "all" || (cost === "free" && cert.cost === "free") || (cost === "cheap" && ["free", "cheap"].includes(cert.cost));
        const timeOk = time === "all" || (time === "short" && cert.hours <= 5) || (time === "weekend" && cert.hours <= 10);
        return roleOk && costOk && timeOk && (!query || text.includes(query));
      }).sort((a, b) => certRank(b, targetRole) - certRank(a, targetRole));
    }

    function renderCertificates() {
      const role = certRole.value;
      const matches = getMatches();
      const completed = getCompleted();

      const grid = document.querySelector("#certificateGrid");
      grid.innerHTML = "";
      const doneCount = certificateData.filter(cert => completed.has(cert.title)).length;
      const doneNote = doneCount ? ` · ${doneCount} done` : "";
      document.querySelector("#certCount").textContent = `${matches.length} of ${certificateData.length}${doneNote}`;

      if (!matches.length) {
        grid.innerHTML = `<p class="empty">No matches. Try clearing a filter.</p>`;
        return;
      }

      matches.forEach((cert, index) => {
        const done = completed.has(cert.title);
        const saved = isSaved(cert.title);
        const cred = credentialOf(cert);
        const card = document.createElement("article");
        card.className = "cert-card" + (index === 0 && role !== "all" ? " is-top" : "");
        card.dataset.title = cert.title;
        card.innerHTML = `
          <div class="cert-head">
            ${tileHtml(cert, "cert-tile")}
            <div class="cert-body">
              <div class="cert-top">
                <span class="cert-provider">${index === 0 && role !== "all" ? `<span class="top-flag">Top pick</span> &middot; ` : ""}${cert.provider}</span>
                <span class="cred ${cred.has ? "cred-yes" : "cred-no"}">${cred.label}</span>
              </div>
              <h3>${cert.title}</h3>
              <p class="cert-line">${costBadge(cert)} &middot; ${cert.hours} hrs &middot; ${cert.level || "All levels"}${done ? ` &middot; <span class="done">&#10003; Completed</span>` : ""}</p>
            </div>
          </div>
          <div class="cert-foot">
            <span class="tag-chip">${cert.role}</span>
            <div style="display:flex; gap:8px; align-items:center;">
              <a class="icon-btn open-btn" href="${cert.url}" target="_blank" rel="noreferrer" data-open="${cert.title}" aria-label="Open course" title="Open course">&#8599;</a>
              <button class="save-toggle${saved ? " is-saved" : ""}" type="button" data-save="${cert.title}" aria-label="${saved ? "Remove from my space" : "Add to my space"}" title="${saved ? "Saved - click to remove" : "Add to my space"}">${saved ? "&#10003;" : "+"}</button>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });
    }

    const DISCOVERY_ROLES = [
      { role: "marketing", label: "Popular in Marketing" },
      { role: "data", label: "Popular in Data" },
      { role: "product", label: "Popular in Product" },
      { role: "finance", label: "Popular in Finance" },
      { role: "design", label: "Popular in Design" },
      { role: "software", label: "Popular in Software dev" }
    ];
    const DISCOVERY_ROW_SIZE = 10;

    function discoveryRowCerts(role) {
      return certificateData.filter(cert => cert.role === role).sort((a, b) => certRank(b, role) - certRank(a, role)).slice(0, DISCOVERY_ROW_SIZE);
    }

    function discoveryCardHtml(cert) {
      const saved = isSaved(cert.title);
      const cred = credentialOf(cert);
      const logo = domainLogo(cert.url);
      return `
        <article class="discovery-card" data-title="${cert.title}">
          <div class="discovery-image">
            ${logo ? `<img src="${logo}" alt="" loading="lazy" onerror="this.style.display='none'">` : ""}
            <span class="discovery-badge">${cred.label}</span>
            <button class="discovery-save${saved ? " is-saved" : ""}" type="button" data-save="${cert.title}" aria-label="${saved ? "Remove from my space" : "Add to my space"}" title="${saved ? "Saved - click to remove" : "Add to my space"}">${saved ? "&#10003;" : "&#43;"}</button>
          </div>
          <div class="discovery-body">
            <h4>${cert.title}</h4>
            <p class="discovery-provider">${cert.provider}</p>
          </div>
          <div class="discovery-foot">
            <span class="discovery-cred">${cert.hours} hrs</span>
            <span class="discovery-price">${costBadge(cert)}</span>
          </div>
        </article>`;
    }

    function renderDiscoveryRows() {
      const container = document.querySelector("#discoveryRows");
      if (!container) return;
      const rows = DISCOVERY_ROLES.map(({ role, label }) => ({ role, label, certs: discoveryRowCerts(role) })).filter(row => row.certs.length);
      if (!rows.length) { container.innerHTML = ""; return; }
      container.innerHTML = rows.map(row => `
        <section class="discovery-row" data-role="${row.role}">
          <div class="discovery-head">
            <h3>${row.label}</h3>
            <div class="discovery-nav">
              <button class="discovery-nav-btn" type="button" data-scroll="-1" aria-label="Scroll left">&#8592;</button>
              <button class="discovery-nav-btn" type="button" data-scroll="1" aria-label="Scroll right">&#8594;</button>
            </div>
          </div>
          <div class="discovery-track">
            ${row.certs.map(discoveryCardHtml).join("")}
          </div>
        </section>
      `).join("");
    }

    let deckIndex = 0;
    let deckOverrideList = null;
    const deckOverlayEl = document.querySelector("#deckOverlay");

    function deckOpen() { return !deckOverlayEl.hidden; }
    function activeMatches() { return deckOverrideList || getMatches(); }

    function openDeck(index, sourceRect) {
      deckIndex = index;
      deckOverlayEl.hidden = false;
      document.body.style.overflow = "hidden";
      renderDeckContent(sourceRect);
      const cert = activeMatches()[deckIndex];
      analytics.track("deck_opened", { role: cert ? cert.role : null, cert_title: cert ? cert.title : null, meta: { source: "catalog" } });
    }

    function closeDeck() {
      const card = document.querySelector("#deckCard");
      if (card) {
        card.style.transition = "transform 0.3s var(--ease-hover), opacity 0.3s var(--ease-hover)";
        card.style.transform = "scale(0.92) translateY(10px)";
        card.style.opacity = "0";
      }
      window.setTimeout(() => {
        deckOverlayEl.hidden = true;
        deckOverlayEl.innerHTML = "";
        document.body.style.overflow = "";
        deckOverrideList = null;
      }, card ? 220 : 0);
    }

    function renderDeckContent(sourceRect, enterDirection) {
      const matches = activeMatches();
      if (!matches.length) {
        deckOverlayEl.innerHTML = `<button class="deck-overlay-close" id="deckClose" aria-label="Close" type="button">&times;</button><p class="empty">No matches. Try clearing a filter.</p>`;
        return;
      }
      if (deckIndex >= matches.length) deckIndex = 0;
      if (deckIndex < 0) deckIndex = matches.length - 1;

      const completed = getCompleted();
      const outcomes = getOutcomes();
      const cert = matches[deckIndex];
      const done = completed.has(cert.title);
      const outcome = outcomes[cert.title];
      const saved = isSaved(cert.title);
      const cred = credentialOf(cert);
      const subjects = cert.subjects || [];
      const safeId = escapeHtml(cert.title).replace(/[^a-z0-9]/gi, "");

      deckOverlayEl.innerHTML = `
        <button class="deck-overlay-close" id="deckClose" aria-label="Close" type="button">&times;</button>
        <div class="deck-stack">
          ${matches.length > 2 ? `<div class="deck-ghost g2"></div>` : ""}
          ${matches.length > 1 ? `<div class="deck-ghost g1"></div>` : ""}
          <article class="deck-card" id="deckCard" data-title="${cert.title}">
            <div class="deck-head">
              ${tileHtml(cert, "deck-tile")}
              <div class="deck-titles">
                <span class="deck-provider">${cert.provider || ""}</span>
                <h3>${cert.title}</h3>
                <span class="cred ${cred.has ? "cred-yes" : "cred-no"}">${cred.label}</span>
              </div>
            </div>
            <p class="deck-line">${costBadge(cert)} &middot; ${cert.hours} hrs &middot; ${cert.level || "All levels"}${done ? ` &middot; <span class="done">&#10003; Completed</span>` : ""}</p>
            <p class="deck-value">${cert.value || ""}</p>
            ${subjects.length ? `<p class="deck-covers">Covers ${subjects.slice(0, 5).join(", ")}</p>` : ""}
            <p class="deck-proof"><strong>Proof to create:</strong> ${cert.proofTip || ""}</p>
            ${done ? (outcome
              ? `<p class="mini">Thanks - logged that it ${outcome === "yes" ? "helped you get shortlisted" : "has not helped yet"}.</p>`
              : `<div class="cert-actions">
                  <span class="mini">Did this help you get shortlisted?</span>
                  <button class="text-link" type="button" data-outcome="yes" data-outcome-cert="${cert.title}">Yes</button>
                  <button class="text-link" type="button" data-outcome="not-yet" data-outcome-cert="${cert.title}">Not yet</button>
                </div>`)
              : ""}
            ${done ? `<div class="li-post" id="liPost-${safeId}"><button class="text-link" type="button" data-linkedin="${cert.title}">Draft a LinkedIn post about this</button></div>` : ""}
            <div class="deck-foot">
              <span class="tag-chip">${cert.role}</span>
              <div style="display:flex; gap:8px; align-items:center;">
                <button class="text-link" type="button" data-cert="${cert.title}">Copy proof idea</button>
                <button class="text-link" type="button" data-done="${cert.title}">${done ? "Mark not done" : "Mark completed"}</button>
                <a class="icon-btn open-btn" href="${cert.url}" target="_blank" rel="noreferrer" data-open="${cert.title}" aria-label="Open course" title="Open course">&#8599;</a>
                <button class="save-toggle${saved ? " is-saved" : ""}" type="button" data-save="${cert.title}" aria-label="${saved ? "Remove from my space" : "Add to my space"}" title="${saved ? "Saved - click to remove" : "Add to my space"}">${saved ? "&#10003;" : "+"}</button>
              </div>
            </div>
          </article>
        </div>
        <div class="deck-controls">
          <button class="deck-nav-btn" type="button" id="deckPrev" aria-label="Previous card">&#8592;</button>
          <span class="deck-counter">${deckIndex + 1} of ${matches.length}</span>
          <button class="deck-nav-btn" type="button" id="deckNext" aria-label="Next card">&#8594;</button>
        </div>
      `;

      wireDeckSwipe();

      const cardEl = document.querySelector("#deckCard");
      if (sourceRect) {
        const destRect = cardEl.getBoundingClientRect();
        const dx = (sourceRect.left + sourceRect.width / 2) - (destRect.left + destRect.width / 2);
        const dy = (sourceRect.top + sourceRect.height / 2) - (destRect.top + destRect.height / 2);
        const scaleX = Math.max(0.2, sourceRect.width / destRect.width);
        const scaleY = Math.max(0.2, sourceRect.height / destRect.height);
        cardEl.style.transition = "none";
        cardEl.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
        cardEl.style.opacity = "0.6";
        void cardEl.offsetWidth;
        const settle = () => {
          cardEl.style.transition = "transform 0.45s var(--ease-spring), opacity 0.35s ease";
          cardEl.style.transform = "";
          cardEl.style.opacity = "1";
        };
        requestAnimationFrame(() => requestAnimationFrame(settle));
        window.setTimeout(settle, 60);
      } else if (enterDirection) {
        const fromX = enterDirection > 0 ? 26 : -26;
        cardEl.style.transition = "none";
        cardEl.style.transform = `translate(${fromX}px, 12px) scale(0.94) rotate(${enterDirection > 0 ? 3 : -3}deg)`;
        cardEl.style.opacity = "0.55";
        void cardEl.offsetWidth;
        const settle = () => {
          cardEl.style.transition = "transform 0.4s var(--ease-spring), opacity 0.3s ease";
          cardEl.style.transform = "";
          cardEl.style.opacity = "1";
        };
        requestAnimationFrame(() => requestAnimationFrame(settle));
        window.setTimeout(settle, 60);
      }
    }

    let deckStepLock = false;
    function stepDeck(delta) {
      if (deckStepLock) return;
      const matches = activeMatches();
      if (matches.length < 2) return;
      deckStepLock = true;
      window.setTimeout(() => { deckStepLock = false; }, 420);
      const card = document.querySelector("#deckCard");
      if (card) card.classList.add(delta > 0 ? "is-leaving-left" : "is-leaving-right");
      window.setTimeout(() => {
        deckIndex = (deckIndex + delta + matches.length) % matches.length;
        renderDeckContent(null, delta);
      }, card ? 200 : 0);
    }

    function wireDeckSwipe() {
      const card = document.querySelector("#deckCard");
      if (!card) return;
      let dragging = false, startX = 0, dx = 0;
      const threshold = 80;
      card.addEventListener("pointerdown", event => {
        if (deckStepLock) return;
        dragging = true; startX = event.clientX; dx = 0;
        card.style.transition = "none";
        card.setPointerCapture?.(event.pointerId);
      });
      card.addEventListener("pointermove", event => {
        if (!dragging) return;
        dx = event.clientX - startX;
        card.style.transform = `translateX(${dx}px) rotate(${dx / 24}deg)`;
      });
      function release() {
        if (!dragging) return;
        dragging = false;
        card.style.transition = "";
        card.style.transform = "";
        if (Math.abs(dx) > threshold) stepDeck(dx < 0 ? 1 : -1);
        dx = 0;
      }
      card.addEventListener("pointerup", release);
      card.addEventListener("pointerleave", release);
      card.addEventListener("pointercancel", release);
    }

    function onCardAction(event) {
      const outcomeBtn = event.target.closest("[data-outcome]");
      if (outcomeBtn) {
        const title = outcomeBtn.dataset.outcomeCert;
        const outcome = outcomeBtn.dataset.outcome;
        const cert = findCert(title);
        setOutcome(title, outcome);
        analytics.track("outcome_reported", { role: cert ? cert.role : null, cert_title: title, cert_provider: cert ? cert.provider : null, meta: { outcome, source: "catalog" } });
        showToast(outcome === "yes" ? "Great - thanks for sharing!" : "Thanks - keep building proof.");
        refreshAfterAction();
        return;
      }
      const openBtn = event.target.closest("[data-open]");
      if (openBtn) {
        const cert = findCert(openBtn.dataset.open);
        if (cert) analytics.track("cert_opened", { role: cert.role, cert_title: cert.title, cert_provider: cert.provider, meta: { source: "catalog" } });
        return;
      }
      const doneBtn = event.target.closest("[data-done]");
      if (doneBtn) {
        const completed = getCompleted();
        const title = doneBtn.dataset.done;
        const cert = findCert(title);
        if (completed.has(title)) { completed.delete(title); showToast("Marked as not done."); }
        else {
          completed.add(title); showToast("Nice - logged as completed.");
          analytics.track("cert_completed", { role: cert ? cert.role : null, cert_title: title, cert_provider: cert ? cert.provider : null, meta: { source: "catalog" } });
        }
        setCompleted(completed);
        refreshAfterAction();
        return;
      }
      const copyBtn = event.target.closest("[data-cert]");
      if (copyBtn) {
        const cert = findCert(copyBtn.dataset.cert);
        if (!cert) return;
        analytics.track("proof_idea_copied", { role: cert.role, cert_title: cert.title, cert_provider: cert.provider, meta: { source: "catalog" } });
        navigator.clipboard.writeText(`${cert.title}: ${cert.proofTip}`).then(
          () => showToast("Proof idea copied."),
          () => showToast("Copy failed in this browser.")
        );
        return;
      }
      const saveBtnEl = event.target.closest("[data-save]");
      if (saveBtnEl) {
        const cert = findCert(saveBtnEl.dataset.save);
        if (!cert) return;
        const nowSaved = toggleSaved(cert);
        showToast(nowSaved ? "Added to your space." : "Removed from your space.");
        refreshAfterAction();
        return;
      }
      const liBtn = event.target.closest("[data-linkedin]");
      if (liBtn) {
        const cert = findCert(liBtn.dataset.linkedin);
        if (cert) draftLinkedInPost(cert, liBtn.closest(".li-post"));
        return;
      }
    }

    function refreshAfterAction() {
      renderCertificates();
      renderDiscoveryRows();
      if (deckOpen()) renderDeckContent();
    }

    async function loadCatalog() {
      const grid = document.querySelector("#certificateGrid");
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/certificates?select=*&order=role.asc`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const rows = await res.json();
        certificateData = (rows || []).map(normalizeCert);
        if (!certificateData.length) throw new Error("empty");
        renderCertificates();
        renderDiscoveryRows();
        return;
      } catch (error) { /* fall through to the static fallback below */ }
      try {
        const res = await fetch("/catalog-data.json");
        if (!res.ok) throw new Error("HTTP " + res.status);
        const rows = await res.json();
        certificateData = (rows || []).map(cert => ({ ...cert, hours: cert.hours == null ? null : Number(cert.hours) }));
        if (!certificateData.length) throw new Error("empty");
        renderCertificates();
        renderDiscoveryRows();
      } catch (error) {
        document.querySelector("#certCount").textContent = "Unavailable";
        grid.innerHTML = `<p class="empty">Couldn't load the catalog right now. Try the <a href="/">certificate finder on the home page</a>.</p>`;
      }
    }

    const onFilterInput = () => { deckIndex = 0; renderCertificates(); };
    [certSearch, certRole, certCost, certTime].forEach(control => control.addEventListener("input", onFilterInput));

    const discoveryRowsEl = document.querySelector("#discoveryRows");
    const onDiscoveryClick = event => {
      const scrollBtn = event.target.closest("[data-scroll]");
      if (scrollBtn) {
        const track = scrollBtn.closest(".discovery-row").querySelector(".discovery-track");
        track.scrollBy({ left: Number(scrollBtn.dataset.scroll) * track.clientWidth * 0.85, behavior: "smooth" });
        return;
      }
      if (event.target.closest("[data-save]")) { onCardAction(event); return; }
      onCardAction(event);
      const card = event.target.closest(".discovery-card");
      if (card && !event.target.closest("a, button")) {
        const role = card.closest(".discovery-row").dataset.role;
        const rowCerts = discoveryRowCerts(role);
        const idx = rowCerts.findIndex(c => c.title === card.dataset.title);
        if (idx >= 0) {
          deckOverrideList = rowCerts;
          openDeck(idx, card.getBoundingClientRect());
        }
      }
    };
    discoveryRowsEl.addEventListener("click", onDiscoveryClick);

    const onDeckOverlayClick = event => {
      if (event.target === deckOverlayEl) { closeDeck(); return; }
      if (event.target.closest("#deckClose")) { closeDeck(); return; }
      if (event.target.closest("#deckPrev")) { stepDeck(-1); return; }
      if (event.target.closest("#deckNext")) { stepDeck(1); return; }
      onCardAction(event);
    };
    deckOverlayEl.addEventListener("click", onDeckOverlayClick);

    const onDeckWheel = event => {
      if (!deckOpen()) return;
      event.preventDefault();
      const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (Math.abs(delta) < 12) return;
      stepDeck(delta > 0 ? 1 : -1);
    };
    deckOverlayEl.addEventListener("wheel", onDeckWheel, { passive: false });

    const onKeydown = event => {
      if (!deckOpen()) return;
      if (/input|textarea|select/i.test(event.target.tagName)) return;
      if (event.key === "Escape") { closeDeck(); return; }
      if (event.key === "ArrowRight") stepDeck(1);
      if (event.key === "ArrowLeft") stepDeck(-1);
    };
    document.addEventListener("keydown", onKeydown);

    const gridEl = document.querySelector("#certificateGrid");
    const onGridClick = event => {
      onCardAction(event);
      const card = event.target.closest(".cert-card");
      if (card && !event.target.closest("a, button")) {
        const matches = getMatches();
        const idx = matches.findIndex(c => c.title === card.dataset.title);
        if (idx >= 0) openDeck(idx, card.getBoundingClientRect());
      }
    };
    gridEl.addEventListener("click", onGridClick);

    updateSpaceBadge();
    loadCatalog();

    return () => {
      [certSearch, certRole, certCost, certTime].forEach(control => control.removeEventListener("input", onFilterInput));
      discoveryRowsEl.removeEventListener("click", onDiscoveryClick);
      deckOverlayEl.removeEventListener("click", onDeckOverlayClick);
      deckOverlayEl.removeEventListener("wheel", onDeckWheel);
      document.removeEventListener("keydown", onKeydown);
      gridEl.removeEventListener("click", onGridClick);
    };
  }, []);

  return (
    <>
      <DotGrid />
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
            <SpecularBtn as="a" href="/how-it-works" variant="ghost">How it works</SpecularBtn>
            <SpecularBtn as="a" href="/profile" variant="plain" className="nav-btn-badge">My space<span className="badge-count" id="spaceBadge" hidden>0</span></SpecularBtn>
            <SpecularBtn as="a" href="/" variant="primary">Get certificates picked for me</SpecularBtn>
          </div>
        </nav>

        <main>
          <section style={{ padding: "clamp(20px, 4vw, 44px) 0 clamp(8px, 2vw, 16px)" }}>
            <h1>Browse every certification, ranked by proof value.</h1>
            <p className="lede">Free and low-cost certifications across six internship tracks - each one tells you the exact proof to build after, so it actually helps you get shortlisted.</p>
          </section>

          <div id="discoveryRows"></div>

          <section className="panel section" aria-labelledby="catalogTitle">
            <div className="section-head">
              <div>
                <h2 id="catalogTitle">Find a certificate</h2>
                <p>Filter by track, cost, and time. Click a card for topics and the proof to build.</p>
              </div>
              <span className="pill" id="certCount">Loading…</span>
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
        </main>
      </div>

      <div className="deck-overlay" id="deckOverlay" hidden></div>
      <div className="toast" id="toast" role="status" aria-live="polite"></div>
    </>
  );
}
