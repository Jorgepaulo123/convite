import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useTelaPresencaRealtime } from "@/hooks/useTelaPresencaRealtime";

/** Tela do contador de presenças (porta). Não confundir com `/tela` (felicitações e selfies). */
export const Route = createFileRoute("/presencas")({
  head: () => ({
    meta: [
      { title: "Convidados presentes — Tela" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PresencasTelaPage,
});

const SPARKS = ["✨", "🎓", "💛", "⭐", "🎉"];

function PresencasTelaPage() {
  const { present, celebration, wsLive } = useTelaPresencaRealtime();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0c] px-8 py-10 text-secondary-foreground">
      <header className="mb-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.5em] text-gold-soft">Graduação</p>
        <h1 className="font-script text-gold-gradient mt-2 text-6xl md:text-7xl">Msc. Kayan & Dra. Orquídea</h1>
        {!wsLive && <p className="mt-3 text-xs text-muted-foreground">A actualizar por rede (polling)…</p>}
      </header>

      <div
        className={`w-full max-w-3xl rounded-[2.5rem] border border-primary/40 bg-gold-gradient/10 px-10 py-16 text-center ring-2 ring-primary/30 transition-transform duration-500 ${
          celebration ? "scale-[0.97] opacity-90" : "scale-100"
        }`}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-gold-soft">Convidados</p>
        <p
          key={present}
          className="font-script mt-6 tabular-nums text-primary text-[clamp(5rem,22vw,11rem)] leading-none animate-in zoom-in-50 duration-500"
        >
          {present}
        </p>
        <p className="mt-6 text-lg tracking-widest text-gold-soft/90">presentes</p>
      </div>

      {celebration && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-8 backdrop-blur-sm duration-300">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {SPARKS.map((s, i) => (
              <span
                key={`${s}-${i}`}
                className="animate-bounce absolute text-4xl opacity-80"
                style={{
                  left: `${10 + ((i * 17) % 80)}%`,
                  top: `${8 + ((i * 23) % 70)}%`,
                  animationDelay: `${i * 0.15}s`,
                }}
              >
                {s}
              </span>
            ))}
          </div>
          <div className="animate-in zoom-in-95 relative max-w-2xl rounded-[2rem] border border-primary/50 bg-gold-gradient/20 px-10 py-14 text-center shadow-2xl ring-2 ring-primary duration-500">
            <CheckCircle2 className="mx-auto mb-6 text-primary" size={72} strokeWidth={1.5} />
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-gold-soft">Bem-vindo(a)</p>
            <p className="font-script text-gold-gradient mt-4 text-[clamp(2.5rem,8vw,5rem)] leading-tight">
              {celebration.name}
            </p>
            {celebration.table && (
              <p className="mt-4 text-lg tracking-wide text-gold-soft/90">{celebration.table}</p>
            )}
            <p className="mt-8 text-sm uppercase tracking-widest text-primary">Presença confirmada</p>
          </div>
        </div>
      )}
    </main>
  );
}
