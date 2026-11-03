import { useCallback, useEffect, useRef, useState } from "react";
import { fetchScreenState, fetchScreenToast, type ScreenMode, type ScreenToast } from "@/lib/api";
import { connectScreenWebSocket, type ScreenStatePayload } from "@/lib/screen-ws";

const STATE_POLL_MS = 2000;
const TOAST_POLL_MS = 1200;

function stateSignature(s: ScreenStatePayload | null): string {
  if (!s) return "";
  const slides = (s.live_slides ?? []).map((x) => x.id).join(",");
  const media = s.active_media ? `${s.active_media.id}:${s.active_media.url}` : "";
  return `${s.mode}|${media}|${slides}`;
}

export function useTelaRealtime(initialState: ScreenStatePayload | null, onToast: (toast: ScreenToast) => void) {
  const [screenState, setScreenState] = useState<ScreenStatePayload | null>(initialState);
  const [wsLive, setWsLive] = useState(false);
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;
  const seenToastsRef = useRef(new Set<string>());
  const stateSigRef = useRef(stateSignature(initialState));

  const deliverToast = useCallback((toast: ScreenToast) => {
    const key = `${toast.kind}:${toast.id}`;
    if (seenToastsRef.current.has(key)) return;
    seenToastsRef.current.add(key);
    onToastRef.current(toast);
  }, []);

  useEffect(() => {
    return connectScreenWebSocket({
      onToast: deliverToast,
      onState: (next) => {
        const merged: ScreenStatePayload = {
          mode: (next.mode ?? "live") as ScreenMode,
          active_media: next.active_media ?? null,
          live_slides: next.live_slides ?? [],
        };
        const sig = stateSignature(merged);
        if (sig === stateSigRef.current) return;
        stateSigRef.current = sig;
        setScreenState(merged);
      },
      onOpen: () => setWsLive(true),
      onClose: () => setWsLive(false),
    });
  }, [deliverToast]);

  useEffect(() => {
    const applyState = (merged: ScreenStatePayload) => {
      const sig = stateSignature(merged);
      if (sig === stateSigRef.current) return;
      stateSigRef.current = sig;
      setScreenState(merged);
    };

    const pollState = async () => {
      try {
        const s = await fetchScreenState();
        applyState({
          mode: s.mode,
          active_media: s.active_media,
          live_slides: s.live_slides ?? [],
        });
      } catch {
        /* ignore */
      }
    };

    void pollState();
    const id = setInterval(pollState, STATE_POLL_MS);
    return () => clearInterval(id);
  }, []);

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

  return { screenState, wsLive };
}
