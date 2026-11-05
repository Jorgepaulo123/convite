import { getScreenWsOrigin } from "@/lib/api-base";

export type AttendanceStatsPayload = {
  checked_in: number;
  total_guests: number;
};

export type AttendanceCheckinPayload = AttendanceStatsPayload & {
  name: string;
  table?: string | null;
  already_checked_in: boolean;
};

export type CheckinWsMessage =
  | { type: "stats"; payload: AttendanceStatsPayload }
  | { type: "checkin"; payload: AttendanceCheckinPayload }
  | { type: "pong" };

export function connectCheckinWebSocket(handlers: {
  onStats: (stats: AttendanceStatsPayload) => void;
  onCheckin: (event: AttendanceCheckinPayload) => void;
  onOpen?: () => void;
  onClose?: () => void;
}): () => void {
  let ws: WebSocket | null = null;
  let pingTimer: ReturnType<typeof setInterval> | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let closed = false;

  const connect = () => {
    ws = new WebSocket(`${getScreenWsOrigin()}/api/ws/checkin`);

    ws.onopen = () => {
      handlers.onOpen?.();
      pingTimer = setInterval(() => ws?.readyState === WebSocket.OPEN && ws.send("ping"), 25000);
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(String(ev.data)) as CheckinWsMessage;
        if (data.type === "stats") handlers.onStats(data.payload);
        if (data.type === "checkin") {
          handlers.onStats(data.payload);
          handlers.onCheckin(data.payload);
        }
      } catch {
        /* ignore */
      }
    };

    ws.onerror = () => ws?.close();

    ws.onclose = () => {
      handlers.onClose?.();
      if (pingTimer) clearInterval(pingTimer);
      if (!closed) reconnectTimer = setTimeout(connect, 5000);
    };
  };

  connect();

  return () => {
    closed = true;
    if (pingTimer) clearInterval(pingTimer);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
  };
}
