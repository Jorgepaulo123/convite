import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAttendanceStats, type AttendanceStats, type PresentGuest } from "@/lib/api";
import { connectCheckinWebSocket, type AttendanceCheckinPayload } from "@/lib/checkin-ws";

const POLL_MS = 1500;
const CELEBRATION_MS = 5500;
const CELEBRATION_MAX_AGE_MS = 45_000;

export type CelebrationGuest = { name: string; table?: string | null };

function celebrationKey(name: string, checkedInAt: string) {
  return `${name}|${checkedInAt}`;
}

export function useTelaPresencaRealtime() {
  const [present, setPresent] = useState(0);
  const [total, setTotal] = useState(0);
  const [presentGuests, setPresentGuests] = useState<PresentGuest[]>([]);
  const [celebration, setCelebration] = useState<CelebrationGuest | null>(null);
  const [wsLive, setWsLive] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const seenCelebrationsRef = useRef(new Set<string>());
  const pollInitializedRef = useRef(false);

  const triggerCelebration = useCallback((name: string, table?: string | null, checkedInAt?: string) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setCelebration({ name, table });
    hideTimerRef.current = setTimeout(() => setCelebration(null), CELEBRATION_MS);
    if (checkedInAt) seenCelebrationsRef.current.add(celebrationKey(name, checkedInAt));
  }, []);

  const maybeCelebrateFromStats = useCallback(
    (stats: AttendanceStats) => {
      const latest = stats.recent[0];
      if (!latest?.checked_in_at) return;
      const key = celebrationKey(latest.name, latest.checked_in_at);
      if (seenCelebrationsRef.current.has(key)) return;
      const age = Date.now() - new Date(latest.checked_in_at).getTime();
      if (age > CELEBRATION_MAX_AGE_MS) return;
      triggerCelebration(latest.name, latest.table, latest.checked_in_at);
    },
    [triggerCelebration],
  );

  const applyStats = useCallback(
    (stats: AttendanceStats, celebrateFromPoll: boolean) => {
      setPresent(stats.checked_in);
      setTotal(stats.total_guests);
      setPresentGuests(stats.present_guests?.length ? stats.present_guests : stats.recent);
      if (celebrateFromPoll) maybeCelebrateFromStats(stats);
    },
    [maybeCelebrateFromStats],
  );

  const showCelebration = useCallback(
    (event: AttendanceCheckinPayload) => {
      if (event.already_checked_in) return;
      triggerCelebration(event.name, event.table ?? null);
    },
    [triggerCelebration],
  );

  useEffect(() => {
    return connectCheckinWebSocket({
      onStats: (s) => {
        setPresent(s.checked_in);
        setTotal(s.total_guests);
        void fetchAttendanceStats()
          .then((full) => setPresentGuests(full.present_guests?.length ? full.present_guests : full.recent))
          .catch(() => {});
      },
      onCheckin: (event) => {
        setPresent(event.checked_in);
        setTotal(event.total_guests);
        showCelebration(event);
        void fetchAttendanceStats()
          .then((full) => setPresentGuests(full.present_guests?.length ? full.present_guests : full.recent))
          .catch(() => {});
      },
      onOpen: () => setWsLive(true),
      onClose: () => setWsLive(false),
    });
  }, [showCelebration]);

  useEffect(() => {
    const poll = async () => {
      try {
        const s = await fetchAttendanceStats();
        if (!pollInitializedRef.current) {
          for (const r of s.recent) {
            if (r.checked_in_at) seenCelebrationsRef.current.add(celebrationKey(r.name, r.checked_in_at));
          }
          pollInitializedRef.current = true;
          applyStats(s, false);
          return;
        }
        applyStats(s, true);
      } catch {
        /* ignore */
      }
    };
    void poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [applyStats]);

  useEffect(
    () => () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    },
    [],
  );

  return { present, total, presentGuests, celebration, wsLive };
};
