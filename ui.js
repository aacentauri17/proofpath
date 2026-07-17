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

/* Floating glass nav: hides on scroll-down past a threshold, reappears on
   scroll-up or when the cursor nears the very top of the viewport. */
(function () {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  let lastY = window.scrollY;
  const HIDE_AFTER = 90; // px scrolled before the nav is allowed to hide

  function show() { nav.classList.remove("nav-hidden"); }
  function hide() { nav.classList.add("nav-hidden"); }

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (y <= HIDE_AFTER) { show(); lastY = y; return; }
    if (y > lastY) hide();       // scrolling down
    else if (y < lastY) show();  // scrolling up
    lastY = y;
  }, { passive: true });

  window.addEventListener("mousemove", event => {
    if (event.clientY <= 24) show();
  });
})();
