import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock, LockOpen, ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import hero from "@/assets/Kayan-hero.jpg";
import { EVENT } from "@/lib/mock";
import { fetchEventInfo, fetchGuestByCode, verifyGuestCode, type Guest } from "@/lib/api";
import { formatEventDate } from "@/lib/event-date";
import { ThemeToggle } from "@/components/ThemeToggle";

type Search = { c?: string | undefined };

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): Search => ({ c: typeof s["c"] === "string" ? s["c"] : undefined }),
  head: () => ({
    meta: [
      { title: "Graduação Dra Kayan — Convite" },
      { name: "description", content: "Convite digital para a graduação da Dra Kayan." },
      { property: "og:title", content: "Graduação Dra Kayan" },
      { property: "og:description", content: "Você está convidado(a) para celebrar a graduação da Dra Kayan." },
    ],
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
    if (!c || !/^\d{6}$/.test(c)) {
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
    const trimmed = code.replace(/\D/g, "").slice(0, 6);
    if (trimmed.length !== 6) {
      setError("Introduza o código de 6 dígitos.");
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
      setError("Código incorrecto. Verifique com a organização.");
    } finally {
      setLoading(false);
    }
  };

  const knownGuest = linkedGuest;

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col overflow-hidden">
      <ThemeToggle />
      <img src={hero} alt="Dra Kayan" width={864} height={1536} className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ${opening ? "scale-110" : ""}`} />
      <div className="bg-veil absolute inset-0" />
      <div className="relative mt-auto flex flex-col items-center px-6 pb-10 text-center text-secondary-foreground">
        <p className="tracking-[0.4em] text-sm font-semibold text-gold-soft">{eventDate}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.5em] text-gold-soft/80">Graduada</p>
        <h1 className="font-script text-gold-gradient text-7xl leading-tight">Dra Kayan</h1>
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
            ? `${knownGuest.name} — toque no cadeado e indique o seu código`
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
            <p className="font-script text-gold-gradient text-4xl">Código de convite</p>
            <p className="mt-2 text-sm text-muted-foreground">Introduza o código de 6 dígitos que recebeu.</p>
            <input
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              aria-label="Código de convite"
              className="mt-5 w-full rounded-full border border-input bg-transparent px-5 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-ring"
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
