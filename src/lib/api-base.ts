/** HTTP API origin. Empty string = same origin (`/api/...` via Vercel rewrites or Vite proxy). */
export function getApiBase(): string {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  if (url?.trim()) return url.trim().replace(/\/$/, "");
  return "";
}

function httpToWs(origin: string): string {
  if (origin.startsWith("https://")) return `wss://${origin.slice("https://".length)}`;
  if (origin.startsWith("http://")) return `ws://${origin.slice("http://".length)}`;
  if (origin.startsWith("wss://") || origin.startsWith("ws://")) return origin;
  return origin;
}

/** WebSocket origin for `/api/ws/screen` (no path). */
export function getScreenWsOrigin(): string {
  const ws = import.meta.env.VITE_WS_URL as string | undefined;
  if (ws?.trim()) return httpToWs(ws.trim().replace(/\/$/, ""));

  const api = getApiBase();
  if (api) return httpToWs(api);

  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}`;
  }
  return "ws://127.0.0.1:8000";
}

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBase()}${p}`;
}
