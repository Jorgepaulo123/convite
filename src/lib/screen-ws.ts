import type { ScreenLiveSlide, ScreenMode, ScreenToast } from "@/lib/api";
import { getScreenWsOrigin } from "@/lib/api-base";

export type ScreenStatePayload = {
  mode: ScreenMode;
  active_media: { id: number; url: string; media_type: string } | null;
  live_slides?: ScreenLiveSlide[];
};

export type ScreenWsMessage =
  | { type: "toast"; payload: ScreenToast }
  | { type: "state"; payload: ScreenStatePayload }
  | { type: "pong" };

export function connectScreenWebSocket(handlers: {
  onToast: (toast: ScreenToast) => void;
  onState?: (state: ScreenStatePayload) => void;
  onOpen?: () => void;
  onClose?: () => void;
}): () => void {
  let ws: WebSocket | null = null;
  let pingTimer: ReturnType<typeof setInterval> | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let closed = false;

  const connect = () => {
    ws = new WebSocket(`${getScreenWsOrigin()}/api/ws/screen`);

    ws.onopen = () => {
      handlers.onOpen?.();
      pingTimer = setInterval(() => ws?.readyState === WebSocket.OPEN && ws.send("ping"), 25000);
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(String(ev.data)) as ScreenWsMessage;
        if (data.type === "toast") handlers.onToast(data.payload);
        if (data.type === "state") handlers.onState?.(data.payload);
      } catch {
        /* ignore */
      }
    };

    ws.onerror = () => {
      ws?.close();
    };

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
