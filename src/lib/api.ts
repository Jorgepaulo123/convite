export type Guest = {
  code: string;
  name: string;
  table?: string | null;
  rsvp_status?: "pending" | "yes" | "no";
};

export type GuestAdmin = Guest & {
  id: number;
  contact: string;
  created_at: string;
};

export type GalleryItem = { id: number; url: string; sort_order: number };

export type ProgramItem = { id: number; title: string; time: string; sort_order: number };

export type EventInfo = { event_date: string };

export type ScreenMode = "live" | "photos" | "dance" | "brindes";

export type ScreenLiveSlide = { id: number; url: string; sort_order: number };

export type ScreenState = {
  mode: ScreenMode;
  active_media: { id: number; url: string; media_type: string } | null;
  live_slides: ScreenLiveSlide[];
};

export type ScreenToast =
  | { kind: "photo"; id: number; guest_name: string; url: string }
  | { kind: "message"; id: number; guest_name: string; message: string };

import { getAdminApiKey } from "@/lib/admin-auth";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function adminHeaders(): HeadersInit {
  const key = getAdminApiKey();
  return key ? { "X-Admin-Key": key } : {};
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: string | { msg: string }[] };
      if (typeof body.detail === "string") detail = body.detail;
      else if (Array.isArray(body.detail) && body.detail[0]?.msg) detail = body.detail[0].msg;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function mediaUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

export async function fetchGuestByCode(code: string): Promise<Guest | undefined> {
  if (!/^\d{6}$/.test(code)) return undefined;
  const res = await fetch(`${API_BASE}/api/guests/by-code/${code}`);
  if (res.status === 404) return undefined;
  return parseJson<Guest>(res);
}

export async function verifyGuestCode(code: string): Promise<Guest> {
  const res = await fetch(`${API_BASE}/api/guests/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return parseJson<Guest>(res);
}

export async function submitRsvp(code: string, status: "yes" | "no") {
  const res = await fetch(`${API_BASE}/api/rsvp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, status }),
  });
  return parseJson<{ ok: boolean }>(res);
}

export async function ackPresent(code: string) {
  const res = await fetch(`${API_BASE}/api/present/ack`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return parseJson<{ ok: boolean }>(res);
}

export async function sendFelicitation(code: string, message: string) {
  const res = await fetch(`${API_BASE}/api/felicitacoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, message }),
  });
  return parseJson<{ ok: boolean; id: number }>(res);
}

export async function uploadGuestPhoto(code: string, file: File) {
  const fd = new FormData();
  fd.append("code", code);
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/api/guest-photos`, { method: "POST", body: fd });
  return parseJson<{ ok: boolean; id: number; url: string }>(res);
}

export async function fetchGallery(): Promise<GalleryItem[]> {
  const res = await fetch(`${API_BASE}/api/gallery`);
  return parseJson<GalleryItem[]>(res);
}

export async function adminListGuests(): Promise<GuestAdmin[]> {
  const res = await fetch(`${API_BASE}/api/admin/guests`, { headers: adminHeaders() });
  return parseJson<GuestAdmin[]>(res);
}

export async function adminCreateGuest(name: string, contact: string, table?: string) {
  const res = await fetch(`${API_BASE}/api/admin/guests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify({ name, contact, table: table || null }),
  });
  return parseJson<GuestAdmin>(res);
}

export async function adminUpdateGuest(
  id: number,
  patch: { name?: string; contact?: string; table?: string | null },
) {
  const res = await fetch(`${API_BASE}/api/admin/guests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify(patch),
  });
  return parseJson<GuestAdmin>(res);
}

export async function adminDeleteGuest(id: number) {
  const res = await fetch(`${API_BASE}/api/admin/guests/${id}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  return parseJson<void>(res);
}

export async function adminUploadGallery(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/api/admin/gallery`, {
    method: "POST",
    headers: adminHeaders(),
    body: fd,
  });
  return parseJson<GalleryItem>(res);
}

export async function adminListFelicitacoes() {
  const res = await fetch(`${API_BASE}/api/admin/felicitacoes`, { headers: adminHeaders() });
  return parseJson<{ id: number; guest_name: string; message: string; created_at: string }[]>(res);
}

export async function adminSetScreenMode(mode: ScreenMode) {
  const res = await fetch(`${API_BASE}/api/admin/screen/mode/${mode}`, {
    method: "PATCH",
    headers: adminHeaders(),
  });
  return parseJson<ScreenState>(res);
}

export async function adminUploadLiveSlide(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/api/admin/screen/live-slides`, {
    method: "POST",
    headers: adminHeaders(),
    body: fd,
  });
  return parseJson<ScreenLiveSlide>(res);
}

export async function adminDeleteLiveSlide(id: number) {
  const res = await fetch(`${API_BASE}/api/admin/screen/live-slides/${id}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  return parseJson<void>(res);
}

export async function adminUploadScreenMedia(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/api/admin/screen/media`, {
    method: "POST",
    headers: adminHeaders(),
    body: fd,
  });
  return parseJson<{ id: number; url: string; media_type: string }>(res);
}

export async function fetchProgram(): Promise<ProgramItem[]> {
  const res = await fetch(`${API_BASE}/api/program`);
  return parseJson<ProgramItem[]>(res);
}

export async function fetchEventInfo(): Promise<EventInfo> {
  const res = await fetch(`${API_BASE}/api/event`);
  return parseJson<EventInfo>(res);
}

export async function adminUpdateEventInfo(event_date: string) {
  const res = await fetch(`${API_BASE}/api/admin/event`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify({ event_date }),
  });
  return parseJson<EventInfo>(res);
}

export async function adminCreateProgramItem(title: string, time: string) {
  const res = await fetch(`${API_BASE}/api/admin/program`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify({ title, time }),
  });
  return parseJson<ProgramItem>(res);
}

export async function adminUpdateProgramItem(
  id: number,
  patch: { title?: string; time?: string; sort_order?: number },
) {
  const res = await fetch(`${API_BASE}/api/admin/program/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify(patch),
  });
  return parseJson<ProgramItem>(res);
}

export async function adminDeleteProgramItem(id: number) {
  const res = await fetch(`${API_BASE}/api/admin/program/${id}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  return parseJson<void>(res);
}

export async function fetchRecentFelicitacoes(limit = 3) {
  const res = await fetch(`${API_BASE}/api/screen/recent-felicitacoes?limit=${limit}`);
  return parseJson<{ id: number; guest_name: string; message: string }[]>(res);
}

export async function adminListGuestPhotos() {
  const res = await fetch(`${API_BASE}/api/admin/guest-photos`, { headers: adminHeaders() });
  return parseJson<{ id: number; guest_name: string; url: string; created_at: string }[]>(res);
}

export async function fetchScreenState() {
  const res = await fetch(`${API_BASE}/api/screen/state`);
  return parseJson<ScreenState>(res);
}

export async function fetchScreenToast(): Promise<ScreenToast | null> {
  const res = await fetch(`${API_BASE}/api/screen/next-toast`);
  if (res.status === 204) return null;
  const data = await res.json();
  if (data === null) return null;
  return data as ScreenToast;
}
