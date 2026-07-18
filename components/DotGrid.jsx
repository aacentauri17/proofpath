"use client";

import { useEffect, useRef } from "react";

// Ambient dot-grid background: a fixed, full-viewport canvas of faint dots
// that drift brighter and repel slightly near the cursor. Used on every page
// except the homepage (which uses DarkVeil instead). Ported 1:1 from the
// static site's ui.js canvas loop.
export default function DotGrid() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const SPACING = 26;
    const DOT_RADIUS = 1.3;
    const REPEL_RADIUS = 90;
    const REPEL_STRENGTH = 14;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0, h = 0;
    let mouseX = -9999, mouseY = -9999;
    let idleFrames = 0;
    let raf = 0;

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

    const onMouseMove = event => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      idleFrames = 0;
    };
    const onMouseLeave = () => { mouseX = -9999; mouseY = -9999; };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave);

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
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="bg-dots"
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none", display: "block" }}
    />
  );
}
