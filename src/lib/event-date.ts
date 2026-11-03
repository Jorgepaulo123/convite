/** Formata YYYY-MM-DD para os textos do site (pt-PT). */
export function formatEventDate(iso: string): { date: string; dateLong: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    return { date: iso, dateLong: iso };
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const dt = new Date(y, m - 1, d);
  const date = `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
  const long = dt.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dateLong = long.charAt(0).toUpperCase() + long.slice(1);
  return { date, dateLong };
}
