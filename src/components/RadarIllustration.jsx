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
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="targetGlow" cx="32" cy="24" r="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Housing Ring */}
        <circle cx="32" cy="32" r="29" fill="#091322" stroke="#1e293b" strokeWidth="2" />

        {/* Concentric Radar Range Rings */}
        <circle cx="32" cy="32" r="22" stroke="#1e3a5f" strokeWidth="1" strokeDasharray="2 3" opacity="0.8" />
        <circle cx="32" cy="32" r="14" stroke="#1e3a5f" strokeWidth="1" strokeDasharray="2 3" opacity="0.8" />
        <circle cx="32" cy="32" r="6" stroke="#1e3a5f" strokeWidth="1" opacity="0.6" />

        {/* Crosshair Axes */}
        <line x1="32" y1="4" x2="32" y2="60" stroke="#1e3a5f" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="4" y1="32" x2="60" y2="32" stroke="#1e3a5f" strokeWidth="1" strokeOpacity="0.5" />

        {/* Rotating Radar Sweep Beam */}
        <g className="radar-sweep-group">
          <path d="M32 32L60 32A28 28 0 0 0 32 4Z" fill="url(#radarSweep)" opacity="0.75" />
          <line x1="32" y1="32" x2="60" y2="32" stroke="#22d3ee" strokeWidth="1.5" />
        </g>

        {/* Target Indicator when person is detected */}
        {detected ? (
          <g className="target-signature">
            {/* Pulsing Target Halo */}
            <circle cx="32" cy="22" r="12" fill="url(#targetGlow)" className="target-pulse" />
            <circle cx="32" cy="22" r="8" stroke="#f43f5e" strokeWidth="1.5" className="target-bracket" />
            <circle cx="32" cy="22" r="3" fill="#fb7185" />

            {/* Target Reticle Brackets */}
            <path d="M26 19V16H29" stroke="#fda4af" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M35 16H38V19" stroke="#fda4af" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M38 25V28H35" stroke="#fda4af" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M29 28H26V25" stroke="#fda4af" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        ) : (
          /* Center Transceiver Dot */
          <circle cx="32" cy="32" r="2.5" fill="#38bdf8" />
        )}
      </svg>
    </div>
  );
}
