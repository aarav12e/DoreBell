import React, { useState } from "react";

export function SimulationBar({
  onSimulate,
  doorState,
  personDetected,
  alertActive,
  demoMode,
  connected,
}) {
  const [runningScenario, setRunningScenario] = useState(false);
  const [scenarioStep, setScenarioStep] = useState("");

  const runFullScenario = async () => {
    if (runningScenario) return;
    setRunningScenario(true);

    try {
      // Step 1: Visitor walks up
      setScenarioStep("1/5: Visitor walks up to doorstep...");
      onSimulate("setPerson", true);
      await delay(1200);

      // Step 2: Visitor rings the bell
      setScenarioStep("2/5: Visitor presses the doorbell!");
      onSimulate("bell");
      await delay(1800);

      // Step 3: Door opens
      setScenarioStep("3/5: Host opens the door...");
      onSimulate("setDoor", "open");
      await delay(2000);

      // Step 4: Visitor steps inside / departs
      setScenarioStep("4/5: Visitor departs perimeter...");
      onSimulate("setPerson", false);
      await delay(1500);

      // Step 5: Door closes
      setScenarioStep("5/5: Door closed and locked.");
      onSimulate("setDoor", "closed");
      await delay(1000);
    } finally {
      setRunningScenario(false);
      setScenarioStep("");
    }
  };

  return (
    <div className="simulation-dock">
      <div className="sim-header">
        <div className="sim-title-group">
          <span className="sim-badge">
            <span className="pulsing-sim-dot" />
            {demoMode ? "Interactive Demo Simulator" : "Hardware Test Deck"}
          </span>
          <span className="sim-caption">
            {demoMode
              ? "No live hardware required. Simulate ESP8266 IoT sensor inputs in real-time."
              : "Testing triggers linked with active Firebase connection."}
          </span>
        </div>

        {runningScenario && (
          <div className="scenario-pill">
            <span className="spinner-icon" />
            {scenarioStep}
          </div>
        )}
      </div>

      <div className="sim-actions-grid">
        <button
          type="button"
          className={`sim-btn btn-ring ${alertActive ? "is-active" : ""}`}
          onClick={() => onSimulate("bell")}
          disabled={runningScenario}
        >
          <span className="sim-btn-icon">🔔</span>
          <div className="sim-btn-meta">
            <span className="sim-btn-name">Press Doorbell</span>
            <span className="sim-btn-hint">Triggers visual alert &amp; haptics</span>
          </div>
        </button>

        <button
          type="button"
          className={`sim-btn btn-door ${doorState === "open" ? "is-active" : ""}`}
          onClick={() => onSimulate("toggleDoor")}
          disabled={runningScenario}
        >
          <span className="sim-btn-icon">🚪</span>
          <div className="sim-btn-meta">
            <span className="sim-btn-name">
              {doorState === "open" ? "Close Door" : "Open Door"}
            </span>
            <span className="sim-btn-hint">
              Currently: <strong>{doorState.toUpperCase()}</strong>
            </span>
          </div>
        </button>

        <button
          type="button"
          className={`sim-btn btn-visitor ${personDetected ? "is-active" : ""}`}
          onClick={() => onSimulate("togglePerson")}
          disabled={runningScenario}
        >
          <span className="sim-btn-icon">🧍</span>
          <div className="sim-btn-meta">
            <span className="sim-btn-name">
              {personDetected ? "Clear Visitor" : "Visitor Arrives"}
            </span>
            <span className="sim-btn-hint">
              IR Sensor: <strong>{personDetected ? "DETECTED" : "CLEAR"}</strong>
            </span>
          </div>
        </button>

        <button
          type="button"
          className="sim-btn btn-scenario"
          onClick={runFullScenario}
          disabled={runningScenario}
        >
          <span className="sim-btn-icon">⚡</span>
          <div className="sim-btn-meta">
            <span className="sim-btn-name">
              {runningScenario ? "Running Scenario..." : "Auto Lifecycle"}
            </span>
            <span className="sim-btn-hint">Automated 5-step visit demo</span>
          </div>
        </button>
      </div>
    </div>
  );
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
