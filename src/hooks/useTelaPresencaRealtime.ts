import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAttendanceStats } from "@/lib/api";
import { connectCheckinWebSocket, type AttendanceCheckinPayload } from "@/lib/checkin-ws";

const POLL_MS = 2000;
const CELEBRATION_MS = 5500;

export type CelebrationGuest = { name: string; table?: string | null };

export function useTelaPresencaRealtime() {
  const [present, setPresent] = useState(0);
  const [total, setTotal] = useState(0);
  const [celebration, setCelebration] = useState<CelebrationGuest | null>(null);
  const [wsLive, setWsLive] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const applyStats = useCallback((checked_in: number, total_guests: number) => {
    setPresent(checked_in);
    setTotal(total_guests);
  }, []);

  const showCelebration = useCallback((event: AttendanceCheckinPayload) => {
    if (event.already_checked_in) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setCelebration({ name: event.name, table: event.table });
    hideTimerRef.current = setTimeout(() => setCelebration(null), CELEBRATION_MS);
  }, []);

  useEffect(() => {
    return connectCheckinWebSocket({
      onStats: (s) => applyStats(s.checked_in, s.total_guests),
      onCheckin: showCelebration,
      onOpen: () => setWsLive(true),
      onClose: () => setWsLive(false),
    });
  }, [applyStats, showCelebration]);

  useEffect(() => {
    const poll = async () => {
      try {
        const s = await fetchAttendanceStats();
        applyStats(s.checked_in, s.total_guests);
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

  return { present, total, celebration, wsLive };
}
