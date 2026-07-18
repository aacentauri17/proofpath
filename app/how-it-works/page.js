"use client";

import DotGrid from "../../components/DotGrid";
import SpecularBtn from "../../components/SpecularBtn";
import { useSiteChrome } from "../../lib/siteChrome";

export default function HowItWorksPage() {
  useSiteChrome();

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
            <SpecularBtn as="a" href="/catalog" variant="ghost">Browse certificates</SpecularBtn>
            <SpecularBtn as="a" href="/" variant="primary">Build your proof profile</SpecularBtn>
          </div>
        </nav>

        <main>
          <section style={{ padding: "clamp(24px, 5vw, 56px) 0 clamp(8px, 2vw, 16px)" }}>
            <h1>Every certificate worth doing, and your road through them.</h1>
            <p className="lede">CredKit is a free database of 150+ certifications across marketing, data, product, finance, design, and software - with picks matched to you and a saved road you can tick off as you go.</p>
          </section>

          <section className="growth" aria-label="The four steps">
            <div>
              <h2>Four steps, about two minutes</h2>
              <p className="lede">Stop guessing which course to take next. Pick a road and finish it.</p>
              <SpecularBtn as="a" href="/" variant="primary" style={{ marginTop: 18 }}>Get your picks</SpecularBtn>
            </div>
            <ul className="growth-list">
              <li><strong>1. Browse the catalog:</strong> 150+ free and low-cost certifications, filterable by role, cost, and time - each with what it covers and whether it grants a real certificate.</li>
              <li><strong>2. Tell us about you:</strong> your degree, target role, and what you&apos;ve already done. We use it to pick the certificates that fit you best.</li>
              <li><strong>3. Save your road:</strong> keep your picks as a road - like &quot;Road to Marketing&quot; - and mark each certificate done as you finish it.</li>
              <li><strong>4. Turn certs into proof:</strong> every certificate comes with a concrete artefact to build after - a teardown, dashboard, or case study that recruiters can actually see.</li>
            </ul>
          </section>

          <section className="growth" aria-label="Why proof">
            <div>
              <h2>Why proof beats courses</h2>
              <p className="lede">Recruiters cannot tell who actually learned something from a certificate alone.</p>
            </div>
            <ul className="growth-list">
              <li><strong>Certificates are table stakes.</strong> A certificate with no applied work looks the same as everyone else&apos;s.</li>
              <li><strong>Visible work travels.</strong> A teardown, dashboard, or case study can be seen, shared, and remembered.</li>
              <li><strong>Proof compounds.</strong> Certificate + project + post is a trio that is hard to fake and easy to shortlist.</li>
            </ul>
          </section>

          <section style={{ padding: "clamp(24px, 5vw, 54px) 0 clamp(28px, 6vw, 64px)", borderTop: "1px solid var(--line)", marginTop: "clamp(20px, 5vw, 54px)" }}>
            <h2>Ready to start your road?</h2>
            <p className="lede" style={{ marginBottom: 18 }}>It is free, private, and takes about two minutes.</p>
            <SpecularBtn as="a" href="/" variant="primary">Get your picks</SpecularBtn>
          </section>
        </main>
      </div>
    </>
  );
}
