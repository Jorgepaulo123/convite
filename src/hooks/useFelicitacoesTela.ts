import { useCallback, useEffect, useRef, useState } from "react";
import type { ScreenToast } from "@/lib/api";

export type FelicitationSlide = {
  id: number;
  guest_name: string;
  message: string;
};

export type FelicitacaoPhase = "hidden" | "enter" | "show" | "leave";

const LIVE_HOLD_MS = 6800;
const IDLE_HOLD_MS = 8200;
const LEAVE_MS = 680;
const ENTER_MS = 420;

function upsertPool(pool: FelicitationSlide[], item: FelicitationSlide): FelicitationSlide[] {
  return [item, ...pool.filter((x) => x.id !== item.id)];
}

export function useFelicitacoesTela(initialPool: FelicitationSlide[] = []) {
  const poolRef = useRef<FelicitationSlide[]>(initialPool);
  const queueRef = useRef<FelicitationSlide[]>([]);
  const idleIndexRef = useRef(0);
  const busyRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const snapshotRef = useRef<FelicitationSlide | null>(null);
  const showImplRef = useRef<(item: FelicitationSlide, source: "live" | "idle") => void>(() => undefined);
  const idleImplRef = useRef<() => void>(() => undefined);

  const [slide, setSlide] = useState<FelicitationSlide | null>(null);
  const [phase, setPhase] = useState<FelicitacaoPhase>("hidden");
  const [poolSize, setPoolSize] = useState(initialPool.length);

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const finishCycle = useCallback(() => {
    busyRef.current = false;
    snapshotRef.current = null;
    setPhase("hidden");
    setSlide(null);

    const next = queueRef.current.shift();
    if (next) {
      schedule(() => showImplRef.current(next, "live"), 80);
      return;
    }
    schedule(() => idleImplRef.current(), IDLE_HOLD_MS);
  }, [schedule]);

  const show = useCallback(
    (item: FelicitationSlide, source: "live" | "idle") => {
      clearTimers();
      busyRef.current = true;
      snapshotRef.current = item;
      setSlide(item);
      setPhase("enter");

      const holdMs = source === "live" ? LIVE_HOLD_MS : IDLE_HOLD_MS;

      schedule(() => setPhase("show"), ENTER_MS);
      schedule(() => setPhase("leave"), holdMs);
      schedule(() => finishCycle(), holdMs + LEAVE_MS);
    },
    [clearTimers, finishCycle, schedule],
  );

  showImplRef.current = show;

  idleImplRef.current = () => {
    if (busyRef.current || queueRef.current.length > 0) return;
    const pool = poolRef.current;
    if (pool.length === 0) {
      schedule(() => idleImplRef.current(), IDLE_HOLD_MS);
      return;
    }
    const idx = idleIndexRef.current % pool.length;
    idleIndexRef.current = (idx + 1) % pool.length;
    show(pool[idx]!, "idle");
  };

  const enqueue = useCallback(
    (toast: ScreenToast) => {
      if (toast.kind !== "message") return;
      const item: FelicitationSlide = {
        id: toast.id,
        guest_name: toast.guest_name,
        message: toast.message,
      };
      poolRef.current = upsertPool(poolRef.current, item);
      setPoolSize(poolRef.current.length);
      queueRef.current.push(item);

      if (!busyRef.current) {
        clearTimers();
        const next = queueRef.current.shift()!;
        show(next, "live");
      }
    },
    [clearTimers, show],
  );

  useEffect(() => {
    poolRef.current = initialPool;
    setPoolSize(initialPool.length);
    if (initialPool.length > 0) {
      schedule(() => idleImplRef.current(), 1200);
    }
    return () => clearTimers();
  }, [clearTimers, initialPool, schedule]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const display = slide ?? snapshotRef.current;

  return { display, phase, enqueue, poolSize };
}
