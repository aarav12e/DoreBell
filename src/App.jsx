import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDoor } from "./useDoor";
import { BellIllustration } from "./components/BellIllustration";
import { DoorIllustration } from "./components/DoorIllustration";
import { RadarIllustration } from "./components/RadarIllustration";
import { AlertOverlay } from "./components/AlertOverlay";
import { ActivityLog } from "./components/ActivityLog";
import { SettingsPanel } from "./components/SettingsPanel";
import { SimulationBar } from "./components/SimulationBar";
import { playChime } from "./sound";

const SETTINGS_KEY = "silent-doorbell-settings-v2";

const DEFAULT_SETTINGS = {
  vibrate: true,
  vibratePattern: "standard",
  sound: false,
  soundPreset: "ding-dong",
  volume: 0.6,
  notify: false,
  alertMode: "ambient", // 'ambient' | 'strobe' | 'banner' | 'spotlight'
  highContrast: false,
  reducedMotion: false,
};

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function timeAgo(ts, now) {
  if (!ts) return "No rings yet";
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString();
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [now, setNow] = useState(Date.now());
  const [testAlertActive, setTestAlertActive] = useState(false);
  const [showSimBar, setShowSimBar] = useState(true);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Handle incoming events (sound, vibration, notifications)
  const handleEvent = useCallback((evt) => {
    const s = settingsRef.current;
    if (evt.type === "bell") {
      // Haptics
      if (s.vibrate && navigator.vibrate) {
        if (s.vibratePattern === "short") {
          navigator.vibrate([200]);
        } else if (s.vibratePattern === "sos") {
          navigator.vibrate([150, 100, 150, 100, 150, 200, 400, 150, 400]);
        } else {
          navigator.vibrate([400, 150, 400, 150, 400]);
        }
      }
      // Audio
      if (s.sound) {
        playChime(s.soundPreset, s.volume);
      }
    }

    // Push notification
    if (s.notify && "Notification" in window && Notification.permission === "granted") {
      if (evt.type === "bell") {
        try {
          new Notification("🔔 Doorbell Ringing!", {
            body: "Someone is at the door right now.",
            tag: "silent-doorbell-ring",
            requireInteraction: true,
          });
        } catch {
          /* ignore */
        }
      } else if (evt.type === "person_arrived") {
        try {
          new Notification("🧍 Visitor Detected", {
            body: "Motion sensed at the door.",
            tag: "silent-doorbell-motion",
          });
        } catch {
          /* ignore */
        }
      }
    }
  }, []);

  const {
    door,
    connected,
    lastSeen,
    history,
    alertActive,
    dismiss,
    clearHistory,
    simulate,
    demo,
    doorOpenSince,
    stats,
  } = useDoor(handleEvent);

  // Auto-updating clock ticker
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  // Tab Title & Favicon alert
  const effectiveAlertActive = alertActive || testAlertActive;

  useEffect(() => {
    document.title = effectiveAlertActive
      ? "🔔 [VISITOR AT THE DOOR] — Silent Doorbell"
      : "Silent Doorbell · Accessible Alert System";
  }, [effectiveAlertActive]);

  const handleDismissAll = () => {
    dismiss();
    setTestAlertActive(false);
  };

  const doorOpenSeconds = door.state === "open" && doorOpenSince
    ? Math.max(0, Math.floor((now - doorOpenSince) / 1000))
    : 0;

  return (
    <div
      className={`app-container ${settings.highContrast ? "high-contrast" : ""} ${
        settings.reducedMotion ? "reduced-motion" : ""
      }`}
    >
      {/* Visual Alert Overlay (Fullscreen / Strobe / Ambient / HUD) */}
      <AlertOverlay
        active={effectiveAlertActive}
        timestamp={alertActive ? door.bell.ts : Date.now()}
        mode={settings.alertMode}
        onDismiss={handleDismissAll}
        vibrateEnabled={settings.vibrate}
        soundEnabled={settings.sound}
      />

      {/* Main App Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo-wrap">
            <span className="brand-pulse-ring" />
            <span className="brand-icon">🔔</span>
          </div>
          <div>
            <div className="eyebrow-tag">Accessibility &amp; Inclusion &middot; PS4</div>
            <h1 className="brand-title">The Doorbell Nobody Can Hear</h1>
            <p className="brand-desc">
              Visual, vibrating &amp; on-screen alerts designed for deaf &amp; quiet living
            </p>
          </div>
        </div>

        <div className="header-meta">
          {/* Connection status badge */}
          <div className={`status-pill ${connected ? "status-connected" : "status-disconnected"}`}>
            <span className="status-dot" />
            <div className="status-pill-info">
              <span className="status-text">{demo ? "Demo Simulator" : connected ? "Firebase Live" : "Offline"}</span>
              <span className="status-sub">{demo ? "Hardware Emulated" : "RTDB Synced"}</span>
            </div>
          </div>

          {/* Quick Header Controls */}
          <div className="header-controls">
            <button
              className={`header-btn ${settings.sound ? "btn-active" : ""}`}
              onClick={() => setSettings((s) => ({ ...s, sound: !s.sound }))}
              title={settings.sound ? "Sound is active (Click to mute)" : "Sound is muted (Click to enable)"}
            >
              {settings.sound ? "🔊 Audio On" : "🔇 Silent"}
            </button>

            <button
              className="header-btn btn-highlight"
              onClick={() => setTestAlertActive(true)}
              title="Preview the visual alert screen right now"
            >
              ⚡ Test Alert
            </button>

            <button
              className={`header-btn ${settings.highContrast ? "btn-active" : ""}`}
              onClick={() => setSettings((s) => ({ ...s, highContrast: !s.highContrast }))}
              title="Toggle high-contrast accessible mode"
            >
              ♿ Contrast
            </button>
          </div>
        </div>
      </header>

      {/* Quick Telemetry Summary Bar */}
      <section className="stats-strip" aria-label="Quick metrics">
        <div className="stat-card">
          <div className="stat-icon-wrap icon-bell">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div>
            <div className="stat-value">{stats.rings}</div>
            <div className="stat-label">Doorbell Rings</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap icon-person">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="7" r="4" />
              <path d="M5.5 21a8.5 8.5 0 0 1 13 0" />
            </svg>
          </div>
          <div>
            <div className="stat-value">{stats.visitors}</div>
            <div className="stat-label">Visitors Sensed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap icon-door">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M6 21V3h12v18M10 12h2" />
            </svg>
          </div>
          <div>
            <div className="stat-value">{stats.doors}</div>
            <div className="stat-label">Door Openings</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap icon-sync">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div className="stat-value">{new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
            <div className="stat-label">{lastSeen ? `Updated ${timeAgo(lastSeen, now)}` : "Live clock"}</div>
          </div>
        </div>
      </section>

      {/* Main Three Visual Telemetry Cards */}
      <main className="telemetry-grid" aria-label="Live Sensor Telemetry">
        {/* Card 1: Doorbell Status */}
        <article className={`telemetry-card card-bell ${alertActive ? "state-ringing" : ""}`}>
          <div className="telemetry-top">
            <span className="telemetry-badge">
              <span className={`badge-indicator ${alertActive ? "ringing" : "idle"}`} />
              DOORBELL BUTTON
            </span>
            {alertActive && <span className="urgent-tag">RINGING NOW</span>}
          </div>

          <div className="telemetry-visual-row">
            <BellIllustration ringing={alertActive} size={82} />
            <div className="telemetry-readout">
              <div className="readout-title">
                {alertActive ? "Someone is Ringing" : "Doorbell Idle"}
              </div>
              <div className="readout-status">
                {alertActive ? "ALERT ACTIVE" : "Quiet & Waiting"}
              </div>
              <div className="readout-meta">
                {door.bell.ts ? `Last rang ${timeAgo(door.bell.ts, now)}` : "No rings recorded"}
              </div>
            </div>
          </div>

          <div className="telemetry-footer-action">
            {alertActive ? (
              <button className="btn-dismiss-card" onClick={dismiss}>
                ✓ Got it — Dismiss
              </button>
            ) : (
              <button className="btn-card-action" onClick={() => simulate("bell")}>
                Simulate Press
              </button>
            )}
          </div>
        </article>

        {/* Card 2: Door Threshold Sensor */}
        <article className={`telemetry-card card-door ${door.state === "open" ? "state-open" : "state-closed"}`}>
          <div className="telemetry-top">
            <span className="telemetry-badge">
              <span className={`badge-indicator ${door.state === "open" ? "open" : "closed"}`} />
              THRESHOLD SENSOR
            </span>
            <span className="sensor-tag">Light / Reed Switch</span>
          </div>

          <div className="telemetry-visual-row">
            <DoorIllustration state={door.state} size={82} />
            <div className="telemetry-readout">
              <div className="readout-title">
                {door.state === "open" ? "Door is Ajar / Open" : "Door is Shut"}
              </div>
              <div className={`readout-status ${door.state === "open" ? "warn" : "ok"}`}>
                {door.state === "open" ? "UNSECURED (OPEN)" : "SECURELY CLOSED"}
              </div>
              <div className="readout-meta">
                {door.state === "open"
                  ? `Open for ${formatDuration(doorOpenSeconds)}`
                  : "Sensor: Light blocked"}
              </div>
            </div>
          </div>

          <div className="telemetry-footer-action">
            <button className="btn-card-action" onClick={() => simulate("toggleDoor")}>
              {door.state === "open" ? "Close Door" : "Open Door"}
            </button>
          </div>
        </article>

        {/* Card 3: Visitor IR Radar */}
        <article className={`telemetry-card card-visitor ${door.person ? "state-detected" : "state-clear"}`}>
          <div className="telemetry-top">
            <span className="telemetry-badge">
              <span className={`badge-indicator ${door.person ? "detected" : "clear"}`} />
              PROXIMITY RADAR
            </span>
            <span className="sensor-tag">ESP8266 IR Sensor</span>
          </div>

          <div className="telemetry-visual-row">
            <RadarIllustration detected={door.person} size={82} />
            <div className="telemetry-readout">
              <div className="readout-title">
                {door.person ? "Visitor Detected" : "Perimeter Clear"}
              </div>
              <div className={`readout-status ${door.person ? "warn" : "ok"}`}>
                {door.person ? "MOTION SENSE ACTIVE" : "NO PRESENCE"}
              </div>
              <div className="readout-meta">
                {door.person ? "Subject within threshold range" : "IR beam unbroken"}
              </div>
            </div>
          </div>

          <div className="telemetry-footer-action">
            <button className="btn-card-action" onClick={() => simulate("togglePerson")}>
              {door.person ? "Clear Visitor" : "Visitor Arrives"}
            </button>
          </div>
        </article>
      </main>

      {/* Hardware Simulation Deck */}
      {showSimBar && (
        <SimulationBar
          onSimulate={simulate}
          doorState={door.state}
          personDetected={door.person}
          alertActive={alertActive}
          demoMode={demo}
          connected={connected}
        />
      )}

      {/* Split Section: Activity Timeline & Settings Suite */}
      <section className="app-split-layout">
        <ActivityLog history={history} onClear={clearHistory} now={now} />
        <SettingsPanel
          settings={settings}
          onUpdateSettings={setSettings}
          onTriggerTestAlert={() => setTestAlertActive(true)}
          lastSeen={lastSeen}
          now={now}
          demoMode={demo}
        />
      </section>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <strong>The Silent Doorbell Project</strong> &middot; An accessible IoT visual notification system
          </div>
          <div className="footer-right">
            ESP8266 Microcontroller &middot; Firebase Realtime Database &middot; Web Audio API
          </div>
        </div>
      </footer>
    </div>
  );
}
