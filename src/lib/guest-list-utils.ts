import type { GuestAdmin } from "@/lib/api";

export type GuestRsvpFilter = "all" | "yes" | "no" | "pending";

export const RSVP_FILTER_LABEL: Record<GuestRsvpFilter, string> = {
  all: "Todos",
  yes: "Confirmados (vão)",
  no: "Não vão",
  pending: "Por confirmar",
};

export const RSVP_STATUS_PDF: Record<NonNullable<GuestAdmin["rsvp_status"]>, string> = {
  yes: "Confirmado",
  no: "Não vai",
  pending: "Por confirmar",
};

export function filterGuests(
  guests: GuestAdmin[],
  search: string,
  rsvpFilter: GuestRsvpFilter,
): GuestAdmin[] {
  const q = search.trim().toLowerCase();
  return guests.filter((g) => {
    const status = g.rsvp_status ?? "pending";
    if (rsvpFilter !== "all" && status !== rsvpFilter) return false;
    if (!q) return true;
    const haystack = [g.name, g.contact, g.code, g.table ?? ""].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

export async function downloadGuestsPdf(
  guests: GuestAdmin[],
  options: { title: string; search: string; rsvpFilter: GuestRsvpFilter },
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const generated = new Date().toLocaleString("pt-PT");

  doc.setFontSize(16);
  doc.text(options.title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Gerado em ${generated}`, 14, 25);

  const filterParts: string[] = [];
  if (options.rsvpFilter !== "all") filterParts.push(RSVP_FILTER_LABEL[options.rsvpFilter]);
  if (options.search.trim()) filterParts.push(`Pesquisa: «${options.search.trim()}»`);
  if (filterParts.length) doc.text(`Filtro: ${filterParts.join(" · ")}`, 14, 31);

  doc.setTextColor(0);
  doc.text(`Total na lista: ${guests.length}`, 14, filterParts.length ? 37 : 31);

  const startY = filterParts.length ? 42 : 36;

  autoTable(doc, {
    startY,
    head: [["Nome", "Mesa", "Telemóvel", "Contacto", "Presença"]],
    body: guests.map((g) => [
      g.name,
      g.table ?? "—",
      g.code,
      g.contact,
      RSVP_STATUS_PDF[g.rsvp_status ?? "pending"],
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [120, 90, 40], textColor: 255 },
    margin: { left: 14, right: 14 },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`convidados-${stamp}.pdf`);
}
