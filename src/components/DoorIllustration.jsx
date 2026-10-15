import React from "react";

export function DoorIllustration({ state = "closed", size = 64 }) {
  const isOpen = state === "open";

  return (
    <div className={`door-illustration-wrap state-${state}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="door-svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="doorFrameGrad" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#334155" />
            <stop offset="1" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="doorLeafGrad" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor={isOpen ? "#f59e0b" : "#3b82f6"} />
            <stop offset="1" stopColor={isOpen ? "#d97706" : "#1d4ed8"} />
          </linearGradient>
          <radialGradient id="interiorLight" cx="30" cy="32" r="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef08a" stopOpacity="0.45" />
            <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Frame Wall */}
        <rect x="12" y="8" width="40" height="48" rx="4" fill="url(#doorFrameGrad)" stroke="#475569" strokeWidth="1.5" />

        {/* Interior Threshold / Room Void */}
        <rect x="16" y="12" width="32" height="44" rx="2" fill={isOpen ? "#451a03" : "#0f172a"} />

        {/* Warm light spill when open */}
        {isOpen && (
          <path
            d="M16 12L48 12L58 56L6 56Z"
            fill="url(#interiorLight)"
            className="door-light-spill"
          />
        )}

        {/* Door Leaf (swings open via CSS 3D transform) */}
        <g className={`door-leaf-group ${isOpen ? "door-open" : "door-closed"}`}>
          <rect
            x="16"
            y="12"
            width="32"
            height="44"
            rx="2"
            fill="url(#doorLeafGrad)"
            stroke={isOpen ? "#fbbf24" : "#60a5fa"}
            strokeWidth="1.2"
          />
          {/* Decorative Door Panels */}
          <rect x="20" y="16" width="24" height="16" rx="2" fill="rgba(255, 255, 255, 0.12)" />
          <rect x="20" y="36" width="24" height="16" rx="2" fill="rgba(255, 255, 255, 0.12)" />
          {/* Handle */}
          <circle cx="43" cy="34" r="2.2" fill="#f8fafc" />
          <path d="M43 34H40" stroke="#f8fafc" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Status Indicator Pip at bottom of door */}
        <circle cx="32" cy="58" r="2.5" fill={isOpen ? "#f59e0b" : "#10b981"} />
      </svg>
    </div>
  );
}
