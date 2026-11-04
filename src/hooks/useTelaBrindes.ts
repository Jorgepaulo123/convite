import { useCallback, useEffect, useRef, useState } from "react";
import { mediaUrl, type ScreenToast } from "@/lib/api";
import { preloadImage } from "@/lib/preload-image";

export type DockedFelicitation = {
  id: number;
  guest_name: string;
  message: string;
};

const SPOTLIGHT_MS = 5000;
const FLY_MS = 1400;
const DOCK_ANIM_MS = 650;
export const DOCK_FELICITATIONS_COUNT = 3;

function fillDockFromPool(pool: DockedFelicitation[]): DockedFelicitation[] {
  const out: DockedFelicitation[] = [];
  const seen = new Set<number>();
  for (const item of pool) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
    if (out.length >= DOCK_FELICITATIONS_COUNT) break;
  }
  return out.reverse();
}

function upsertPool(pool: DockedFelicitation[], item: DockedFelicitation): DockedFelicitation[] {
  return [item, ...pool.filter((x) => x.id !== item.id)];
}

export function useTelaBrindes(initialPool: DockedFelicitation[] = []) {
  const [spotlight, setSpotlight] = useState<ScreenToast | null>(null);
  const [flying, setFlying] = useState<Extract<ScreenToast, { kind: "message" }> | null>(null);
  const [docked, setDocked] = useState<DockedFelicitation[]>(() => fillDockFromPool(initialPool));
  const [isIdle, setIsIdle] = useState(true);
  const [exitTopId, setExitTopId] = useState<number | null>(null);
  const [enterBottomId, setEnterBottomId] = useState<number | null>(null);

  const poolRef = useRef<DockedFelicitation[]>(initialPool);
  const poolRotateRef = useRef(0);
  const queueRef = useRef<ScreenToast[]>([]);
  const phaseRef = useRef<"idle" | "spotlight-loading" | "spotlight" | "flying" | "dock-anim">("idle");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pumpRef = useRef<() => void>(() => undefined);
  const dockedRef = useRef(docked);
  dockedRef.current = docked;

  const syncIdle = useCallback(() => {
    setIsIdle(phaseRef.current === "idle" && queueRef.current.length === 0);
  }, []);

  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  };

  const appendToDock = useCallback((item: DockedFelicitation, onDone?: () => void) => {
    const current = dockedRef.current;
    const withoutDup = current.filter((x) => x.id !== item.id);

    const finish = (next: DockedFelicitation[]) => {
      setDocked(next);
      setEnterBottomId(item.id);
      phaseRef.current = "idle";
      syncIdle();
      schedule(() => setEnterBottomId(null), DOCK_ANIM_MS + 80);
      onDone?.();
      pumpRef.current();
    };

    if (withoutDup.length < DOCK_FELICITATIONS_COUNT) {
      finish([...withoutDup, item]);
      return;
    }

    const top = withoutDup[0];
    if (!top) {
      finish([...withoutDup, item].slice(-DOCK_FELICITATIONS_COUNT));
      return;
    }

    phaseRef.current = "dock-anim";
    setIsIdle(false);
    setExitTopId(top.id);
    schedule(() => {
      setExitTopId(null);
      const trimmed = dockedRef.current[0]?.id === top.id ? dockedRef.current.slice(1) : dockedRef.current;
      const base = trimmed.filter((x) => x.id !== item.id);
      finish([...base, item].slice(-DOCK_FELICITATIONS_COUNT));
    }, DOCK_ANIM_MS);
  }, [syncIdle]);

  pumpRef.current = () => {
    if (phaseRef.current !== "idle") return;
    const next = queueRef.current.shift();
    syncIdle();
    if (!next) {
      setSpotlight(null);
      return;
    }
    setIsIdle(false);

    if (next.kind === "photo") {
      phaseRef.current = "spotlight-loading";
      const src = mediaUrl(next.url);
      preloadImage(src)
        .then(() => {
          if (phaseRef.current !== "spotlight-loading") return;
          phaseRef.current = "spotlight";
          setSpotlight(next);
          schedule(() => {
            phaseRef.current = "idle";
            setSpotlight(null);
            syncIdle();
            pumpRef.current();
          }, SPOTLIGHT_MS);
        })
        .catch(() => {
          phaseRef.current = "idle";
          syncIdle();
          pumpRef.current();
        });
      return;
    }

    phaseRef.current = "spotlight";
    setSpotlight(next);
    schedule(() => {
      const item = { id: next.id, guest_name: next.guest_name, message: next.message };
      poolRef.current = upsertPool(poolRef.current, item);
      phaseRef.current = "flying";
      setSpotlight(null);
      setFlying(next);
      schedule(() => {
        setFlying(null);
        appendToDock(item);
      }, FLY_MS);
    }, SPOTLIGHT_MS);
  };

  const enqueue = useCallback(
    (toast: ScreenToast) => {
      queueRef.current.push(toast);
      setIsIdle(false);
      pumpRef.current();
    },
    [],
  );

  const rotateDock = useCallback(() => {
    if (phaseRef.current !== "idle" || queueRef.current.length > 0) return;
    const pool = poolRef.current;
    if (pool.length <= DOCK_FELICITATIONS_COUNT) return;

    const current = dockedRef.current;
    if (current.length === 0) return;

    const visibleIds = new Set(current.map((x) => x.id));
    let idx = poolRotateRef.current;
    let candidate: DockedFelicitation | undefined;
    for (let n = 0; n < pool.length; n++) {
      idx = (idx + 1) % pool.length;
      const p = pool[idx];
      if (!visibleIds.has(p.id)) {
        candidate = p;
        poolRotateRef.current = idx;
        break;
      }
    }
    if (!candidate) {
      idx = (idx + 1) % pool.length;
      candidate = pool[idx];
      poolRotateRef.current = idx;
    }

    appendToDock(candidate);
  }, [appendToDock]);

  const poolHydratedRef = useRef(false);
  useEffect(() => {
    if (poolHydratedRef.current) return;
    poolHydratedRef.current = true;
    if (initialPool.length === 0) return;
    poolRef.current = initialPool;
    setDocked(fillDockFromPool(initialPool));
  }, [initialPool]);

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  return { spotlight, flying, docked, enqueue, isIdle, rotateDock, exitTopId, enterBottomId };
}
