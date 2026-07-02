import React from "react";

/** Capsule-shaped PharmaCare brand mark */
export function CapsuleIcon({ size = 28, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#capsule-bg)" />
      <rect x="8" y="10" width="16" height="12" rx="6" fill="#ffffff" opacity="0.95" />
      <rect x="8" y="10" width="8" height="12" rx="6" fill="#ffffff" />
      <rect x="16" y="10" width="8" height="12" rx="6" fill="#34d399" />
      <line x1="16" y1="10" x2="16" y2="22" stroke="#059669" strokeWidth="1.5" />
      <defs>
        <linearGradient id="capsule-bg" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--primary, #2563eb)" />
          <stop offset="1" stopColor="var(--slate, #334155)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function BrandLogo({ size = 28, showText = true, textSize = 16 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <CapsuleIcon size={size} />
      {showText && (
        <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: textSize, color: "var(--text, #0f172a)" }}>
          PharmaCare
        </span>
      )}
    </div>
  );
}
