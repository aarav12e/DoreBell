import React from "react";

export function BellIllustration({ ringing = false, size = 64 }) {
  return (
    <div className={`bell-illustration-wrap ${ringing ? "is-ringing" : ""}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="bell-svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bellGrad" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor={ringing ? "#fde047" : "#38bdf8"} />
            <stop offset="1" stopColor={ringing ? "#f59e0b" : "#0284c7"} />
          </linearGradient>
          <filter id="bellGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={ringing ? "3" : "1"} result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Shockwave Rings when ringing */}
        {ringing && (
          <>
            <circle cx="32" cy="32" r="28" stroke="url(#bellGrad)" strokeWidth="1.5" className="shockwave sw-1" opacity="0.6" />
            <circle cx="32" cy="32" r="24" stroke="url(#bellGrad)" strokeWidth="1.5" className="shockwave sw-2" opacity="0.8" />
          </>
        )}

        {/* Bell Body Group */}
        <g className="bell-body-group" filter="url(#bellGlow)">
          {/* Bell Top Loop */}
          <path
            d="M28 14C28 11.7909 29.7909 10 32 10C34.2091 10 36 11.7909 36 14V16H28V14Z"
            fill={ringing ? "#fbbf24" : "#7dd3fc"}
          />
          {/* Bell Main Dome */}
          <path
            d="M32 16C22.0589 16 18 25.5 18 36C18 41 15 45 14 47C17 48 24 49 32 49C40 49 47 48 50 47C49 45 46 41 46 36C46 25.5 41.9411 16 32 16Z"
            fill="url(#bellGrad)"
          />
          {/* Bottom Lip Highlight */}
          <ellipse cx="32" cy="48" rx="17" ry="2.5" fill={ringing ? "#fef08a" : "#bae6fd"} opacity="0.8" />
          {/* Clapper */}
          <ellipse
            cx="32"
            cy="52"
            rx="4.5"
            ry="4"
            fill={ringing ? "#d97706" : "#0369a1"}
            className="bell-clapper"
          />
        </g>
      </svg>
    </div>
  );
}
