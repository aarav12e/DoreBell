import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { db, hasDb } from "./firebase";

const HISTORY_KEY = "silent-doorbell-history";
const MAX_HISTORY = 60;

const EMPTY = { state: "closed", person: false, bell: { ring: false, ts: 0 } };

function loadHistory() {
  try {
    const h = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(h) ? h : [];
  } catch {
    return [];
  }
}

function normalize(v) {
  const val = v || {};
  return {
    state: val.state === "open" || val.state === "closed" ? val.state : "closed",
    person: val.person === true,
    bell: {
      ring: val.bell?.ring === true,
      ts: typeof val.bell?.ts === "number" ? val.bell.ts : 0,
    },
  };
}

export function useDoor(onEvent) {
  const [door, setDoor] = useState(EMPTY);
  const [connected, setConnected] = useState(!hasDb);
  const [lastSeen, setLastSeen] = useState(null);
  const [history, setHistory] = useState(loadHistory);
  const [alertActive, setAlertActive] = useState(false);
  const [doorOpenSince, setDoorOpenSince] = useState(null);

  const prev = useRef(null);
  const demoRef = useRef(EMPTY);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const pushEvent = useCallback((type) => {
    const evt = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      at: Date.now(),
    };
    setHistory((h) => {
      const next = [evt, ...h].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
    onEventRef.current?.(evt);
  }, []);

  const ingest = useCallback(
    (raw) => {
      const next = normalize(raw);
      const p = prev.current;
      setDoor(next);
      setLastSeen(Date.now());

      if (p === null) {
        // First snapshot
        if (next.bell.ring) setAlertActive(true);
        if (next.state === "open") setDoorOpenSince(Date.now());
      } else {
        if (next.bell.ring && (next.bell.ts !== p.bell.ts || !p.bell.ring)) {
          setAlertActive(true);
          pushEvent("bell");
        }
        if (!next.bell.ring && p.bell.ring) {
          setAlertActive(false);
        }
        if (next.state !== p.state) {
          if (next.state === "open") {
            setDoorOpenSince(Date.now());
            pushEvent("door_open");
          } else {
            setDoorOpenSince(null);
            pushEvent("door_closed");
          }
        }
        if (next.person !== p.person) {
          pushEvent(next.person ? "person_arrived" : "person_left");
        }
      }
      prev.current = next;
    },
    [pushEvent]
  );

  // Live listener
  useEffect(() => {
    if (!hasDb) {
      ingest(demoRef.current);
      return undefined;
    }
    const offConn = onValue(ref(db, ".info/connected"), (s) => setConnected(s.val() === true));
    const offDoor = onValue(ref(db, "door"), (s) => ingest(s.val()));
    return () => {
      offConn();
      offDoor();
    };
  }, [ingest]);

  const dismiss = useCallback(() => {
    setAlertActive(false);
    if (hasDb) {
      set(ref(db, "door/bell/ring"), false).catch(() => {});
    } else {
      demoRef.current = { ...demoRef.current, bell: { ...demoRef.current.bell, ring: false } };
      ingest(demoRef.current);
    }
  }, [ingest]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  // Simulator for Demo & Live Testing
  const simulate = useCallback(
    (kind, payload) => {
      if (hasDb) {
        if (kind === "bell") {
          set(ref(db, "door/bell"), { ring: true, ts: Date.now() }).catch(() => {});
        } else if (kind === "toggleDoor") {
          set(ref(db, "door/state"), door.state === "open" ? "closed" : "open").catch(() => {});
        } else if (kind === "togglePerson") {
          set(ref(db, "door/person"), !door.person).catch(() => {});
        } else if (kind === "setDoor") {
          set(ref(db, "door/state"), payload).catch(() => {});
        } else if (kind === "setPerson") {
          set(ref(db, "door/person"), payload).catch(() => {});
        }
      } else {
        const cur = demoRef.current;
        let next = { ...cur };
        if (kind === "bell") {
          next.bell = { ring: true, ts: Date.now() };
        } else if (kind === "toggleDoor") {
          next.state = cur.state === "open" ? "closed" : "open";
        } else if (kind === "togglePerson") {
          next.person = !cur.person;
        } else if (kind === "setDoor") {
          next.state = payload;
        } else if (kind === "setPerson") {
          next.person = payload;
        }
        demoRef.current = next;
        ingest(next);
      }
    },
    [door, ingest]
  );

  // Statistics calculation
  const stats = useMemo(() => {
    let rings = 0;
    let doors = 0;
    let visitors = 0;
    for (const item of history) {
      if (item.type === "bell") rings++;
      if (item.type === "door_open") doors++;
      if (item.type === "person_arrived") visitors++;
    }
    return { rings, doors, visitors };
  }, [history]);

  return {
    door,
    connected,
    lastSeen,
    history,
    alertActive,
    dismiss,
    clearHistory,
    simulate,
    demo: !hasDb,
    doorOpenSince,
    stats,
  };
}
