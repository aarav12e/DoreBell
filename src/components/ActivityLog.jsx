import React, { useMemo, useState } from "react";

const EVENT_METADATA = {
  bell: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    label: "Doorbell Ring",
    desc: "Silent visual alert triggered",
    badgeClass: "badge-bell",
  },
  door_open: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18M6 21V3h12v18M10 12h2" />
      </svg>
    ),
    label: "Door Opened",
    desc: "Threshold breached (light detected)",
    badgeClass: "badge-door-open",
  },
  door_closed: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <circle cx="9" cy="12" r="1.5" />
      </svg>
    ),
    label: "Door Closed",
    desc: "Door securely shut",
    badgeClass: "badge-door-closed",
  },
  person_arrived: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="7" r="4" />
        <path d="M5.5 21a8.5 8.5 0 0 1 13 0" />
      </svg>
    ),
    label: "Visitor Arrived",
    desc: "IR motion proximity triggered",
    badgeClass: "badge-person",
  },
  person_left: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    ),
    label: "Visitor Left",
    desc: "Perimeter cleared",
    badgeClass: "badge-person-left",
  },
};

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatRelative(ts, now) {
  const diffSec = Math.max(0, Math.round((now - ts) / 1000));
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(ts).toLocaleDateString();
}

export function ActivityLog({ history = [], onClear, now = Date.now() }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (filter === "bell" && item.type !== "bell") return false;
      if (filter === "door" && !item.type.startsWith("door_")) return false;
      if (filter === "person" && !item.type.startsWith("person_")) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const meta = EVENT_METADATA[item.type] || {};
        const matchLabel = meta.label?.toLowerCase().includes(query);
        const matchDesc = meta.desc?.toLowerCase().includes(query);
        const matchTime = formatTime(item.at).toLowerCase().includes(query);
        return matchLabel || matchDesc || matchTime;
      }
      return true;
    });
  }, [history, filter, search]);

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `silent-doorbell-log-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="activity-card panel">
      <div className="activity-header">
        <div className="activity-title-group">
          <div className="panel-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <h2 className="panel-title">Activity Timeline</h2>
            <p className="panel-subtitle">Live hardware telemetry &amp; visitor events</p>
          </div>
        </div>

        <div className="activity-actions">
          {history.length > 0 && (
            <>
              <button
                className="btn-ghost-sm"
                onClick={handleExportJSON}
                title="Export history as JSON"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
              <button
                className="btn-ghost-sm text-danger"
                onClick={onClear}
                title="Clear all recorded history"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="activity-filters">
        <div className="filter-chips">
          <button
            className={`chip ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({history.length})
          </button>
          <button
            className={`chip ${filter === "bell" ? "active" : ""}`}
            onClick={() => setFilter("bell")}
          >
            🔔 Rings ({history.filter((e) => e.type === "bell").length})
          </button>
          <button
            className={`chip ${filter === "door" ? "active" : ""}`}
            onClick={() => setFilter("door")}
          >
            🚪 Door ({history.filter((e) => e.type.startsWith("door_")).length})
          </button>
          <button
            className={`chip ${filter === "person" ? "active" : ""}`}
            onClick={() => setFilter("person")}
          >
            🧍 Visitors ({history.filter((e) => e.type.startsWith("person_")).length})
          </button>
        </div>

        {history.length > 3 && (
          <div className="search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        )}
      </div>

      {/* Log Feed */}
      <div className="activity-scroll">
        {filteredHistory.length === 0 ? (
          <div className="activity-empty">
            <div className="empty-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="empty-title">No events recorded yet</p>
            <p className="empty-desc">
              Hardware updates and doorbell presses will appear here in real-time.
            </p>
          </div>
        ) : (
          <ul className="activity-list">
            {filteredHistory.map((item) => {
              const meta = EVENT_METADATA[item.type] || {
                icon: "•",
                label: item.type,
                desc: "Event",
                badgeClass: "badge-default",
              };

              return (
                <li key={item.id} className={`activity-row ${meta.badgeClass}`}>
                  <div className="activity-type-icon">{meta.icon}</div>
                  <div className="activity-body">
                    <div className="activity-main-line">
                      <span className="activity-label">{meta.label}</span>
                      <time className="activity-time-rel">{formatRelative(item.at, now)}</time>
                    </div>
                    <div className="activity-sub-line">
                      <span className="activity-desc">{meta.desc}</span>
                      <span className="activity-clock">{formatTime(item.at)}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
