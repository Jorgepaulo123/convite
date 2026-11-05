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
  checked_in_at?: string | null;
};

export type CheckinResult = {
  ok: boolean;
  on_list: boolean;
  name?: string | null;
  table?: string | null;
  already_checked_in?: boolean;
  message: string;
};

export type AttendanceStats = {
  total_guests: number;
  checked_in: number;
  remaining: number;
  recent: { name: string; table?: string | null; checked_in_at: string }[];
};

export type CheckinRosterGuest = {
  name: string;
  table?: string | null;
  code: string;
  checked_in_at?: string | null;
};

export type CheckinRoster = {
  total_guests: number;
  checked_in: number;
  guests: CheckinRosterGuest[];
};

export type GalleryItem = { id: number; url: string; sort_order: number };

export type ProgramItem = { id: number; title: string; time: string; sort_order: number };

export type Drink = {
  id: number;
  name: string;
  quantity: number;
  active: boolean;
  sort_order: number;
  image_url?: string | null;
};

export type DrinkOrderStatus = "pending" | "delivered" | "cancelled";

export type DrinkOrder = {
  id: number;
  guest_name: string;
  drink_name: string;
  quantity: number;
  status: DrinkOrderStatus;
  created_at: string;
  delivered_at?: string | null;
};

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
import { apiUrl } from "@/lib/api-base";
import { isValidGuestCode, normalizeGuestCode } from "@/lib/guest-code";

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
  return apiUrl(path);
}

export async function fetchGuestByCode(code: string): Promise<Guest | undefined> {
  const normalized = normalizeGuestCode(code);
  if (!isValidGuestCode(normalized)) return undefined;
  const res = await fetch(apiUrl(`/api/guests/by-code/${normalized}`));
  if (res.status === 404) return undefined;
  return parseJson<Guest>(res);
}

export async function registerDoorCheckin(code: string): Promise<CheckinResult> {
  const normalized = normalizeGuestCode(code);
  const res = await fetch(apiUrl(`/api/checkin`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: normalized }),
  });
  return parseJson<CheckinResult>(res);
}

export async function unregisterDoorCheckin(code: string): Promise<CheckinResult> {
  const normalized = normalizeGuestCode(code);
  const res = await fetch(apiUrl(`/api/checkin/uncheck`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: normalized }),
  });
  return parseJson<CheckinResult>(res);
}

export async function fetchAttendanceStats(): Promise<AttendanceStats> {
  const res = await fetch(apiUrl(`/api/checkin/stats`));
  return parseJson<AttendanceStats>(res);
}

export async function fetchCheckinRoster(): Promise<CheckinRoster> {
  const res = await fetch(apiUrl(`/api/checkin/roster`));
  return parseJson<CheckinRoster>(res);
}

export async function verifyGuestCode(code: string): Promise<Guest> {
  const normalized = normalizeGuestCode(code);
  const res = await fetch(apiUrl(`/api/guests/verify`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: normalized }),
  });
  return parseJson<Guest>(res);
}

export async function submitRsvp(code: string, status: "yes" | "no") {
  const res = await fetch(apiUrl(`/api/rsvp`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, status }),
  });
  return parseJson<{ ok: boolean }>(res);
}

export async function ackPresent(code: string) {
  const res = await fetch(apiUrl(`/api/present/ack`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return parseJson<{ ok: boolean }>(res);
}

export async function sendFelicitation(code: string, message: string) {
  const res = await fetch(apiUrl(`/api/felicitacoes`), {
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
  const res = await fetch(apiUrl(`/api/guest-photos`), { method: "POST", body: fd });
  return parseJson<{ ok: boolean; id: number; url: string }>(res);
}

export async function fetchGallery(): Promise<GalleryItem[]> {
  const res = await fetch(apiUrl(`/api/gallery`));
  return parseJson<GalleryItem[]>(res);
}

export async function adminListGuests(): Promise<GuestAdmin[]> {
  const res = await fetch(apiUrl(`/api/admin/guests`), { headers: adminHeaders() });
  return parseJson<GuestAdmin[]>(res);
}

export async function adminCreateGuest(name: string, contact: string, table?: string) {
  const res = await fetch(apiUrl(`/api/admin/guests`), {
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
  const res = await fetch(apiUrl(`/api/admin/guests/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify(patch),
  });
  return parseJson<GuestAdmin>(res);
}

export async function adminDeleteGuest(id: number) {
  const res = await fetch(apiUrl(`/api/admin/guests/${id}`), {
    method: "DELETE",
    headers: adminHeaders(),
  });
  return parseJson<void>(res);
}

export async function adminUploadGallery(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(apiUrl(`/api/admin/gallery`), {
    method: "POST",
    headers: adminHeaders(),
    body: fd,
  });
  return parseJson<GalleryItem>(res);
}

export async function adminDeleteGalleryItem(id: number) {
  const res = await fetch(apiUrl(`/api/admin/gallery/${id}`), {
    method: "DELETE",
    headers: adminHeaders(),
  });
  return parseJson<void>(res);
}

export async function adminListFelicitacoes() {
  const res = await fetch(apiUrl(`/api/admin/felicitacoes`), { headers: adminHeaders() });
  return parseJson<{ id: number; guest_name: string; message: string; created_at: string }[]>(res);
}

export async function adminSetScreenMode(mode: ScreenMode) {
  const res = await fetch(apiUrl(`/api/admin/screen/mode/${mode}`), {
    method: "PATCH",
    headers: adminHeaders(),
  });
  return parseJson<ScreenState>(res);
}

export async function adminUploadLiveSlide(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(apiUrl(`/api/admin/screen/live-slides`), {
    method: "POST",
    headers: adminHeaders(),
    body: fd,
  });
  return parseJson<ScreenLiveSlide>(res);
}

export async function adminDeleteLiveSlide(id: number) {
  const res = await fetch(apiUrl(`/api/admin/screen/live-slides/${id}`), {
    method: "DELETE",
    headers: adminHeaders(),
  });
  return parseJson<void>(res);
}

export async function adminUploadScreenMedia(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(apiUrl(`/api/admin/screen/media`), {
    method: "POST",
    headers: adminHeaders(),
    body: fd,
  });
  return parseJson<{ id: number; url: string; media_type: string }>(res);
}

export async function fetchProgram(): Promise<ProgramItem[]> {
  const res = await fetch(apiUrl(`/api/program`));
  return parseJson<ProgramItem[]>(res);
}

export async function fetchDrinksCatalog(): Promise<Drink[]> {
  const res = await fetch(apiUrl(`/api/drinks`));
  return parseJson<Drink[]>(res);
}

export async function submitDrinkOrder(code: string, drinkId: number, quantity: number) {
  const normalized = normalizeGuestCode(code);
  const res = await fetch(apiUrl(`/api/drink-orders`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: normalized, drink_id: drinkId, quantity }),
  });
  return parseJson<DrinkOrder>(res);
}

export async function fetchStaffDrinkOrders(status?: DrinkOrderStatus) {
  const q = status ? `?status=${status}` : "";
  const res = await fetch(apiUrl(`/api/drink-orders/staff${q}`));
  return parseJson<DrinkOrder[]>(res);
}

export async function updateDrinkOrderStatus(orderId: number, status: DrinkOrderStatus) {
  const res = await fetch(apiUrl(`/api/drink-orders/${orderId}/status`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return parseJson<DrinkOrder>(res);
}

export async function adminListDrinks(): Promise<Drink[]> {
  const res = await fetch(apiUrl(`/api/admin/drinks`), { headers: adminHeaders() });
  return parseJson<Drink[]>(res);
}

export async function adminCreateDrink(name: string, quantity: number, photo?: File) {
  const fd = new FormData();
  fd.append("name", name);
  fd.append("quantity", String(quantity));
  if (photo) fd.append("file", photo);
  const res = await fetch(apiUrl(`/api/admin/drinks`), {
    method: "POST",
    headers: adminHeaders(),
    body: fd,
  });
  return parseJson<Drink>(res);
}

export async function adminUploadDrinkPhoto(id: number, photo: File) {
  const fd = new FormData();
  fd.append("file", photo);
  const res = await fetch(apiUrl(`/api/admin/drinks/${id}/photo`), {
    method: "POST",
    headers: adminHeaders(),
    body: fd,
  });
  return parseJson<Drink>(res);
}

export async function adminUpdateDrink(
  id: number,
  patch: { name?: string; quantity?: number; active?: boolean },
) {
  const res = await fetch(apiUrl(`/api/admin/drinks/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify(patch),
  });
  return parseJson<Drink>(res);
}

export async function adminDeleteDrink(id: number) {
  const res = await fetch(apiUrl(`/api/admin/drinks/${id}`), {
    method: "DELETE",
    headers: adminHeaders(),
  });
  return parseJson<void>(res);
}

export async function fetchEventInfo(): Promise<EventInfo> {
  const res = await fetch(apiUrl(`/api/event`));
  return parseJson<EventInfo>(res);
}

export async function adminUpdateEventInfo(event_date: string) {
  const res = await fetch(apiUrl(`/api/admin/event`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify({ event_date }),
  });
  return parseJson<EventInfo>(res);
}

export async function adminCreateProgramItem(title: string, time: string) {
  const res = await fetch(apiUrl(`/api/admin/program`), {
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
  const res = await fetch(apiUrl(`/api/admin/program/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify(patch),
  });
  return parseJson<ProgramItem>(res);
}

export async function adminDeleteProgramItem(id: number) {
  const res = await fetch(apiUrl(`/api/admin/program/${id}`), {
    method: "DELETE",
    headers: adminHeaders(),
  });
  return parseJson<void>(res);
}

export async function fetchRecentFelicitacoes(limit = 3) {
  const res = await fetch(apiUrl(`/api/screen/recent-felicitacoes?limit=${limit}`));
  return parseJson<{ id: number; guest_name: string; message: string }[]>(res);
}

export async function adminListGuestPhotos() {
  const res = await fetch(apiUrl(`/api/admin/guest-photos`), { headers: adminHeaders() });
  return parseJson<{ id: number; guest_name: string; url: string; created_at: string }[]>(res);
}

export async function fetchScreenState() {
  const res = await fetch(apiUrl(`/api/screen/state`));
  return parseJson<ScreenState>(res);
}

export async function fetchScreenToast(): Promise<ScreenToast | null> {
  const res = await fetch(apiUrl(`/api/screen/next-toast`));
  if (res.status === 204) return null;
  const data = await res.json();
  if (data === null) return null;
  return data as ScreenToast;
}
