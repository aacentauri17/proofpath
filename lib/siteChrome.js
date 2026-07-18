"use client";

import { useEffect } from "react";

// Ported 1:1 from the static site's ui.js: staggered scroll-reveal on the
// hero/panels/growth rows, and the floating nav's hide-on-scroll-down /
// show-on-scroll-up behavior. Call once per page component.
export function useSiteChrome() {
  useEffect(() => {
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let io;
    if (!reduceMotion) {
      const targets = document.querySelectorAll(".hero > *, .panel, .growth-list li, .growth > div");
      let i = 0;
      targets.forEach(el => {
        el.setAttribute("data-reveal", "");
        el.style.setProperty("--rv-delay", `${Math.min(i * 70, 350)}ms`);
        i++;
      });

      io = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("rv-in");
            io.unobserve(entry.target);
          }
        }
      }, { threshold: 0.08 });

      targets.forEach(el => io.observe(el));
    }

    const nav = document.querySelector(".nav");
    let lastY = window.scrollY;
    const HIDE_AFTER = 90;

    function show() { nav && nav.classList.remove("nav-hidden"); }
    function hide() { nav && nav.classList.add("nav-hidden"); }

    const onScroll = () => {
      const y = window.scrollY;
      if (y <= HIDE_AFTER) { show(); lastY = y; return; }
      if (y > lastY) hide();
      else if (y < lastY) show();
      lastY = y;
    };
    const onMouseMove = event => { if (event.clientY <= 24) show(); };

    if (nav) {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("mousemove", onMouseMove);
    }

    return () => {
      if (io) io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);
}
