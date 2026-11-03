import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Camera, Gift, MapPin, CheckCircle2, MessageCircleHeart, Images, CalendarDays, Armchair } from "lucide-react";
import hero from "@/assets/Kayan-hero.jpg";
import j1 from "@/assets/journey-1.jpg";
import j2 from "@/assets/journey-2.jpg";
import { EVENT } from "@/lib/mock";
import { fetchEventInfo, fetchGallery, fetchGuestByCode, fetchProgram, mediaUrl } from "@/lib/api";
import { formatEventDate } from "@/lib/event-date";
import { ThemeToggle } from "@/components/ThemeToggle";

type Search = { c?: string | undefined };

export const Route = createFileRoute("/convite")({
  validateSearch: (s: Record<string, unknown>): Search => ({ c: typeof s["c"] === "string" ? s["c"] : undefined }),
  head: () => ({
    meta: [
      { title: "O seu convite — Graduação Dra Kayan" },
      { name: "description", content: "Detalhes, mesa, local, presentes e galeria da graduação da Dra Kayan." },
      { property: "og:title", content: "O seu convite — Dra Kayan" },
      { property: "og:description", content: "Confirme presença, envie felicitações e partilhe fotos." },
    ],
  }),
  component: Convite,
});

const fallbackGallery = [hero, j1, j2, j1, j2, hero];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="px-6 py-10 text-center">
      <h2 className="font-script text-gold-gradient text-5xl">{title}</h2>
      <div className="mx-auto my-4 h-px w-24 bg-gold-gradient" />
      {children}
    </section>
  );
}

function Convite() {
  const { c } = Route.useSearch();
  const code = c && /^\d{6}$/.test(c) ? c : undefined;

  const guestQuery = useQuery({
    queryKey: ["guest", code],
    queryFn: () => fetchGuestByCode(code!),
    enabled: !!code,
  });

  const galleryQuery = useQuery({
    queryKey: ["gallery"],
    queryFn: fetchGallery,
  });

  const programQuery = useQuery({
    queryKey: ["program"],
    queryFn: fetchProgram,
  });

  const eventQuery = useQuery({
    queryKey: ["event-info"],
    queryFn: fetchEventInfo,
  });

  const dateLong = eventQuery.data
    ? formatEventDate(eventQuery.data.event_date).dateLong
    : EVENT.dateLong;

  const agenda =
    programQuery.data && programQuery.data.length > 0 ? programQuery.data : EVENT.agenda.map((a, i) => ({ ...a, id: i }));

  const guest = guestQuery.data;

  if (!code) {
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="text-muted-foreground">Abra o convite com o seu código na página inicial.</p>
          <Link to="/" className="mt-4 inline-block text-primary underline">
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  if (guestQuery.isLoading) {
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <p className="text-muted-foreground">A carregar convite…</p>
      </main>
    );
  }

  if (!guest) {
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="text-muted-foreground">Convite não encontrado.</p>
          <Link to="/" className="mt-4 inline-block text-primary underline">
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  const journeyPhotos = galleryQuery.data ?? [];
  const hasJourneyGallery = journeyPhotos.length > 0;
  const usePlaceholderGallery =
    !galleryQuery.isLoading && !galleryQuery.isError && !hasJourneyGallery;

  return (
    <main className="relative mx-auto max-w-md pb-32">
      <ThemeToggle />
      <header className="relative h-[70vh] overflow-hidden rounded-b-[3rem]">
        <img src={hero} alt="MSc. Kayan e Dra. Orquídea" className="h-full w-full object-cover object-top" />
        <div className="bg-veil absolute inset-0" />
        <div className="absolute inset-x-0 bottom-8 text-center text-secondary-foreground">
          <p className="text-xs uppercase tracking-[0.4em] text-gold-soft">Bem-vindo(a)</p>
          <h1 className="mt-2 text-2xl font-semibold">{guest.name}</h1>
          {guest.table && (
            <span className="bg-gold-gradient mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-semibold text-primary-foreground">
              <Armchair size={14} /> {guest.table}
            </span>
          )}
        </div>
      </header>

      <Section id="programa" title="Programa">
        <p className="font-semibold">{dateLong}</p>
        <div className="mt-6 space-y-6">
          {agenda.map((a) => (
            <div key={"id" in a ? a.id : a.title}>
              <p className="font-script text-4xl">{a.title}</p>
              <p className="tracking-widest text-primary">{a.time}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="local" title="Local">
        <p className="mb-4 flex items-center justify-center gap-2">
          <MapPin size={16} className="text-primary" />
          {EVENT.venue}
        </p>
        <div className="glass overflow-hidden rounded-3xl">
          <iframe title="Mapa" className="h-64 w-full" loading="lazy" src={`https://www.google.com/maps?q=${encodeURIComponent(EVENT.mapQuery)}&output=embed`} />
        </div>
      </Section>

      <Section id="acoes" title="Celebre comigo">
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: CheckCircle2, label: "Confirmar presença", to: "/convite/presenca" },
            { icon: Gift, label: "Dar presente", to: "/convite/presente" },
            { icon: MessageCircleHeart, label: "Felicitações", to: "/convite/felicitacoes" },
            { icon: Camera, label: "Tirar foto", to: "/convite/foto" },
          ].map(({ icon: Icon, label, to }) => (
            <Link key={label} to={to as "/convite/foto"} search={{ c: code }} className="glass flex flex-col items-center gap-2 rounded-2xl p-5 transition hover:shadow-gold">
              <Icon className="text-primary" />
              <span className="text-sm font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section id="galeria" title="A Jornada">
        <p className="mb-4 text-sm text-muted-foreground">Momentos históricos da vida estudantil</p>
        {galleryQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">A carregar galeria…</p>
        ) : hasJourneyGallery ? (
          <div className="grid grid-cols-3 gap-2">
            {journeyPhotos.map((item) => (
              <img
                key={item.id}
                src={mediaUrl(item.url)}
                alt=""
                loading="lazy"
                className="aspect-[3/4] w-full rounded-xl object-cover"
              />
            ))}
          </div>
        ) : usePlaceholderGallery ? (
          <div className="grid grid-cols-3 gap-2">
            {fallbackGallery.map((g, i) => (
              <img key={i} src={g} alt="" loading="lazy" className="aspect-[3/4] w-full rounded-xl object-cover" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">A galeria será actualizada em breve.</p>
        )}
      </Section>

      <Link to="/convite/foto" search={{ c: code }} aria-label="Tirar foto" className="bg-gold-gradient animate-pulse-ring fixed bottom-24 right-5 z-40 grid h-14 w-14 place-items-center rounded-full text-primary-foreground">
        <Camera />
      </Link>

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md rounded-t-[2.5rem] bg-secondary px-6 py-4 text-secondary-foreground">
        <div className="flex justify-between">
          {[
            ["#programa", CalendarDays],
            ["#local", MapPin],
            ["#acoes", Gift],
            ["#galeria", Images],
          ].map(([href, Icon]: any) => (
            <a key={href} href={href} className="grid h-11 w-11 place-items-center rounded-full text-gold-soft hover:text-primary">
              <Icon />
            </a>
          ))}
        </div>
      </nav>
    </main>
  );
}
