import React from "react";

export function RadarIllustration({ detected = false, size = 64 }) {
  return (
    <div className={`radar-illustration-wrap ${detected ? "has-target" : "is-scanning"}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="radar-svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="radarSweep" cx="32" cy="32" r="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="targetGlow" cx="32" cy="24" r="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e11d48" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Housing Ring */}
        <circle
          cx="32"
          cy="32"
          r="29"
          fill="var(--radar-housing-bg, #e2e8f0)"
          stroke="var(--radar-housing-border, #cbd5e1)"
          strokeWidth="2"
        />

        {/* Concentric Radar Range Rings */}
        <circle cx="32" cy="32" r="22" stroke="var(--radar-ring-color, #94a3b8)" strokeWidth="1" strokeDasharray="2 3" opacity="0.85" />
        <circle cx="32" cy="32" r="14" stroke="var(--radar-ring-color, #94a3b8)" strokeWidth="1" strokeDasharray="2 3" opacity="0.85" />
        <circle cx="32" cy="32" r="6" stroke="var(--radar-ring-color, #94a3b8)" strokeWidth="1" opacity="0.7" />

        {/* Crosshair Axes */}
        <line x1="32" y1="4" x2="32" y2="60" stroke="var(--radar-ring-color, #94a3b8)" strokeWidth="1" strokeOpacity="0.6" />
        <line x1="4" y1="32" x2="60" y2="32" stroke="var(--radar-ring-color, #94a3b8)" strokeWidth="1" strokeOpacity="0.6" />

        {/* Rotating Radar Sweep Beam */}
        <g className="radar-sweep-group">
          <path d="M32 32L60 32A28 28 0 0 0 32 4Z" fill="url(#radarSweep)" opacity="0.85" />
          <line x1="32" y1="32" x2="60" y2="32" stroke="#0284c7" strokeWidth="1.5" />
        </g>

        {/* Target Indicator when person is detected */}
        {detected ? (
          <g className="target-signature">
            {/* Pulsing Target Halo */}
            <circle cx="32" cy="22" r="12" fill="url(#targetGlow)" className="target-pulse" />
            <circle cx="32" cy="22" r="8" stroke="#e11d48" strokeWidth="1.5" className="target-bracket" />
            <circle cx="32" cy="22" r="3" fill="#f43f5e" />

            {/* Target Reticle Brackets */}
            <path d="M26 19V16H29" stroke="#fda4af" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M35 16H38V19" stroke="#fda4af" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M38 25V28H35" stroke="#fda4af" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M29 28H26V25" stroke="#fda4af" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        ) : (
          /* Center Transceiver Dot */
          <circle cx="32" cy="32" r="2.5" fill="#0284c7" />
        )}
      </svg>
    </div>
  );
}
