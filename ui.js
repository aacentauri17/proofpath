/* CredKit shared motion: staggered scroll reveals (spring feel via CSS vars in
   styles.css). Panels, hero children, and growth rows get [data-reveal]; an
   IntersectionObserver flips .rv-in once, with a small per-sibling stagger. */
(function () {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const targets = document.querySelectorAll(".hero > *, .panel, .growth-list li, .growth > div");
  let i = 0;
  targets.forEach(el => {
    el.setAttribute("data-reveal", "");
    el.style.setProperty("--rv-delay", `${Math.min(i * 70, 350)}ms`);
    i++;
  });

  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("rv-in");
        io.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08 });

  targets.forEach(el => io.observe(el));
})();
