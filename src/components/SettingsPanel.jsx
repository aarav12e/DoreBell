import React from "react";
import { SOUND_PRESETS, playChime } from "../sound";

export function SettingsPanel({
  settings,
  onUpdateSettings,
  onTriggerTestAlert,
  lastSeen,
  now,
  demoMode,
}) {
  const update = (key, value) => {
    onUpdateSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleNotify = async () => {
    if (settings.notify) {
      update("notify", false);
      return;
    }
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm === "granted") {
      update("notify", true);
      try {
        new Notification("Silent Doorbell Notifications Enabled", {
          body: "You will receive silent notifications when visitors arrive or press the bell.",
        });
      } catch {
        /* ignore */
      }
    }
  };

  const testVibration = () => {
    if (navigator.vibrate) {
      if (settings.vibratePattern === "sos") {
        navigator.vibrate([150, 100, 150, 100, 150, 200, 400, 150, 400]);
      } else if (settings.vibratePattern === "short") {
        navigator.vibrate([200]);
      } else {
        navigator.vibrate([400, 150, 400, 150, 400]);
      }
    } else {
      alert("Vibration API is not supported on this device/browser.");
    }
  };

  const testAudio = () => {
    playChime(settings.soundPreset || "ding-dong", settings.sound ? settings.volume : 0.5);
  };

  return (
    <div className="settings-card panel">
      <div className="panel-header">
        <div className="panel-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
        <div>
          <h2 className="panel-title">Accessibility &amp; Alert Settings</h2>
          <p className="panel-subtitle">Configure visual, haptic, and audio modalities</p>
        </div>
      </div>

      <div className="settings-sections">
        {/* Visual Alert Mode Section */}
        <div className="setting-group">
          <label className="setting-group-label">Visual Alert Style</label>
          <div className="visual-mode-selector">
            {[
              { id: "ambient", label: "Ambient Halo", desc: "Radiant pulse, soothing dark backdrop" },
              { id: "strobe", label: "High-Vis Strobe", desc: "High contrast amber flash (room-scale)" },
              { id: "banner", label: "Floating HUD", desc: "Compact glass island at top of screen" },
              { id: "spotlight", label: "OLED Spotlight", desc: "Ultra-contrast neon yellow & black" },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`mode-card ${settings.alertMode === mode.id ? "selected" : ""}`}
                onClick={() => update("alertMode", mode.id)}
              >
                <div className="mode-card-header">
                  <span className="mode-title">{mode.label}</span>
                  {settings.alertMode === mode.id && <span className="mode-check">✓</span>}
                </div>
                <span className="mode-desc">{mode.desc}</span>
              </button>
            ))}
          </div>

          <div className="test-alert-action-row">
            <button
              type="button"
              className="btn-accent-sm"
              onClick={onTriggerTestAlert}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Test Selected Alert Overlay
            </button>
            <span className="helper-text">Opens preview of your configured visual alert</span>
          </div>
        </div>

        {/* Haptic & Notifications Section */}
        <div className="setting-group">
          <label className="setting-group-label">Device Sensory Feedback</label>

          {/* Vibrate switch */}
          <div className="toggle-row">
            <div className="toggle-text">
              <span className="toggle-label">Haptic Vibration</span>
              <span className="toggle-desc">Vibrate mobile or supported hardware on bell ring</span>
            </div>
            <div className="toggle-controls">
              {settings.vibrate && (
                <button
                  type="button"
                  className="btn-ghost-xs"
                  onClick={testVibration}
                  title="Test vibration motor"
                >
                  Test Buzz
                </button>
              )}
              <label className="custom-switch">
                <input
                  type="checkbox"
                  checked={settings.vibrate}
                  onChange={(e) => update("vibrate", e.target.checked)}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>

          {/* Push notification switch */}
          <div className="toggle-row">
            <div className="toggle-text">
              <span className="toggle-label">Desktop Notifications</span>
              <span className="toggle-desc">Show OS notification even if browser tab is in background</span>
            </div>
            <div className="toggle-controls">
              <label className="custom-switch">
                <input
                  type="checkbox"
                  checked={settings.notify}
                  onChange={handleToggleNotify}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>
        </div>

        {/* Audio Synthesizer Section */}
        <div className="setting-group">
          <label className="setting-group-label">Audio Chimes (Optional)</label>

          <div className="toggle-row">
            <div className="toggle-text">
              <span className="toggle-label">Sound Synthesis</span>
              <span className="toggle-desc">Auditory reinforcement (keep disabled for 100% silent)</span>
            </div>
            <label className="custom-switch">
              <input
                type="checkbox"
                checked={settings.sound}
                onChange={(e) => update("sound", e.target.checked)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          {settings.sound && (
            <div className="sound-sub-controls">
              <div className="sound-preset-row">
                <label className="sub-label">Chime Preset:</label>
                <select
                  value={settings.soundPreset || "ding-dong"}
                  onChange={(e) => update("soundPreset", e.target.value)}
                  className="preset-select"
                >
                  {SOUND_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.desc}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-ghost-xs"
                  onClick={testAudio}
                  title="Play audio preview"
                >
                  Preview ♫
                </button>
              </div>

              <div className="volume-slider-row">
                <label className="sub-label">Volume: {Math.round((settings.volume || 0.5) * 100)}%</label>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={settings.volume || 0.5}
                  onChange={(e) => update("volume", parseFloat(e.target.value))}
                  className="volume-slider"
                />
              </div>
            </div>
          )}
        </div>

        {/* Accessibility & Visual Comfort */}
        <div className="setting-group">
          <label className="setting-group-label">Appearance &amp; Accessibility</label>

          <div className="toggle-row">
            <div className="toggle-text">
              <span className="toggle-label">Color Theme</span>
              <span className="toggle-desc">Switch between crisp White Theme and Dark Mode</span>
            </div>
            <div className="toggle-controls">
              <button
                type="button"
                className={`chip ${(!settings.theme || settings.theme === "light") ? "active" : ""}`}
                onClick={() => update("theme", "light")}
              >
                ☀️ White Theme
              </button>
              <button
                type="button"
                className={`chip ${settings.theme === "dark" ? "active" : ""}`}
                onClick={() => update("theme", "dark")}
              >
                🌙 Dark Mode
              </button>
            </div>
          </div>

          <div className="toggle-row">
            <div className="toggle-text">
              <span className="toggle-label">High Contrast Mode</span>
              <span className="toggle-desc">Enforces ultra-sharp text borders and maximum luminance separation</span>
            </div>
            <label className="custom-switch">
              <input
                type="checkbox"
                checked={Boolean(settings.highContrast)}
                onChange={(e) => update("highContrast", e.target.checked)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          <div className="toggle-row">
            <div className="toggle-text">
              <span className="toggle-label">Reduced Motion</span>
              <span className="toggle-desc">Replaces continuous rotation/strobes with static high-clarity cues</span>
            </div>
            <label className="custom-switch">
              <input
                type="checkbox"
                checked={Boolean(settings.reducedMotion)}
                onChange={(e) => update("reducedMotion", e.target.checked)}
              />
              <span className="switch-slider" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
