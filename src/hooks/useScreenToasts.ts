import { useCallback, useEffect, useRef, useState } from "react";
import { fetchScreenToast, type ScreenToast } from "@/lib/api";
import { connectScreenWebSocket } from "@/lib/screen-ws";

const TOAST_POLL_MS = 1200;

/** WebSocket + polling só para brindes (felicitações / fotos). */
export function useScreenToasts(onToast: (toast: ScreenToast) => void) {
  const [wsLive, setWsLive] = useState(false);
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;
  const seenToastsRef = useRef(new Set<string>());

  const deliverToast = useCallback((toast: ScreenToast) => {
    const key = `${toast.kind}:${toast.id}`;
    if (seenToastsRef.current.has(key)) return;
    seenToastsRef.current.add(key);
    onToastRef.current(toast);
  }, []);

  useEffect(() => {
    return connectScreenWebSocket({
      onToast: deliverToast,
      onOpen: () => setWsLive(true),
      onClose: () => setWsLive(false),
    });
  }, [deliverToast]);

  useEffect(() => {
    let cancelled = false;

    const pollToast = async () => {
      if (cancelled) return;
      try {
        const toast = await fetchScreenToast();
        if (toast) deliverToast(toast);
      } catch {
        /* ignore */
      }
    };

    void pollToast();
    const id = setInterval(pollToast, TOAST_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [deliverToast]);

  return { wsLive };
}
