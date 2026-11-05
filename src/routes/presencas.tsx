import { createFileRoute } from "@tanstack/react-router";
import { Armchair, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";
import { useTelaPresencaRealtime } from "@/hooks/useTelaPresencaRealtime";
import type { PresentGuest } from "@/lib/api";

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

function guestKey(g: PresentGuest) {
  return `${g.name}|${g.checked_in_at}`;
}

function formatEntryTime(iso: string | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function PresentRow({
  guest,
  index,
  highlighted,
}: {
  guest: PresentGuest;
  index: number;
  highlighted: boolean;
}) {
  const time = formatEntryTime(guest.checked_in_at);

  return (
    <li
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      className={`animate-in fade-in slide-in-from-left-4 relative grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-4 rounded-2xl border px-5 py-4 duration-500 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-6 ${
        highlighted
          ? "border-primary bg-gold-gradient/25 shadow-[0_0_40px_-8px_hsl(var(--primary))] ring-2 ring-primary/60"
          : "border-white/10 bg-white/[0.04] backdrop-blur-md"
      }`}
    >
      <time
        dateTime={guest.checked_in_at}
        className={`font-mono text-xl font-semibold tabular-nums sm:text-2xl ${
          highlighted ? "text-primary" : "text-gold-soft"
        }`}
      >
        {time}
      </time>
      <p
        className={`text-left text-lg font-semibold leading-snug sm:text-xl ${
          highlighted ? "text-secondary-foreground" : "text-secondary-foreground/95"
        }`}
      >
        {guest.name}
      </p>
    </li>
  );
}

function PresencasTelaPage() {
  const { presentGuests, celebration, wsLive } = useTelaPresencaRealtime();

  const highlightKey = useMemo(() => {
    if (!celebration) return null;
    const match = presentGuests.find((g) => g.name === celebration.name);
    return match ? guestKey(match) : celebration.name;
  }, [celebration, presentGuests]);

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#070708] text-secondary-foreground">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.25), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, hsl(var(--primary) / 0.12), transparent)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 md:px-10 md:py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-gold-soft">Graduação</p>
            <h1 className="font-script text-gold-gradient mt-1 text-4xl md:text-5xl">Msc. Kayan & Dra. Orquídea</h1>
          </div>
          {!wsLive && (
            <p className="text-xs text-muted-foreground">Actualização automática…</p>
          )}
        </header>

        <section className="flex min-h-0 flex-1 flex-col">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-gold-soft">
              Convidados
            </h2>

            {presentGuests.length > 0 && (
              <div
                className="mb-2 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-6"
                aria-hidden
              >
                <span>Hora</span>
                <span>Nome</span>
              </div>
            )}

            <div className="presentes-scroll relative min-h-[280px] flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 p-4 md:p-5">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[#070708] to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-[#070708] to-transparent" />

              {presentGuests.length === 0 ? (
                <div className="grid h-full min-h-[240px] place-items-center px-6 text-center">
                  <p className="max-w-sm text-muted-foreground">
                    A lista aparece aqui assim que os convidados forem verificados na porta.
                  </p>
                </div>
              ) : (
                <ul className="presentes-scroll max-h-[min(72vh,820px)] space-y-3 overflow-y-auto pr-1 pt-1">
                  {presentGuests.map((guest, index) => (
                    <PresentRow
                      key={guestKey(guest)}
                      guest={guest}
                      index={index}
                      highlighted={highlightKey === guestKey(guest) || highlightKey === guest.name}
                    />
                  ))}
                </ul>
              )}
            </div>
        </section>
      </div>

      {celebration && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8 backdrop-blur-md duration-300">
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
              <p className="mt-4 flex items-center justify-center gap-2 text-lg tracking-wide text-gold-soft/90">
                <Armchair size={20} />
                {celebration.table}
              </p>
            )}
            <p className="mt-8 text-sm uppercase tracking-widest text-primary">Presença confirmada</p>
          </div>
        </div>
      )}

      <style>{`
        .presentes-scroll {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--primary) / 0.35) transparent;
        }
        .presentes-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .presentes-scroll::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.35);
          border-radius: 999px;
        }
      `}</style>
    </main>
  );
}
