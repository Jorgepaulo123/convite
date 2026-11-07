import { createFileRoute } from "@tanstack/react-router";
import { Armchair, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTelaPresencaRealtime, type CelebrationGuest } from "@/hooks/useTelaPresencaRealtime";
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
      className={`animate-in fade-in slide-in-from-left-4 relative flex items-center justify-between gap-6 rounded-2xl border px-5 py-4 duration-500 sm:px-6 ${
        highlighted
          ? "presenca-row-glow border-primary bg-gold-gradient/25 ring-2 ring-primary/60"
          : "border-white/10 bg-white/[0.04] backdrop-blur-md"
      }`}
    >
      <p
        className={`min-w-0 flex-1 text-left text-lg font-semibold leading-snug sm:text-xl ${
          highlighted ? "text-secondary-foreground" : "text-secondary-foreground/95"
        }`}
      >
        <span>{guest.name}</span>
        {guest.table && (
          <span
            className={`ml-2 inline-flex items-center gap-1 text-base font-medium sm:text-lg ${
              highlighted ? "text-primary" : "text-gold-soft"
            }`}
          >
            <Armchair size={16} className="shrink-0 opacity-90" aria-hidden />
            Mesa {guest.table}
          </span>
        )}
      </p>
      <time
        dateTime={guest.checked_in_at}
        className={`shrink-0 font-mono text-xl font-semibold tabular-nums sm:text-2xl ${
          highlighted ? "text-primary" : "text-gold-soft"
        }`}
      >
        {time}
      </time>
    </li>
  );
}

type OverlayPhase = "hidden" | "enter" | "show" | "leave";

function CelebrationOverlay({ guest, phase }: { guest: CelebrationGuest; phase: OverlayPhase }) {
  if (phase === "hidden") return null;

  const backdropClass =
    phase === "leave" ? "presenca-backdrop-out" : phase === "enter" ? "presenca-backdrop-in" : "opacity-100";
  const cardClass =
    phase === "leave" ? "presenca-card-out" : phase === "enter" ? "presenca-card-in" : "presenca-card-show";
  const nameClass = phase === "show" || phase === "enter" ? "presenca-name-in" : "";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8 backdrop-blur-md ${backdropClass}`}
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {SPARKS.map((s, i) => (
          <span
            key={`${s}-${i}`}
            className="presenca-spark absolute text-4xl opacity-80"
            style={{
              left: `${10 + ((i * 17) % 80)}%`,
              top: `${8 + ((i * 23) % 70)}%`,
              animationDelay: `${i * 0.12}s`,
            }}
          >
            {s}
          </span>
        ))}
      </div>
      <div
        className={`relative max-w-2xl rounded-[2rem] border border-primary/50 bg-gold-gradient/20 px-10 py-14 text-center shadow-2xl ring-2 ring-primary ${cardClass}`}
      >
        <CheckCircle2 className="presenca-icon-in mx-auto mb-6 text-primary" size={72} strokeWidth={1.5} />
        <p className="presenca-sub-in text-sm font-semibold uppercase tracking-[0.4em] text-gold-soft">Bem-vindo(a)</p>
        <p
          key={guest.name}
          className={`font-script text-gold-gradient mt-4 text-[clamp(2.5rem,8vw,5rem)] leading-tight ${nameClass}`}
        >
          {guest.name}
        </p>
        {guest.table && (
          <p className="presenca-sub-in mt-4 flex items-center justify-center gap-2 text-lg tracking-wide text-gold-soft/90">
            <Armchair size={20} />
            {guest.table}
          </p>
        )}
        <p className="presenca-sub-in mt-8 text-sm uppercase tracking-widest text-primary">Presença confirmada</p>
      </div>
    </div>
  );
}

const OVERLAY_LEAVE_MS = 720;

function PresencasTelaPage() {
  const { presentGuests, celebration, wsLive } = useTelaPresencaRealtime();
  const celebrationSnapshot = useRef<CelebrationGuest | null>(null);
  const [overlayPhase, setOverlayPhase] = useState<OverlayPhase>("hidden");

  useEffect(() => {
    if (celebration) {
      celebrationSnapshot.current = celebration;
      setOverlayPhase("enter");
      const show = window.setTimeout(() => setOverlayPhase("show"), 480);
      return () => window.clearTimeout(show);
    }
    if (!celebrationSnapshot.current) return;
    setOverlayPhase("leave");
    const hide = window.setTimeout(() => {
      celebrationSnapshot.current = null;
      setOverlayPhase("hidden");
    }, OVERLAY_LEAVE_MS);
    return () => window.clearTimeout(hide);
  }, [celebration]);

  const highlightKey = useMemo(() => {
    const active = celebration ?? celebrationSnapshot.current;
    if (!active) return null;
    const match = presentGuests.find((g) => g.name === active.name);
    return match ? guestKey(match) : active.name;
  }, [celebration, presentGuests, overlayPhase]);

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

        <section className="mx-auto flex w-full min-h-0 max-w-3xl flex-1 flex-col">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-gold-soft">
              Convidados
            </h2>

            {presentGuests.length > 0 && (
              <div
                className="mb-2 flex items-center justify-between gap-4 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:px-6"
                aria-hidden
              >
                <span>Nome</span>
                <span>Hora</span>
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

      {celebrationSnapshot.current && overlayPhase !== "hidden" && (
        <CelebrationOverlay guest={celebrationSnapshot.current} phase={overlayPhase} />
      )}

      <style>{`
        @keyframes presenca-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes presenca-backdrop-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes presenca-card-in {
          0% { opacity: 0; transform: scale(0.82) translateY(28px); }
          70% { opacity: 1; transform: scale(1.03) translateY(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes presenca-card-out {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.9) translateY(-20px); }
        }
        @keyframes presenca-name-in {
          0% { opacity: 0; transform: translateY(40px) scale(0.92); filter: blur(10px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes presenca-icon-in {
          from { opacity: 0; transform: scale(0.5) rotate(-12deg); }
          to { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes presenca-sub-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes presenca-spark-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.85; }
          50% { transform: translateY(-12px) scale(1.08); opacity: 1; }
        }
        @keyframes presenca-row-glow-pulse {
          0%, 100% { box-shadow: 0 0 32px -6px hsl(var(--primary) / 0.55); }
          50% { box-shadow: 0 0 48px -4px hsl(var(--primary) / 0.85); }
        }
        .presenca-backdrop-in { animation: presenca-backdrop-in 0.45s ease-out forwards; }
        .presenca-backdrop-out { animation: presenca-backdrop-out 0.65s ease-in forwards; }
        .presenca-card-in { animation: presenca-card-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .presenca-card-out { animation: presenca-card-out 0.65s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .presenca-card-show { opacity: 1; transform: scale(1); }
        .presenca-name-in { animation: presenca-name-in 0.75s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both; }
        .presenca-icon-in { animation: presenca-icon-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .presenca-sub-in { animation: presenca-sub-in 0.5s ease-out 0.25s both; }
        .presenca-spark { animation: presenca-spark-float 2.2s ease-in-out infinite; }
        .presenca-row-glow { animation: presenca-row-glow-pulse 1.8s ease-in-out infinite; }
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
