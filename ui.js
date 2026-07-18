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

/* Ambient dot-grid background: a fixed, full-viewport canvas of faint dots that
   drift brighter and repel slightly near the cursor. Lives directly on <body>
   (never inside .app) so it can't be caught by a transformed ancestor, and is
   pointer-events:none so it never intercepts clicks. Ported from a per-dot
   framer-motion component into one canvas draw loop for real performance at
   this dot density. */
(function () {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.id = "bg-dots";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed; inset:0; z-index:-1; pointer-events:none; display:block;";
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");

  const SPACING = 26;
  const DOT_RADIUS = 1.3;
  const REPEL_RADIUS = 90;
  const REPEL_STRENGTH = 14;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let w = 0, h = 0;
  let mouseX = -9999, mouseY = -9999;
  let idleFrames = 0;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("mousemove", event => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    idleFrames = 0;
  }, { passive: true });
  window.addEventListener("mouseleave", () => { mouseX = -9999; mouseY = -9999; });

  const dotColor = "148, 163, 184"; // slate-400, matches --muted family

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const hasCursor = mouseX > -1000;
    if (hasCursor) idleFrames++;
    const activeCursor = hasCursor && idleFrames < 600; // fade tracking after ~10s idle

    for (let y = 0; y <= h + SPACING; y += SPACING) {
      for (let x = 0; x <= w + SPACING; x += SPACING) {
        let dx = 0, dy = 0, boost = 0;
        if (activeCursor) {
          const distX = x - mouseX, distY = y - mouseY;
          const dist = Math.sqrt(distX * distX + distY * distY);
          if (dist < REPEL_RADIUS) {
            const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
            const angle = Math.atan2(distY, distX);
            dx = Math.cos(angle) * force;
            dy = Math.sin(angle) * force;
            boost = (1 - dist / REPEL_RADIUS) * 0.5;
          }
        }
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotColor}, ${(0.16 + boost).toFixed(3)})`;
        ctx.fill();
      }
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
