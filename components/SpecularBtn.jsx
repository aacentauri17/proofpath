"use client";

import { useRef, useState } from "react";
import SpecularFX from "./SpecularFX";

// Real React wrapper around the site's .btn styling that adds the specular
// rim-light shader as a proper child, instead of the DOM-decoration hack the
// static-site version needed. Every prop (id, onClick, type, href...) forwards
// straight to the underlying element, so existing wiring keeps working.
export default function SpecularBtn({ as: Tag = "button", variant = "ghost", className = "", children, ...props }) {
  const ref = useRef(null);
  const [mounted, setMounted] = useState(false);
  const variantClass = variant === "plain" ? "" : variant;

  return (
    <Tag
      ref={node => {
        ref.current = node;
        if (node && !mounted) setMounted(true);
      }}
      className={`btn ${variantClass} specular-active ${className}`.replace(/\s+/g, " ").trim()}
      {...props}
    >
      <span className="specular-button__fx" aria-hidden="true">
        {mounted && (
          <SpecularFX
            btnEl={ref.current}
            lineColor={variant === "primary" ? "#ffffff" : "#e8b98a"}
            baseColor={variant === "primary" ? "#7a4420" : "#4b4b4b"}
            intensity={variant === "primary" ? 1 : 0.6}
            proximity={220}
          />
        )}
      </span>
      <span className="specular-button__label">{children}</span>
    </Tag>
  );
}
