import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDoor } from "./useDoor";
import { BellIllustration } from "./components/BellIllustration";
import { DoorIllustration } from "./components/DoorIllustration";
import { RadarIllustration } from "./components/RadarIllustration";
import { AlertOverlay } from "./components/AlertOverlay";
import { playChime } from "./sound";

const SETTINGS_KEY = "silent-doorbell-settings-v3";

const DEFAULT_SETTINGS = {
  theme: "light",
  vibrate: true,
  sound: false,
  soundPreset: "ding-dong",
  volume: 0.6,
  notify: false,
};

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved), theme: JSON.parse(saved).theme || "light" }
      : DEFAULT_SETTINGS;
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

function clock(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [now, setNow] = useState(Date.now());
  const [testAlertActive, setTestAlertActive] = useState(false);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Handle hardware incoming events
  const handleEvent = useCallback((evt) => {
    const s = settingsRef.current;
    if (evt.type === "bell") {
      // Haptic vibration on mobile
      if (s.vibrate && navigator.vibrate) {
        navigator.vibrate([400, 150, 400, 150, 400]);
      }
      // Soft sound chime if enabled
      if (s.sound) {
        playChime(s.soundPreset, s.volume);
      }
      // Browser notification
      if (s.notify && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("🔔 Doorbell Ringing!", {
            body: "Someone pressed the doorbell.",
            tag: "silent-doorbell-ring",
            requireInteraction: true,
          });
        } catch {
          /* ignore */
        }
      }
    }
  }, []);

  const { door, connected, lastSeen, history, alertActive, dismiss, clearHistory } =
    useDoor(handleEvent);

  // Time ticker
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Save settings
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme || "light");
  }, [settings.theme]);

  // Tab Title
  const effectiveAlertActive = alertActive || testAlertActive;
  useEffect(() => {
    document.title = effectiveAlertActive
      ? "🔔 [VISITOR AT DOOR] — Silent Doorbell"
      : "Silent Doorbell · ESP8266 Live Monitor";
  }, [effectiveAlertActive]);

  const handleDismissAll = () => {
    dismiss();
    setTestAlertActive(false);
  };

  const toggleSetting = (key) => {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  };

  const handleToggleNotify = async () => {
    if (settings.notify) {
      toggleSetting("notify");
      return;
    }
    if (!("Notification" in window)) {
      alert("This browser does not support notifications.");
      return;
    }
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm === "granted") {
      setSettings((s) => ({ ...s, notify: true }));
    }
  };

  const currentTheme = settings.theme || "light";

  return (
    <div className={`app-container theme-${currentTheme}`} data-theme={currentTheme}>
      {/* Full-Screen Accessible Visual Alert Overlay */}
      <AlertOverlay
        active={effectiveAlertActive}
        timestamp={alertActive ? door.bell.ts : Date.now()}
        cause={door.bell.cause || "bell"}
        mode="ambient"
        onDismiss={handleDismissAll}
        vibrateEnabled={settings.vibrate}
        soundEnabled={settings.sound}
      />

      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo-wrap">
            <span className="brand-pulse-ring" />
            <span className="brand-icon">🔔</span>
          </div>
          <div>
            <div className="eyebrow-tag">ESP8266 IoT Hardware &middot; Live Monitor</div>
            <h1 className="brand-title">The Silent Doorbell</h1>
            <p className="brand-desc">
              Visual &amp; vibrating alerts for deaf and quiet living — connected directly to your ESP8266
            </p>
          </div>
        </div>

        <div className="header-meta">
          <div className={`status-pill ${connected ? "status-connected" : "status-disconnected"}`}>
            <span className="status-dot" />
            <div className="status-pill-info">
              <span className="status-text">{connected ? "Firebase Live" : "Connecting..."}</span>
              <span className="status-sub">ESP8266 Synced</span>
            </div>
          </div>

          <div className="header-controls">
            <button
              className="header-btn btn-theme"
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  theme: s.theme === "dark" ? "light" : "dark",
                }))
              }
              title="Toggle Light / Dark mode"
            >
              {currentTheme === "dark" ? "🌙 Dark" : "☀️ Light"}
            </button>

            <button
              className="header-btn btn-highlight"
              onClick={() => setTestAlertActive(true)}
              title="Test the visual alert screen"
            >
              ⚡ Test Alert
            </button>
          </div>
        </div>
      </header>

      {/* The 3 Core Hardware Sensor Cards */}
      <main className="telemetry-grid" aria-label="ESP8266 Sensors">
        {/* Sensor 1: Touch Doorbell (Pin D5) */}
        <article className={`telemetry-card card-bell ${alertActive ? "state-ringing" : ""}`}>
          <div className="telemetry-top">
            <span className="telemetry-badge">
              <span className={`badge-indicator ${alertActive ? "ringing" : "idle"}`} />
              DOORBELL (TOUCH D5)
            </span>
            {alertActive && <span className="urgent-tag">RINGING</span>}
          </div>

          <div className="telemetry-visual-row">
            <BellIllustration ringing={alertActive} size={82} />
            <div className="telemetry-readout">
              <div className="readout-title">
                {alertActive ? "Doorbell Pressed!" : "Doorbell Idle"}
              </div>
              <div className="readout-status">
                {alertActive ? "VISITOR RINGING" : "Quiet"}
              </div>
              <div className="readout-meta">
                {door.bell.ts ? `Last ring ${timeAgo(door.bell.ts, now)}` : "No rings yet"}
              </div>
            </div>
          </div>

          <div className="telemetry-footer-action">
            {alertActive ? (
              <button className="btn-dismiss-card" onClick={dismiss}>
                ✓ Dismiss Alert
              </button>
            ) : (
              <div className="sensor-pin-pill">Hardware: Touch Sensor on Pin D5</div>
            )}
          </div>
        </article>

        {/* Sensor 2: Door Sensor (LDR Pin A0) */}
        <article className={`telemetry-card card-door ${door.state === "open" ? "state-open" : "state-closed"}`}>
          <div className="telemetry-top">
            <span className="telemetry-badge">
              <span className={`badge-indicator ${door.state === "open" ? "open" : "closed"}`} />
              DOOR (LDR A0)
            </span>
            <span className="sensor-tag">Light Sensor</span>
          </div>

          <div className="telemetry-visual-row">
            <DoorIllustration state={door.state} size={82} />
            <div className="telemetry-readout">
              <div className="readout-title">
                {door.state === "open" ? "Door Opened" : "Door Closed"}
              </div>
              <div className={`readout-status ${door.state === "open" ? "warn" : "ok"}`}>
                {door.state === "open" ? "OPEN" : "CLOSED"}
              </div>
              <div className="readout-meta">
                {door.state === "open" ? "Light entering threshold" : "Threshold dark / locked"}
              </div>
            </div>
          </div>

          <div className="telemetry-footer-action">
            <div className="sensor-pin-pill">Hardware: LDR on Analog A0</div>
          </div>
        </article>

        {/* Sensor 3: Visitor Detection (FC-51 IR Pin D6) */}
        <article className={`telemetry-card card-visitor ${door.person ? "state-detected" : "state-clear"}`}>
          <div className="telemetry-top">
            <span className="telemetry-badge">
              <span className={`badge-indicator ${door.person ? "detected" : "clear"}`} />
              VISITOR (IR D6)
            </span>
            <span className="sensor-tag">FC-51 IR</span>
          </div>

          <div className="telemetry-visual-row">
            <RadarIllustration detected={door.person} size={82} />
            <div className="telemetry-readout">
              <div className="readout-title">
                {door.person ? "Person at Door" : "Perimeter Clear"}
              </div>
              <div className={`readout-status ${door.person ? "warn" : "ok"}`}>
                {door.person ? "DETECTED" : "CLEAR"}
              </div>
              <div className="readout-meta">
                {door.person ? "Obstacle detected by IR sensor" : "No motion in front of door"}
              </div>
            </div>
          </div>

          <div className="telemetry-footer-action">
            <div className="sensor-pin-pill">Hardware: FC-51 on Pin D6</div>
          </div>
        </article>
      </main>

      {/* Split Section: Activity Log & Device Settings */}
      <section className="app-split-layout">
        {/* Simple Activity Log */}
        <div className="panel activity-simple-panel">
          <div className="panel-header">
            <div className="activity-title-group">
              <div className="panel-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div>
                <h2 className="panel-title">Activity Log</h2>
                <p className="panel-subtitle">Events sent from your ESP8266</p>
              </div>
            </div>

            {history.length > 0 && (
              <button className="btn-ghost-sm" onClick={clearHistory}>
                Clear
              </button>
            )}
          </div>

          <div className="activity-scroll">
            {history.length === 0 ? (
              <div className="activity-empty">
                <p className="empty-title">Waiting for ESP8266 events...</p>
                <p className="empty-desc">
                  When someone touches the bell or passes the sensors, events appear here instantly.
                </p>
              </div>
            ) : (
              <ul className="activity-list">
                {history.map((e) => {
                  let icon = "🔔";
                  let title = "Doorbell pressed";
                  let badge = "badge-bell";

                  if (e.type === "door_open") {
                    icon = "🚪";
                    title = "Door opened (LDR)";
                    badge = "badge-door-open";
                  } else if (e.type === "door_closed") {
                    icon = "🔒";
                    title = "Door closed";
                    badge = "badge-door-closed";
                  } else if (e.type === "person_arrived") {
                    icon = "🧍";
                    title = "Person detected (IR)";
                    badge = "badge-person";
                  } else if (e.type === "person_left") {
                    icon = "👋";
                    title = "Visitor stepped away";
                    badge = "badge-person-left";
                  }

                  return (
                    <li key={e.id} className={`activity-row ${badge}`}>
                      <span className="simple-event-icon">{icon}</span>
                      <div className="activity-body">
                        <div className="activity-main-line">
                          <span className="activity-label">{title}</span>
                          <time className="activity-time-rel">{timeAgo(e.at, now)}</time>
                        </div>
                        <span className="activity-clock">{clock(e.at)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Simple Device Settings */}
        <div className="panel settings-simple-panel">
          <div className="panel-header">
            <div className="activity-title-group">
              <div className="panel-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <div>
                <h2 className="panel-title">Device Alerts</h2>
                <p className="panel-subtitle">How this device notifies you</p>
              </div>
            </div>
          </div>

          <div className="settings-simple-list">
            {/* Vibrate switch */}
            <div className="toggle-row">
              <div className="toggle-text">
                <span className="toggle-label">Vibrate on Bell Ring</span>
                <span className="toggle-desc">Vibrates mobile phone when touch sensor is pressed</span>
              </div>
              <label className="custom-switch">
                <input
                  type="checkbox"
                  checked={settings.vibrate}
                  onChange={() => toggleSetting("vibrate")}
                />
                <span className="switch-slider" />
              </label>
            </div>

            {/* Push notification switch */}
            <div className="toggle-row">
              <div className="toggle-text">
                <span className="toggle-label">Browser Notifications</span>
                <span className="toggle-desc">Show notification popup on this device</span>
              </div>
              <label className="custom-switch">
                <input
                  type="checkbox"
                  checked={settings.notify}
                  onChange={handleToggleNotify}
                />
                <span className="switch-slider" />
              </label>
            </div>

            {/* Soft chime switch */}
            <div className="toggle-row">
              <div className="toggle-text">
                <span className="toggle-label">Soft Audio Chime</span>
                <span className="toggle-desc">Optional sound (keep off for 100% silent)</span>
              </div>
              <label className="custom-switch">
                <input
                  type="checkbox"
                  checked={settings.sound}
                  onChange={() => toggleSetting("sound")}
                />
                <span className="switch-slider" />
              </label>
            </div>

            {/* Last update note */}
            {lastSeen && (
              <p className="muted small">
                Last database ping: {timeAgo(lastSeen, now)}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <strong>The Silent Doorbell</strong> &middot; NodeMCU ESP8266 + Firebase Realtime Database
          </div>
          <div className="footer-right">
            Touch Sensor (D5) &middot; LDR Light (A0) &middot; FC-51 IR (D6) &middot; Servo Flag (D4)
          </div>
        </div>
      </footer>
    </div>
  );
}
