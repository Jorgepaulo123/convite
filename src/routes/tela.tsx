import { createFileRoute } from "@tanstack/react-router";
import { MessageCircleHeart, Radio, Sparkles, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import j2 from "@/assets/journey-2.jpg";
import { DOCK_FELICITATIONS_COUNT, useTelaBrindes } from "@/hooks/useTelaBrindes";
import { fetchRecentFelicitacoes, fetchScreenState, mediaUrl, type ScreenMode } from "@/lib/api";
import { connectScreenWebSocket, type ScreenStatePayload } from "@/lib/screen-ws";

export const Route = createFileRoute("/tela")({
  head: () => ({
    meta: [
      { title: "Tela Gigante — Graduação" },
      { name: "description", content: "Transmissão ao vivo para a tela do evento." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Tela,
});

const CONFETTI = ["✨", "🎓", "💛", "⭐", "🎉", "✨", "💫", "🎊"];
const IDLE_ROTATE_MS = 9000;
const LIVE_SLIDE_MS = 8000;

function LiveSlideBackground({ slides, fallbackSrc }: { slides: { id: number; url: string }[]; fallbackSrc: string }) {
  const [index, setIndex] = useState(0);

  const slideKey = slides.map((s) => s.id).join(",");
  useEffect(() => {
    setIndex(0);
  }, [slideKey]);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), LIVE_SLIDE_MS);
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) {
    return <img src={fallbackSrc} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />;
  }

  return (
    <>
      {slides.map((slide, i) => (
        <img
          key={slide.id}
          src={mediaUrl(slide.url)}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out ${
            i === index ? "opacity-70" : "opacity-0"
          }`}
        />
      ))}
    </>
  );
}

function GraduateName({ children, alignEnd }: { children: string; alignEnd?: boolean }) {
  return (
    <h1
      className={`font-script-display text-gold-gradient text-[8rem] leading-none ${alignEnd ? "text-right" : ""}`}
    >
      {children}
    </h1>
  );
}

function DockCard({
  guest_name,
  message,
  exiting,
  entering,
}: {
  guest_name: string;
  message: string;
  exiting: boolean;
  entering: boolean;
}) {
  let animClass = "dock-card-settled";
  if (exiting) animClass = "animate-dock-exit-top";
  else if (entering) animClass = "animate-dock-enter-bottom";

  return (
    <article className={`dock-card ${animClass}`}>
      <MessageCircleHeart className="mb-1.5 text-primary/90" size={20} />
      <p className="line-clamp-3 text-xl leading-snug text-foreground">&ldquo;{message}&rdquo;</p>
      <p className="mt-2 text-sm font-medium text-primary/90">— {guest_name}</p>
    </article>
  );
}

function Tela() {
  const [boot, setBoot] = useState<{
    state: ScreenStatePayload | null;
    pool: { id: number; guest_name: string; message: string }[];
  } | null>(null);

  useEffect(() => {
    Promise.all([fetchScreenState(), fetchRecentFelicitacoes(30)])
      .then(([state, recent]) => setBoot({ state, pool: recent }))
      .catch(() => setBoot({ state: null, pool: [] }));
  }, []);

  if (!boot) {
    return (
      <div className="dark grid min-h-screen place-items-center bg-secondary text-muted-foreground">
        A preparar a tela…
      </div>
    );
  }

  return <TelaStage initialState={boot.state} felicitationPool={boot.pool} />;
}

function TelaStage({
  initialState,
  felicitationPool,
}: {
  initialState: ScreenStatePayload | null;
  felicitationPool: { id: number; guest_name: string; message: string }[];
}) {
  const { spotlight, flying, docked, enqueue, isIdle, rotateDock, exitTopId, enterBottomId } =
    useTelaBrindes(felicitationPool);
  const enqueueRef = useRef(enqueue);
  enqueueRef.current = enqueue;
  const [screenState, setScreenState] = useState<ScreenStatePayload | null>(initialState);
  const [wsLive, setWsLive] = useState(false);

  useEffect(() => {
    return connectScreenWebSocket({
      onToast: (t) => enqueueRef.current(t),
      onState: (next) =>
        setScreenState((prev) => ({
          mode: next.mode,
          active_media: next.active_media,
          live_slides: next.live_slides ?? prev?.live_slides ?? [],
        })),
      onOpen: () => setWsLive(true),
      onClose: () => setWsLive(false),
    });
  }, []);

  useEffect(() => {
    if (!isIdle || docked.length === 0) return;
    const id = setInterval(rotateDock, IDLE_ROTATE_MS);
    return () => clearInterval(id);
  }, [isIdle, docked.length, rotateDock]);

  const mode: ScreenMode = screenState?.mode ?? "live";
  const liveSlides = screenState?.live_slides ?? [];
  const bg = screenState?.active_media?.url ? mediaUrl(screenState.active_media.url) : j2;
  const isVideo = mode !== "live" && screenState?.active_media?.media_type === "video";

  return (
    <div className="dark grid min-h-screen place-items-center bg-secondary">
      <div className="relative overflow-hidden bg-background text-foreground" style={{ width: 1920, height: 1080 }}>
        {mode === "live" ? (
          <LiveSlideBackground slides={liveSlides} fallbackSrc={j2} />
        ) : isVideo ? (
          <video src={bg} className="absolute inset-0 h-full w-full object-cover opacity-70" autoPlay muted loop playsInline />
        ) : (
          <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        )}
        <div className="bg-veil absolute inset-0" />

        {mode === "live" && (
          <div className="absolute left-12 top-10 z-10 flex items-center gap-3 rounded-full bg-destructive px-5 py-2 font-semibold text-destructive-foreground">
            <Radio size={20} /> AO VIVO
          </div>
        )}

        <div className="absolute right-12 top-10 z-10 flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-5 py-2.5 shadow-gold">
          <span
            className={`h-2.5 w-2.5 rounded-full ${wsLive ? "animate-pulse bg-primary" : "bg-muted-foreground"}`}
            title={wsLive ? "Ligado" : "A reconectar"}
          />
          <span className="text-sm font-medium uppercase tracking-[0.35em] text-gold-soft">Felicitações</span>
        </div>

        <aside className="absolute right-8 top-1/2 z-10 flex w-[min(360px,24vw)] min-h-[400px] -translate-y-1/2 flex-col justify-center gap-3 pr-1">
          {Array.from({ length: DOCK_FELICITATIONS_COUNT }, (_, i) => docked[i]).map((m, i) =>
            m ? (
              <DockCard
                key={m.id}
                guest_name={m.guest_name}
                message={m.message}
                exiting={exitTopId === m.id && i === 0}
                entering={enterBottomId === m.id && i === docked.length - 1}
              />
            ) : (
              <div key={`slot-${i}`} className="dock-card dock-card-placeholder min-h-[72px] opacity-30" aria-hidden />
            ),
          )}
        </aside>

        <div className="absolute bottom-14 left-14 z-0 max-w-[42%]">
          <p className="text-xl uppercase tracking-[0.45em] text-gold-soft">Graduada</p>
          <GraduateName>MSc.Kayan</GraduateName>
        </div>

        <div className="absolute bottom-14 right-14 z-0 flex max-w-[42%] flex-col items-end text-right">
          <p className="text-xl uppercase tracking-[0.45em] text-gold-soft">Graduada</p>
          <GraduateName alignEnd>Dra.Orquídea</GraduateName>
        </div>

        {flying && (
          <div key={`fly-${flying.id}`} className="animate-fly-to-dock pointer-events-none absolute z-30 w-[min(720px,55vw)]">
            <div className="glass rounded-3xl border border-primary/40 px-8 py-6 shadow-gold">
              <p className="font-script text-gold-gradient text-3xl leading-snug">&ldquo;{flying.message}&rdquo;</p>
              <p className="mt-3 text-lg text-gold-soft">— {flying.guest_name}</p>
            </div>
          </div>
        )}

        {spotlight && (
          <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
            <div className="animate-brinde-backdrop absolute inset-0 bg-black/45 backdrop-blur-[2px]" />

            {spotlight.kind === "photo" && (
              <div key={`photo-${spotlight.id}`} className="animate-brinde-center relative z-10 flex flex-col items-center">
                <div className="phone-mockup shadow-gold">
                  <div className="phone-notch" />
                  <img src={mediaUrl(spotlight.url)} alt="" className="phone-screen object-cover" />
                </div>
                <p className="mt-6 flex items-center gap-2 text-2xl text-secondary-foreground">
                  <Smartphone className="text-primary" size={28} />
                  <span className="font-semibold text-primary">{spotlight.guest_name}</span> partilhou um momento
                </p>
              </div>
            )}

            {spotlight.kind === "message" && (
              <div key={`msg-${spotlight.id}`} className="animate-brinde-center relative z-10 max-w-3xl px-12 text-center">
                <div className="celebrate-confetti pointer-events-none absolute inset-0 overflow-hidden">
                  {CONFETTI.map((c, i) => (
                    <span key={i} className="confetti-piece" style={{ left: `${8 + i * 11}%`, animationDelay: `${i * 0.12}s` }}>
                      {c}
                    </span>
                  ))}
                </div>
                <div className="glass relative rounded-[2rem] border border-primary/30 px-12 py-10 shadow-gold">
                  <Sparkles className="mx-auto mb-4 text-primary" size={48} />
                  <MessageCircleHeart className="mx-auto mb-6 text-primary" size={56} />
                  <p className="font-script text-gold-gradient text-5xl leading-snug">&ldquo;{spotlight.message}&rdquo;</p>
                  <p className="mt-6 text-2xl tracking-wide text-gold-soft">— {spotlight.guest_name}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
