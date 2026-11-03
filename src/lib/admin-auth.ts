import { apiUrl } from "@/lib/api-base";

const SESSION_KEY = "Kayan_admin_session";
const API_KEY_STORAGE = "Kayan_admin_key";

export function isAdminLoggedIn(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "1" && !!sessionStorage.getItem(API_KEY_STORAGE);
}

export function getAdminApiKey(): string | null {
  if (!isAdminLoggedIn()) return null;
  return sessionStorage.getItem(API_KEY_STORAGE);
}

export async function loginAdmin(password: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(apiUrl("/api/admin/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      let message = "Palavra-passe incorrecta.";
      try {
        const body = (await res.json()) as { detail?: string };
        if (body.detail) message = body.detail;
      } catch {
        if (res.status === 0 || res.type === "error") {
          message =
            "Não foi possível ligar à API. Verifique o deploy (Vercel + VPS) ou o proxy local (npm run dev).";
        }
      }
      return { ok: false, message };
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    sessionStorage.setItem(API_KEY_STORAGE, password);
    localStorage.removeItem(API_KEY_STORAGE);
    return { ok: true };
  } catch {
    return {
      ok: false,
      message:
        "Não foi possível ligar à API. Em dev: npm run dev (proxy para a VPS). API local: VITE_DEV_API_TARGET=http://127.0.0.1:8000",
    };
  }
}

export function logoutAdmin(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(API_KEY_STORAGE);
  localStorage.removeItem(API_KEY_STORAGE);
}
