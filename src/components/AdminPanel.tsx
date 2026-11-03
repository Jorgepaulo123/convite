import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Upload,
  MonitorPlay,
  Video,
  Image,
  Music,
  MessageSquare,
  LogOut,
  LayoutDashboard,
  CalendarDays,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  adminCreateGuest,
  adminDeleteGuest,
  adminListFelicitacoes,
  adminCreateProgramItem,
  adminDeleteProgramItem,
  adminListGuestPhotos,
  adminListGuests,
  adminSetScreenMode,
  adminUpdateGuest,
  adminUpdateProgramItem,
  adminUpdateEventInfo,
  adminDeleteGalleryItem,
  adminUploadGallery,
  adminUploadScreenMedia,
  fetchEventInfo,
  fetchGallery,
  fetchProgram,
  fetchScreenState,
  mediaUrl,
  type ScreenMode,
} from "@/lib/api";
import { logoutAdmin } from "@/lib/admin-auth";
import { formatEventDate } from "@/lib/event-date";
import { ThemeToggle } from "@/components/ThemeToggle";

const MODES: { id: ScreenMode; label: string; icon: typeof Video }[] = [
  { id: "live", label: "Ao vivo", icon: Video },
  { id: "photos", label: "Fotos", icon: Image },
  { id: "dance", label: "Dança", icon: Music },
  { id: "brindes", label: "Brindes", icon: MessageSquare },
];

type Section = "guests" | "program" | "screen" | "gallery" | "messages";

const NAV: { id: Section; label: string; icon: typeof Users }[] = [
  { id: "guests", label: "Convidados", icon: Users },
  { id: "program", label: "Programa", icon: CalendarDays },
  { id: "screen", label: "Tela gigante", icon: MonitorPlay },
  { id: "gallery", label: "Galeria", icon: Upload },
  { id: "messages", label: "Felicitações", icon: MessageSquare },
];

type AdminPanelProps = {
  onLogout: () => void;
};

export function AdminPanel({ onLogout }: AdminPanelProps) {
  const qc = useQueryClient();
  const [section, setSection] = useState<Section>("guests");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [table, setTable] = useState("");
  const [progTitle, setProgTitle] = useState("");
  const [progTime, setProgTime] = useState("");
  const [screenPanel, setScreenPanel] = useState<ScreenMode | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const guestsQuery = useQuery({
    queryKey: ["admin-guests"],
    queryFn: adminListGuests,
    retry: false,
  });

  const felicQuery = useQuery({
    queryKey: ["admin-felicitacoes"],
    queryFn: adminListFelicitacoes,
  });

  const guestPhotosQuery = useQuery({
    queryKey: ["admin-guest-photos"],
    queryFn: adminListGuestPhotos,
    enabled: section === "gallery",
    refetchInterval: section === "gallery" ? 15000 : false,
  });

  const journeyGalleryQuery = useQuery({
    queryKey: ["gallery"],
    queryFn: fetchGallery,
    enabled: section === "gallery" || section === "screen",
  });

  const programQuery = useQuery({
    queryKey: ["program"],
    queryFn: fetchProgram,
    enabled: section === "program",
  });

  const eventQuery = useQuery({
    queryKey: ["event-info"],
    queryFn: fetchEventInfo,
    enabled: section === "program",
  });

  const screenStateQuery = useQuery({
    queryKey: ["screen-state"],
    queryFn: fetchScreenState,
    enabled: section === "screen",
  });

  useEffect(() => {
    if (section !== "screen") {
      setScreenPanel(null);
      return;
    }
    if (screenStateQuery.data && screenPanel === null) {
      setScreenPanel(screenStateQuery.data.mode);
    }
  }, [section, screenStateQuery.data, screenPanel]);

  const [draftEventDate, setDraftEventDate] = useState("");
  const [draftProgram, setDraftProgram] = useState<{ id: number; title: string; time: string }[]>([]);
  const [savingProgram, setSavingProgram] = useState(false);

  useEffect(() => {
    if (eventQuery.data?.event_date) setDraftEventDate(eventQuery.data.event_date);
  }, [eventQuery.data?.event_date]);

  useEffect(() => {
    if (programQuery.data) {
      setDraftProgram(programQuery.data.map((item) => ({ id: item.id, title: item.title, time: item.time })));
    }
  }, [programQuery.data]);

  const programSectionDirty = useMemo(() => {
    const serverDate = eventQuery.data?.event_date ?? "";
    if (draftEventDate && draftEventDate !== serverDate) return true;
    if (!programQuery.data) return false;
    return draftProgram.some((d) => {
      const orig = programQuery.data!.find((x) => x.id === d.id);
      if (!orig) return false;
      return orig.title !== d.title.trim() || orig.time !== d.time.trim();
    });
  }, [draftEventDate, draftProgram, eventQuery.data?.event_date, programQuery.data]);

  const saveProgramSection = async () => {
    setErr("");
    setSavingProgram(true);
    try {
      const serverDate = eventQuery.data?.event_date ?? "";
      if (draftEventDate && draftEventDate !== serverDate) {
        await adminUpdateEventInfo(draftEventDate);
      }
      for (const item of draftProgram) {
        const orig = programQuery.data?.find((x) => x.id === item.id);
        if (!orig) continue;
        const title = item.title.trim();
        const time = item.time.trim();
        if (title !== orig.title || time !== orig.time) {
          await adminUpdateProgramItem(item.id, { title, time });
        }
      }
      setMsg("Programa guardado.");
      await qc.invalidateQueries({ queryKey: ["program"] });
      await qc.invalidateQueries({ queryKey: ["event-info"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao guardar");
    } finally {
      setSavingProgram(false);
    }
  };

  const addGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      const g = await adminCreateGuest(name.trim(), contact.trim(), table.trim() || undefined);
      setName("");
      setContact("");
      setTable("");
      setMsg(`Convidado criado. Código: ${g.code}`);
      qc.invalidateQueries({ queryKey: ["admin-guests"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  };

  const onGallery = async (files: FileList | null) => {
    if (!files?.length) return;
    setErr("");
    try {
      for (const f of Array.from(files)) await adminUploadGallery(f);
      setMsg("Fotos carregadas — aparecem no convite (secção A Jornada).");
      await qc.invalidateQueries({ queryKey: ["gallery"] });
      await qc.invalidateQueries({ queryKey: ["screen-state"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro no upload");
    }
  };

  const onScreenMedia = async (files: FileList | null) => {
    if (!files?.length) return;
    setErr("");
    try {
      for (const f of Array.from(files)) await adminUploadScreenMedia(f);
      setMsg("Media da tela carregada.");
      qc.invalidateQueries({ queryKey: ["screen-state"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro no upload");
    }
  };

  const addProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      await adminCreateProgramItem(progTitle.trim(), progTime.trim());
      setProgTitle("");
      setProgTime("");
      setMsg("Item do programa adicionado.");
      qc.invalidateQueries({ queryKey: ["program"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  };

  const setMode = async (mode: ScreenMode) => {
    setErr("");
    try {
      await adminSetScreenMode(mode);
      setScreenPanel(mode);
      setMsg(`Modo da tela: ${MODES.find((m) => m.id === mode)?.label ?? mode}`);
      qc.invalidateQueries({ queryKey: ["screen-state"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    qc.clear();
    onLogout();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="glass flex w-64 shrink-0 flex-col border-r border-border p-4">
        <div className="mb-6 flex items-center gap-2 px-2">
          <LayoutDashboard className="text-primary" size={22} />
          <span className="font-script text-gold-gradient text-3xl">Painel</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                section === id ? "bg-gold-gradient text-primary-foreground shadow-gold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto p-6 md:p-8">
        {guestsQuery.isError && (
          <p className="mb-4 text-sm text-destructive">
            {guestsQuery.error instanceof Error ? guestsQuery.error.message : "Erro de ligação"} — saia e entre de novo. API na
            porta 8000.
          </p>
        )}
        {msg && <p className="mb-4 text-sm text-primary">{msg}</p>}
        {err && <p className="mb-4 text-sm text-destructive">{err}</p>}

        {section === "guests" && (
          <div className="max-w-2xl">
            <h2 className="mb-6 text-xl font-semibold">Convidados & mesas</h2>
            <ul className="mb-6 max-h-[50vh] space-y-2 overflow-y-auto text-sm">
              {(guestsQuery.data ?? []).map((g) => (
                <li key={g.id} className="glass rounded-xl px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{g.contact}</p>
                      <p className="font-mono text-sm tracking-widest text-primary">{g.code}</p>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-destructive"
                      onClick={async () => {
                        await adminDeleteGuest(g.id);
                        qc.invalidateQueries({ queryKey: ["admin-guests"] });
                      }}
                    >
                      Remover
                    </button>
                  </div>
                  <input
                    defaultValue={g.table ?? ""}
                    placeholder="Mesa (ex: Mesa 3)"
                    className="mt-2 w-full rounded-lg border border-input bg-transparent px-2 py-1.5 text-xs"
                    onBlur={async (e) => {
                      const v = e.target.value.trim();
                      if (v === (g.table ?? "")) return;
                      await adminUpdateGuest(g.id, { table: v || null });
                      qc.invalidateQueries({ queryKey: ["admin-guests"] });
                    }}
                  />
                </li>
              ))}
            </ul>
            <form onSubmit={addGuest} className="glass space-y-3 rounded-2xl p-5">
              <p className="text-sm font-medium">Novo convidado</p>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="w-full rounded-full border border-input bg-transparent px-4 py-2 text-sm" />
              <input required value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contacto" className="w-full rounded-full border border-input bg-transparent px-4 py-2 text-sm" />
              <input value={table} onChange={(e) => setTable(e.target.value)} placeholder="Mesa (opcional)" className="w-full rounded-full border border-input bg-transparent px-4 py-2 text-sm" />
              <button type="submit" className="bg-gold-gradient w-full rounded-full py-2.5 text-sm font-semibold text-primary-foreground">
                Adicionar (código automático)
              </button>
            </form>
          </div>
        )}

        {section === "program" && (
          <div className="max-w-xl">
            <h2 className="mb-2 text-xl font-semibold">Programa do evento</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Data e horários aparecem na página inicial e no convite dos convidados.
            </p>
            <div className="glass mb-6 space-y-2 rounded-2xl p-5">
              <p className="text-sm font-medium">Data do evento</p>
              <input
                type="date"
                className="w-full rounded-full border border-input bg-transparent px-4 py-2 text-sm"
                value={draftEventDate}
                disabled={eventQuery.isLoading}
                onChange={(e) => setDraftEventDate(e.target.value)}
              />
              {draftEventDate && (
                <p className="text-xs text-muted-foreground">
                  Pré-visualização: {formatEventDate(draftEventDate).dateLong} ({formatEventDate(draftEventDate).date})
                </p>
              )}
            </div>

            <p className="mb-2 text-sm font-medium">Momentos do dia</p>
            <ul className="mb-4 space-y-2">
              {draftProgram.map((item) => (
                <li key={item.id} className="glass flex flex-wrap items-center gap-2 rounded-xl px-3 py-3 text-sm">
                  <input
                    value={item.title}
                    onChange={(e) =>
                      setDraftProgram((rows) =>
                        rows.map((r) => (r.id === item.id ? { ...r, title: e.target.value } : r)),
                      )
                    }
                    placeholder="Momento"
                    className="min-w-[140px] flex-1 rounded-lg border border-input bg-transparent px-2 py-1.5"
                  />
                  <input
                    value={item.time}
                    onChange={(e) =>
                      setDraftProgram((rows) =>
                        rows.map((r) => (r.id === item.id ? { ...r, time: e.target.value } : r)),
                      )
                    }
                    placeholder="16H00"
                    className="w-24 rounded-lg border border-input bg-transparent px-2 py-1.5 text-center font-mono"
                  />
                  <button
                    type="button"
                    className="text-xs text-destructive"
                    onClick={async () => {
                      await adminDeleteProgramItem(item.id);
                      qc.invalidateQueries({ queryKey: ["program"] });
                    }}
                  >
                    Remover
                  </button>
                </li>
              ))}
              {!draftProgram.length && !programQuery.isLoading && (
                <p className="text-sm text-muted-foreground">Sem itens. Adicione abaixo ou reinicie a API para dados iniciais.</p>
              )}
            </ul>

            <button
              type="button"
              disabled={!programSectionDirty || savingProgram || programQuery.isLoading}
              onClick={saveProgramSection}
              className="bg-gold-gradient mb-6 w-full rounded-full py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              {savingProgram ? "A guardar…" : "Guardar alterações"}
            </button>
            <form onSubmit={addProgram} className="glass space-y-3 rounded-2xl p-5">
              <p className="text-sm font-medium">Novo momento</p>
              <input
                required
                value={progTitle}
                onChange={(e) => setProgTitle(e.target.value)}
                placeholder="Ex: Cerimónia"
                className="w-full rounded-full border border-input bg-transparent px-4 py-2 text-sm"
              />
              <input
                required
                value={progTime}
                onChange={(e) => setProgTime(e.target.value)}
                placeholder="Ex: 16H00"
                className="w-full rounded-full border border-input bg-transparent px-4 py-2 text-sm"
              />
              <button type="submit" className="bg-gold-gradient w-full rounded-full py-2.5 text-sm font-semibold text-primary-foreground">
                Adicionar ao programa
              </button>
            </form>
          </div>
        )}

        {section === "screen" && (
          <div className="max-w-2xl">
            <h2 className="mb-6 text-xl font-semibold">Controlo da tela</h2>
            <p className="mb-4 text-sm text-muted-foreground">Abra /tela no projetor. Brindes chegam por WebSocket em tempo real.</p>
            <div className="grid grid-cols-2 gap-3">
              {MODES.map(({ id, label, icon: I }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={`glass flex items-center gap-2 rounded-xl p-4 text-sm hover:shadow-gold ${
                    screenPanel === id ? "ring-2 ring-primary shadow-gold" : ""
                  }`}
                >
                  <I size={18} className="text-primary" />
                  {label}
                </button>
              ))}
            </div>

            {screenPanel === "live" && (
              <section className="mt-8">
                <h3 className="mb-1 text-lg font-semibold">Fotos no fundo (Ao vivo)</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Usa a mesma galeria do convite (A Jornada): fotos que carregas no menu{" "}
                  <button type="button" className="font-medium text-primary underline" onClick={() => setSection("gallery")}>
                    Galeria
                  </button>{" "}
                  e selfies enviadas pelos convidados. Passam em sequência em /tela e aparecem no final do convite.
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {(journeyGalleryQuery.data ?? []).slice(0, 8).map((item) => (
                    <img
                      key={item.id}
                      src={mediaUrl(item.url)}
                      alt=""
                      className="aspect-[3/4] rounded-lg object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
                {!journeyGalleryQuery.data?.length && !journeyGalleryQuery.isLoading && (
                  <p className="text-sm text-muted-foreground">Sem fotos ainda — carregue na secção Galeria.</p>
                )}
              </section>
            )}

            {screenPanel && screenPanel !== "live" && (
              <label className="glass mt-8 block cursor-pointer rounded-2xl border-2 border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Carregar foto ou vídeo de fundo ({MODES.find((m) => m.id === screenPanel)?.label})
                <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => onScreenMedia(e.target.files)} />
              </label>
            )}
          </div>
        )}

        {section === "gallery" && (
          <div className="max-w-4xl space-y-10">
            <section>
              <h2 className="mb-2 text-xl font-semibold">Galeria — A Jornada</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Aparecem no final do convite (A Jornada), no slideshow do modo Ao vivo (/tela) e quando convidados enviam
                selfie em &quot;Tirar foto&quot;.
              </p>
              <label className="glass mb-4 grid h-40 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground">
                Carregar fotos da jornada
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onGallery(e.target.files)} />
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {(journeyGalleryQuery.data ?? []).map((item) => (
                  <figure key={item.id} className="glass relative overflow-hidden rounded-xl">
                    <img src={mediaUrl(item.url)} alt="" className="aspect-[3/4] w-full object-cover" loading="lazy" />
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-full bg-destructive/90 px-2 py-0.5 text-xs text-destructive-foreground"
                      onClick={async () => {
                        await adminDeleteGalleryItem(item.id);
                        await qc.invalidateQueries({ queryKey: ["gallery"] });
                        await qc.invalidateQueries({ queryKey: ["screen-state"] });
                        setMsg("Foto removida da galeria.");
                      }}
                    >
                      Remover
                    </button>
                  </figure>
                ))}
              </div>
              {!journeyGalleryQuery.data?.length && !journeyGalleryQuery.isLoading && (
                <p className="text-sm text-muted-foreground">Ainda não há fotos. Carregue imagens acima.</p>
              )}
            </section>
            <section>
              <h2 className="mb-2 text-xl font-semibold">Selfies dos convidados</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Cópia de referência (com nome). Cada envio entra automaticamente na galeria acima — já não vai só para a
                tela em brinde.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {(guestPhotosQuery.data ?? []).map((p) => (
                  <figure key={p.id} className="glass overflow-hidden rounded-xl">
                    <img src={mediaUrl(p.url)} alt="" className="aspect-[3/4] w-full object-cover" loading="lazy" />
                    <figcaption className="truncate px-2 py-1.5 text-xs text-primary">{p.guest_name}</figcaption>
                  </figure>
                ))}
              </div>
              {!guestPhotosQuery.data?.length && (
                <p className="text-sm text-muted-foreground">Ainda não há fotos de convidados.</p>
              )}
            </section>
          </div>
        )}

        {section === "messages" && (
          <div className="max-w-2xl">
            <h2 className="mb-6 text-xl font-semibold">Felicitações recebidas</h2>
            <ul className="space-y-3 text-sm">
              {(felicQuery.data ?? []).map((f) => (
                <li key={f.id} className="glass rounded-xl px-4 py-3 text-left">
                  <p className="font-medium text-primary">{f.guest_name}</p>
                  <p className="mt-1 text-muted-foreground">{f.message}</p>
                </li>
              ))}
              {!felicQuery.data?.length && <p className="text-muted-foreground">Ainda sem mensagens.</p>}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
