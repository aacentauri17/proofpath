import { createRoot } from "react-dom/client";
import DarkVeil from "./components/DarkVeil.jsx";
import SpecularFX from "./components/SpecularFX.jsx";

function mountDarkVeil() {
  const el = document.getElementById("darkveil-root");
  if (!el) return;
  createRoot(el).render(
    <DarkVeil hueShift={18} noiseIntensity={0.035} scanlineIntensity={0} speed={0.3} warpAmount={0.55} resolutionScale={1} />
  );
}

// Decorates an existing .btn element with the specular rim-light effect in
// place - wraps its current children (text, icons, badge counts) in a label
// span so they stack above the effect canvas, then mounts SpecularFX into a
// sibling fx span. Every id, form-submit type, and event listener on the
// original element is left untouched.
function decorate(btn) {
  if (btn.dataset.specularDone) return;
  btn.dataset.specularDone = "1";

  const isPrimary = btn.classList.contains("primary");
  const label = document.createElement("span");
  label.className = "specular-button__label";
  while (btn.firstChild) label.appendChild(btn.firstChild);

  const fx = document.createElement("span");
  fx.className = "specular-button__fx";
  fx.setAttribute("aria-hidden", "true");

  btn.appendChild(fx);
  btn.appendChild(label);
  btn.classList.add("specular-active");

  createRoot(fx).render(
    <SpecularFX
      btnEl={btn}
      lineColor={isPrimary ? "#ffffff" : "#e8b98a"}
      baseColor={isPrimary ? "#7a4420" : "#4b4b4b"}
      intensity={isPrimary ? 1 : 0.6}
      proximity={220}
    />
  );
}

function decorateAll() {
  document.querySelectorAll(".btn").forEach(decorate);
}

function mountSpecularButtons() {
  decorateAll();
  // Covers buttons rendered after load (e.g. the "Save as my Road to X" CTA
  // built from a template string once recommendations come back).
  const mo = new MutationObserver(() => decorateAll());
  mo.observe(document.body, { childList: true, subtree: true });
}

mountDarkVeil();
mountSpecularButtons();
