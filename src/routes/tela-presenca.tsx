import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { fetchAttendanceStats } from "@/lib/api";

export const Route = createFileRoute("/tela-presenca")({
  head: () => ({
    meta: [
      { title: "Presenças — Tela" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TelaPresencaPage,
});

function TelaPresencaPage() {
  const statsQuery = useQuery({
    queryKey: ["attendance-stats"],
    queryFn: fetchAttendanceStats,
    refetchInterval: 2000,
  });

  const stats = statsQuery.data;
  const total = stats?.total_guests ?? 0;
  const present = stats?.checked_in ?? 0;
  const remaining = stats?.remaining ?? 0;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <main className="flex min-h-screen flex-col bg-[#0a0a0c] px-8 py-10 text-secondary-foreground">
      <header className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.5em] text-gold-soft">Graduação</p>
        <h1 className="font-script text-gold-gradient mt-2 text-6xl md:text-7xl">Msc. Kayan & Dra. Orquídea</h1>
        <p className="mt-3 text-lg tracking-widest text-gold-soft/90">Presenças na porta</p>
      </header>

      <section className="mx-auto mt-12 grid w-full max-w-6xl flex-1 grid-cols-1 gap-8 md:grid-cols-3 md:items-center">
        <StatCard label="Total convidados" value={total} accent={false} />
        <StatCard label="Presentes" value={present} accent highlight />
        <StatCard label="Em falta" value={remaining} accent={false} />
      </section>

      <div className="mx-auto mt-10 w-full max-w-4xl">
        <div className="mb-2 flex justify-between text-sm text-gold-soft">
          <span className="flex items-center gap-2">
            <Users size={16} /> Entradas registadas
          </span>
          <span className="font-mono text-lg">{pct}%</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-white/10">
          <div
            className="bg-gold-gradient h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <section className="mx-auto mt-12 w-full max-w-4xl flex-1">
        <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.3em] text-gold-soft">
          Últimas entradas
        </h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {(stats?.recent ?? []).map((r, i) => (
            <li
              key={`${r.name}-${r.checked_in_at}-${i}`}
              className="glass flex items-center justify-between rounded-2xl px-5 py-4 text-left"
            >
              <div>
                <p className="text-xl font-semibold">{r.name}</p>
                {r.table && <p className="text-sm text-muted-foreground">{r.table}</p>}
              </div>
              <p className="font-mono text-xs text-gold-soft">
                {new Date(r.checked_in_at).toLocaleTimeString("pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </li>
          ))}
          {!stats?.recent?.length && !statsQuery.isLoading && (
            <li className="col-span-full text-center text-muted-foreground">Ainda sem entradas registadas.</li>
          )}
        </ul>
      </section>

      {statsQuery.isError && (
        <p className="mt-6 text-center text-sm text-destructive">Sem ligação à API — verifique a rede.</p>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  accent,
  highlight,
}: {
  label: string;
  value: number;
  accent: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[2rem] border border-white/10 p-10 text-center ${
        highlight ? "bg-gold-gradient/15 ring-2 ring-primary/50" : "glass"
      }`}
    >
      <p className={`text-sm font-semibold uppercase tracking-widest ${accent ? "text-primary" : "text-gold-soft"}`}>
        {label}
      </p>
      <p
        className={`mt-4 tabular-nums font-semibold leading-none ${
          highlight ? "font-script text-primary text-[clamp(4rem,12vw,7rem)]" : "text-6xl md:text-7xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
