import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock, LockOpen, ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import hero from "@/assets/Kayan-hero.jpeg";
import { EVENT } from "@/lib/mock";
import { fetchEventInfo, fetchGuestByCode, verifyGuestCode, type Guest } from "@/lib/api";
import { formatEventDate } from "@/lib/event-date";
import { GUEST_CODE_MAX_LEN, isValidGuestCode, normalizeGuestCode } from "@/lib/guest-code";
import { ThemeToggle } from "@/components/ThemeToggle";
import { shareMetaTags } from "@/lib/site-meta";

type Search = { c?: string | undefined };

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): Search => ({ c: typeof s["c"] === "string" ? s["c"] : undefined }),
  head: () => ({
    meta: shareMetaTags(),
  }),
  component: Portal,
});

function Portal() {
  const { c } = Route.useSearch();
  const navigate = useNavigate();
  const [linkedGuest, setLinkedGuest] = useState<Guest | undefined>();
  const [opening, setOpening] = useState(false);
  const [askCode, setAskCode] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const eventQuery = useQuery({
    queryKey: ["event-info"],
    queryFn: fetchEventInfo,
  });

  const eventDate = eventQuery.data ? formatEventDate(eventQuery.data.event_date).date : EVENT.date;

  useEffect(() => {
    if (!c || !isValidGuestCode(c)) {
      setLinkedGuest(undefined);
      return;
    }
    let cancelled = false;
    fetchGuestByCode(c).then((g) => {
      if (!cancelled) setLinkedGuest(g);
    });
    return () => {
      cancelled = true;
    };
  }, [c]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = normalizeGuestCode(code);
    if (!isValidGuestCode(trimmed)) {
      setError("Introduza o seu número de telemóvel completo.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const guest = await verifyGuestCode(trimmed);
      setAskCode(false);
      setOpening(true);
      setTimeout(() => navigate({ to: "/convite", search: { c: guest.code } }), 700);
    } catch {
      setError("Número não encontrado. Verifique com a organização.");
    } finally {
      setLoading(false);
    }
  };

  const knownGuest = linkedGuest;

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col overflow-hidden">
      <ThemeToggle />
      <img
        src={hero}
        alt="MSc. Kayan e Dra. Orquídea"
        width={864}
        height={1536}
        className={`absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ${opening ? "scale-110" : ""}`}
      />
      <div className="bg-veil absolute inset-0" />
      <div className="relative mt-auto flex flex-col items-center px-6 pb-10 text-center text-secondary-foreground">
        <p className="tracking-[0.4em] text-sm font-semibold text-gold-soft">{eventDate}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.5em] text-gold-soft/80">Graduadas</p>
        <div className="mt-2 flex w-full flex-col items-center gap-0 leading-none">
          <h1 className="font-script-display text-gold-gradient text-[clamp(2.75rem,11vw,4.25rem)]">MSc. Kayan</h1>
          <h1 className="font-script-display text-gold-gradient -mt-1 text-[clamp(2.75rem,11vw,4.25rem)]">Dra. Orquídea</h1>
        </div>
        <ChevronDown className="mt-4 animate-bounce text-gold" />
        <button
          onClick={() => {
            setError("");
            setAskCode(true);
          }}
          aria-label="Introduzir código de convite"
          className={`mt-3 grid h-20 w-20 place-items-center rounded-full ${knownGuest ? "bg-gold-gradient animate-pulse-ring text-primary-foreground shadow-gold" : "glass text-muted-foreground"}`}
        >
          {knownGuest ? <LockOpen size={30} /> : <Lock size={30} />}
        </button>
        <p className="mt-4 text-sm tracking-widest text-gold-soft">
          {knownGuest
            ? `${knownGuest.name} — toque no cadeado e indique o seu número`
            : "Convite exclusivo — toque no cadeado"}
        </p>
      </div>

      {askCode && (
        <div className="fixed inset-0 z-50 grid place-items-center p-6">
          <div className="bg-veil absolute inset-0 backdrop-blur-sm" onClick={() => setAskCode(false)} />
          <form onSubmit={submit} className="glass relative w-full max-w-xs rounded-3xl p-6 text-center">
            <button type="button" onClick={() => setAskCode(false)} aria-label="Fechar" className="absolute right-3 top-3 text-muted-foreground">
              <X size={18} />
            </button>
            <p className="font-script text-gold-gradient text-4xl">Número de convite</p>
            <p className="mt-2 text-sm text-muted-foreground">Use o mesmo número de telemóvel que a organização registou.</p>
            <input
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(normalizeGuestCode(e.target.value));
                setError("");
              }}
              inputMode="tel"
              maxLength={GUEST_CODE_MAX_LEN}
              placeholder="84XXXXXXXX"
              aria-label="Número de telemóvel"
              className="mt-5 w-full rounded-full border border-input bg-transparent px-5 py-3 text-center text-xl tracking-wider outline-none focus:ring-2 focus:ring-ring"
            />
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-gold-gradient mt-5 w-full rounded-full py-3 font-semibold text-primary-foreground shadow-gold disabled:opacity-50"
            >
              {loading ? "A verificar…" : "Abrir convite"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
