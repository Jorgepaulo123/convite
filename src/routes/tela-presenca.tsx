import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAttendanceStats } from "@/lib/api";

export const Route = createFileRoute("/tela-presenca")({
  head: () => ({
    meta: [
      { title: "Convidados presentes — Tela" },
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

  const present = statsQuery.data?.checked_in ?? 0;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0c] px-8 py-10 text-secondary-foreground">
      <header className="mb-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.5em] text-gold-soft">Graduação</p>
        <h1 className="font-script text-gold-gradient mt-2 text-6xl md:text-7xl">Msc. Kayan & Dra. Orquídea</h1>
      </header>

      <div className="w-full max-w-3xl rounded-[2.5rem] border border-primary/40 bg-gold-gradient/10 px-10 py-16 text-center ring-2 ring-primary/30">
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-gold-soft">Convidados</p>
        <p className="font-script mt-6 tabular-nums text-primary text-[clamp(5rem,22vw,11rem)] leading-none">
          {present}
        </p>
        <p className="mt-6 text-lg tracking-widest text-gold-soft/90">presentes</p>
      </div>

      {statsQuery.isError && (
        <p className="mt-10 text-center text-sm text-destructive">Sem ligação à API — verifique a rede.</p>
      )}
    </main>
  );
}
