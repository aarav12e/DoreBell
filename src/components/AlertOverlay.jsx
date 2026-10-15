import React, { useEffect, useState } from "react";
import { BellIllustration } from "./BellIllustration";

export function AlertOverlay({
  active,
  timestamp,
  mode = "ambient",
  onDismiss,
  vibrateEnabled = true,
  soundEnabled = false,
}) {
  const [elapsed, setElapsed] = useState(0);

  // Keyboard shortcut: Space, Escape, or Enter to dismiss
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, onDismiss]);

  // Elapsed timer
  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const start = timestamp || Date.now();
    const updateElapsed = () => {
      const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
      setElapsed(diff);
    };
    updateElapsed();
    const timer = setInterval(updateElapsed, 500);
    return () => clearInterval(timer);
  }, [active, timestamp]);

  if (!active) return null;

  const timeString = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "Just now";

  return (
    <div
      className={`alert-backdrop alert-mode-${mode}`}
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
      aria-label="Visitor at the door alert"
    >
      {/* Background visual effects based on mode */}
      <div className="alert-fx-container" aria-hidden="true">
        <div className="alert-fx-pulse ring-1" />
        <div className="alert-fx-pulse ring-2" />
        <div className="alert-fx-pulse ring-3" />
      </div>

      <div className="alert-card">
        <div className="alert-badge">
          <span className="live-dot" />
          VISUAL ALERT &middot; {elapsed > 0 ? `RINGING FOR ${elapsed}s` : "ACTIVE NOW"}
        </div>

        <div className="alert-hero-visual">
          <BellIllustration ringing={true} size={110} />
        </div>

        <h1 className="alert-title">Someone is at the Door!</h1>
        <p className="alert-description">
          The silent doorbell was pressed at <strong className="alert-time">{timeString}</strong>.
        </p>

        {/* Signals fired */}
        <div className="alert-signals-row">
          <span className={`signal-tag ${vibrateEnabled ? "active" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
              <path d="M1 9l2 3-2 3M23 9l-2 3 2 3" />
            </svg>
            Haptics Active
          </span>
          <span className={`signal-tag ${soundEnabled ? "active" : "muted"}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            {soundEnabled ? "Audio On" : "Audio Muted"}
          </span>
          <span className="signal-tag hint">
            Press <kbd>Space</kbd> or <kbd>Esc</kbd> to dismiss
          </span>
        </div>

        <button
          className="alert-dismiss-btn"
          onClick={onDismiss}
          autoFocus
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Got it — Dismiss Alert
        </button>
      </div>
    </div>
  );
}
