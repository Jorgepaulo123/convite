import { createFileRoute } from "@tanstack/react-router";
import { MessageCircleHeart, Sparkles } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { TelaScreenBackdrop } from "@/components/TelaScreenBackdrop";
import { type FelicitacaoPhase, useFelicitacoesTela } from "@/hooks/useFelicitacoesTela";
import { useTelaRealtime } from "@/hooks/useTelaRealtime";
import { fetchRecentFelicitacoes, fetchScreenState, type ScreenMode } from "@/lib/api";
import type { ScreenStatePayload } from "@/lib/screen-ws";

/** Tela só de felicitações (sem selfies nem galeria). Use em projector separado de `/tela`. */
export const Route = createFileRoute("/felicitacoes-tela")({
  head: () => ({
    meta: [
      { title: "Felicitações — Tela" },
      { name: "description", content: "Mensagens de felicitações em tempo real." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FelicitacoesTelaPage,
});

const SPARKS = ["✨", "🎓", "💛", "⭐", "🎉"];

function FelicitacaoCard({
  guest_name,
  message,
  phase,
}: {
  guest_name: string;
  message: string;
  phase: FelicitacaoPhase;
}) {
  const cardClass =
    phase === "leave"
      ? "felic-card-out"
      : phase === "enter"
        ? "felic-card-in"
        : phase === "show"
          ? "felic-card-show"
          : "";
  const msgClass = phase === "show" || phase === "enter" ? "felic-msg-in" : "";

  return (
    <article
      className={`relative z-20 max-w-[82%] rounded-[2rem] border border-primary/35 bg-card/90 px-12 py-10 text-center shadow-gold backdrop-blur-md ${cardClass}`}
    >
      <Sparkles className="felic-icon-in mx-auto mb-4 text-primary" size={40} strokeWidth={1.5} />
      <MessageCircleHeart className="felic-icon-in mx-auto mb-6 text-primary/90" size={48} strokeWidth={1.4} />
      <p
        key={message}
        className={`font-script text-gold-gradient text-[clamp(1.85rem,3.8vw,3.25rem)] leading-snug ${msgClass}`}
      >
        &ldquo;{message}&rdquo;
      </p>
      <p className="felic-sub-in mt-6 text-lg font-medium tracking-wide text-gold-soft md:text-xl">— {guest_name}</p>
    </article>
  );
}

function FelicitacaoBackdrop({ phase }: { phase: FelicitacaoPhase }) {
  if (phase === "hidden") return null;
  const cls = phase === "leave" ? "felic-backdrop-out" : phase === "enter" ? "felic-backdrop-in" : "opacity-100";
  return <div className={`absolute inset-0 z-[15] bg-black/35 backdrop-blur-[2px] ${cls}`} aria-hidden />;
}

function FelicitacaoSparks() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[16] overflow-hidden" aria-hidden>
      {SPARKS.map((s, i) => (
        <span
          key={`${s}-${i}`}
          className="felic-spark absolute text-3xl opacity-75"
          style={{
            left: `${8 + ((i * 19) % 84)}%`,
            top: `${10 + ((i * 23) % 72)}%`,
            animationDelay: `${i * 0.14}s`,
          }}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function FelicitacaoStage({ phase, children }: { phase: FelicitacaoPhase; children: ReactNode }) {
  if (phase === "hidden") return null;
  return (
    <div className="relative z-20 flex w-full max-w-5xl items-center justify-center px-16" aria-live="polite">
      {children}
    </div>
  );
}

function FelicitacoesTelaStage({
  pool,
  initialState,
}: {
  pool: { id: number; guest_name: string; message: string }[];
  initialState: ScreenStatePayload | null;
}) {
  const { display, phase, enqueue } = useFelicitacoesTela(pool);
  const enqueueRef = useRef(enqueue);
  enqueueRef.current = enqueue;
  const { screenState, wsLive } = useTelaRealtime(initialState, (t) => enqueueRef.current(t));

  const mode: ScreenMode = screenState?.mode ?? "live";
  const liveSlides = screenState?.live_slides ?? [];

  return (
    <div className="dark grid min-h-screen place-items-center bg-secondary">
      <div className="relative overflow-hidden bg-background text-foreground" style={{ width: 1920, height: 1080 }}>
        <TelaScreenBackdrop
          mode={mode}
          liveSlides={liveSlides}
          activeMedia={screenState?.active_media ?? null}
        />

        <header className="absolute left-12 top-10 z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.45em] text-gold-soft">Graduação</p>
          <h1 className="font-script text-gold-gradient mt-1 text-4xl">Msc. Kayan &amp; Dra. Orquídea</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.3em] text-muted-foreground">Felicitações</p>
        </header>

        <div className="absolute right-12 top-10 z-10 flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-5 py-2.5 shadow-gold">
          <span
            className={`h-2.5 w-2.5 rounded-full animate-pulse ${wsLive ? "bg-primary" : "bg-primary/80"}`}
            title={wsLive ? "WebSocket" : "Sincronização HTTP"}
          />
          <span className="text-sm font-medium uppercase tracking-[0.35em] text-gold-soft">
            {wsLive ? "Tempo real" : "Sincronização"}
          </span>
        </div>

        <main className="absolute inset-0 z-10 grid place-items-center">
          {display && phase !== "hidden" ? (
            <>
              <FelicitacaoBackdrop phase={phase} />
              <FelicitacaoSparks />
              <FelicitacaoStage phase={phase}>
                <FelicitacaoCard guest_name={display.guest_name} message={display.message} phase={phase} />
              </FelicitacaoStage>
            </>
          ) : pool.length === 0 ? (
            <p className="glass max-w-md rounded-2xl px-8 py-6 text-center text-lg text-muted-foreground">
              As felicitações aparecem aqui em grande — à medida que os convidados enviam pelo convite.
            </p>
          ) : null}
        </main>

        <style>{`
          @keyframes felic-backdrop-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes felic-backdrop-out {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          @keyframes felic-card-in {
            0% { opacity: 0; transform: scale(0.9) translateY(24px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes felic-card-out {
            from { opacity: 1; transform: scale(1) translateY(0); }
            to { opacity: 0; transform: scale(0.94) translateY(-18px); }
          }
          @keyframes felic-msg-in {
            0% { opacity: 0; transform: translateY(20px); filter: blur(6px); }
            100% { opacity: 1; transform: translateY(0); filter: blur(0); }
          }
          @keyframes felic-icon-in {
            from { opacity: 0; transform: scale(0.7); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes felic-sub-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes felic-spark-float {
            0%, 100% { transform: translateY(0); opacity: 0.7; }
            50% { transform: translateY(-10px); opacity: 1; }
          }
          .felic-backdrop-in { animation: felic-backdrop-in 0.4s ease-out forwards; }
          .felic-backdrop-out { animation: felic-backdrop-out 0.65s ease-in forwards; }
          .felic-card-in { animation: felic-card-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
          .felic-card-out { animation: felic-card-out 0.65s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
          .felic-card-show { opacity: 1; transform: none; }
          .felic-msg-in { animation: felic-msg-in 0.65s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both; }
          .felic-icon-in { animation: felic-icon-in 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) forwards; }
          .felic-sub-in { animation: felic-sub-in 0.45s ease-out 0.22s both; }
          .felic-spark { animation: felic-spark-float 2.4s ease-in-out infinite; }
        `}</style>
      </div>
    </div>
  );
}

function FelicitacoesTelaPage() {
  const [boot, setBoot] = useState<{
    pool: { id: number; guest_name: string; message: string }[];
    state: ScreenStatePayload | null;
  } | null>(null);

  useEffect(() => {
    Promise.all([fetchScreenState(), fetchRecentFelicitacoes(40)])
      .then(([state, pool]) =>
        setBoot({
          state: {
            mode: state.mode,
            active_media: state.active_media,
            live_slides: state.live_slides ?? [],
          },
          pool,
        }),
      )
      .catch(() => setBoot({ state: null, pool: [] }));
  }, []);

  if (!boot) {
    return (
      <div className="dark grid min-h-screen place-items-center bg-secondary text-muted-foreground">
        A preparar as felicitações…
      </div>
    );
  }

  return <FelicitacoesTelaStage pool={boot.pool} initialState={boot.state} />;
}
