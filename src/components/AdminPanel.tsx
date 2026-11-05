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
  ClipboardCheck,
  FileDown,
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
  adminDeleteLiveSlide,
  adminUploadGallery,
  adminUploadLiveSlide,
  adminUploadScreenMedia,
  fetchEventInfo,
  fetchGallery,
  fetchProgram,
  fetchScreenState,
  mediaUrl,
  type GuestAdmin,
  type ScreenMode,
} from "@/lib/api";
import { logoutAdmin } from "@/lib/admin-auth";
import { formatEventDate } from "@/lib/event-date";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  downloadGuestsPdf,
  filterGuests,
  GUEST_PDF_EVENT_NAMES,
  RSVP_FILTER_LABEL,
  type GuestRsvpFilter,
} from "@/lib/guest-list-utils";

const MODES: { id: ScreenMode; label: string; icon: typeof Video }[] = [
  { id: "live", label: "Ao vivo", icon: Video },
  { id: "photos", label: "Fotos", icon: Image },
  { id: "dance", label: "Dança", icon: Music },
  { id: "brindes", label: "Brindes", icon: MessageSquare },
];

type Section = "guests" | "presence" | "program" | "screen" | "gallery" | "messages";

const RSVP_LABEL: Record<NonNullable<GuestAdmin["rsvp_status"]>, string> = {
  yes: "Confirmado — vai",
  no: "Não vai",
  pending: "Por confirmar",
};

const NAV: { id: Section; label: string; icon: typeof Users }[] = [
  { id: "guests", label: "Convidados", icon: Users },
  { id: "presence", label: "Presenças", icon: ClipboardCheck },
  { id: "program", label: "Programa", icon: CalendarDays },
  { id: "screen", label: "Tela gigante", icon: MonitorPlay },
  { id: "gallery", label: "Galeria", icon: Upload },
  { id: "messages", label: "Felicitações", icon: MessageSquare },
];

type AdminPanelProps = {
  onLogout: () => void;
};

type GuestStats = { total: number; presentes: number; emFalta: number };

function GuestStatsCards({ total, presentes, emFalta }: GuestStats) {
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-3">
      <div className="glass rounded-2xl p-5 text-center">
        <p className="text-3xl font-semibold tabular-nums text-foreground">{total}</p>
        <p className="mt-1 text-sm text-muted-foreground">Total convidados</p>
      </div>
      <div className="glass rounded-2xl p-5 text-center ring-1 ring-primary/30">
        <p className="text-3xl font-semibold tabular-nums text-primary">{presentes}</p>
        <p className="mt-1 text-sm text-muted-foreground">Presentes (confirmados)</p>
      </div>
      <div className="glass rounded-2xl p-5 text-center">
        <p className="text-3xl font-semibold tabular-nums text-foreground">{emFalta}</p>
        <p className="mt-1 text-sm text-muted-foreground">Em falta</p>
      </div>
    </div>
  );
}

function GuestListToolbar({
  search,
  onSearchChange,
  rsvpFilter,
  onRsvpFilterChange,
  filteredCount,
  totalCount,
  onDownloadPdf,
  pdfBusy,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  rsvpFilter: GuestRsvpFilter;
  onRsvpFilterChange: (v: GuestRsvpFilter) => void;
  filteredCount: number;
  totalCount: number;
  onDownloadPdf: () => void;
  pdfBusy: boolean;
}) {
  return (
    <div className="glass mb-4 space-y-3 rounded-2xl p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="min-w-[200px] flex-1">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Pesquisar</span>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Nome, telemóvel, mesa…"
            className="w-full rounded-full border border-input bg-transparent px-4 py-2 text-sm"
          />
        </label>
        <label className="w-full sm:w-52">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Filtrar presença</span>
          <select
            value={rsvpFilter}
            onChange={(e) => onRsvpFilterChange(e.target.value as GuestRsvpFilter)}
            className="w-full rounded-full border border-input bg-transparent px-4 py-2 text-sm"
          >
            {(Object.keys(RSVP_FILTER_LABEL) as GuestRsvpFilter[]).map((key) => (
              <option key={key} value={key}>
                {RSVP_FILTER_LABEL[key]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={pdfBusy || filteredCount === 0}
          onClick={onDownloadPdf}
          className="bg-gold-gradient inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40 sm:mb-0"
        >
          <FileDown size={16} />
          {pdfBusy ? "A gerar…" : "Baixar PDF"}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        A mostrar {filteredCount} de {totalCount} convidado{totalCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function RsvpBadge({ status }: { status: NonNullable<GuestAdmin["rsvp_status"]> }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
        status === "yes"
          ? "bg-primary/15 text-primary"
          : status === "no"
            ? "bg-destructive/15 text-destructive"
            : "bg-muted text-muted-foreground"
      }`}
    >
      {RSVP_LABEL[status]}
    </span>
  );
}

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
  const [editingGuestId, setEditingGuestId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editTable, setEditTable] = useState("");
  const [savingGuest, setSavingGuest] = useState(false);
  const [guestListSearch, setGuestListSearch] = useState("");
  const [guestListRsvpFilter, setGuestListRsvpFilter] = useState<GuestRsvpFilter>("all");
  const [pdfBusy, setPdfBusy] = useState(false);

  const guestsQuery = useQuery({
    queryKey: ["admin-guests"],
    queryFn: adminListGuests,
    retry: false,
    refetchInterval: section === "presence" ? 10000 : false,
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
    enabled: section === "gallery",
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

  const presenceStats = useMemo(() => {
    const guests = guestsQuery.data ?? [];
    const total = guests.length;
    const presentes = guests.filter((g) => g.rsvp_status === "yes").length;
    const emFalta = total - presentes;
    const naPorta = guests.filter((g) => g.checked_in_at).length;
    return { total, presentes, emFalta, naPorta };
  }, [guestsQuery.data]);

  const allGuests = guestsQuery.data ?? [];

  const filteredGuests = useMemo(
    () => filterGuests(allGuests, guestListSearch, guestListRsvpFilter),
    [allGuests, guestListSearch, guestListRsvpFilter],
  );

  const exportGuestsPdf = async (title: string) => {
    if (!filteredGuests.length) return;
    setPdfBusy(true);
    setErr("");
    try {
      await downloadGuestsPdf(filteredGuests, {
        title,
        search: guestListSearch,
        rsvpFilter: guestListRsvpFilter,
      });
      setMsg("PDF descarregado.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao gerar PDF");
    } finally {
      setPdfBusy(false);
    }
  };

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

  const startEditGuest = (g: GuestAdmin) => {
    setEditingGuestId(g.id);
    setEditName(g.name);
    setEditContact(g.contact);
    setEditTable(g.table ?? "");
    setErr("");
    setMsg("");
  };

  const cancelEditGuest = () => {
    setEditingGuestId(null);
    setEditName("");
    setEditContact("");
    setEditTable("");
  };

  const saveEditGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGuestId == null) return;
    setSavingGuest(true);
    setErr("");
    setMsg("");
    try {
      await adminUpdateGuest(editingGuestId, {
        name: editName.trim(),
        contact: editContact.trim(),
        table: editTable.trim() || null,
      });
      setMsg("Convidado actualizado.");
      cancelEditGuest();
      qc.invalidateQueries({ queryKey: ["admin-guests"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao guardar");
    } finally {
      setSavingGuest(false);
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
      setMsg(`Convidado criado. Entra no convite com o telemóvel ${g.code}.`);
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
      setMsg("Fotos carregadas — aparecem no convite (A Jornada).");
      await qc.invalidateQueries({ queryKey: ["gallery"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro no upload");
    }
  };

  const onLiveSlides = async (files: FileList | null) => {
    if (!files?.length) return;
    setErr("");
    try {
      for (const f of Array.from(files)) await adminUploadLiveSlide(f);
      setMsg("Fotos ao vivo carregadas — slideshow em /tela (modo Ao vivo).");
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

        {section === "presence" && (
          <div className="max-w-3xl">
            <h2 className="mb-2 text-xl font-semibold">Presenças</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Respostas da página «Confirmar presença» no convite. «Presentes» = confirmaram que vão; «Em falta» inclui quem
              ainda não respondeu e quem disse que não pode.
            </p>
            <GuestStatsCards {...presenceStats} />
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Na porta (check-in):{" "}
              <span className="font-semibold text-primary">{presenceStats.naPorta}</span> de {presenceStats.total}
            </p>
            <p className="mb-3 text-sm font-medium">Lista de convidados</p>
            <GuestListToolbar
              search={guestListSearch}
              onSearchChange={setGuestListSearch}
              rsvpFilter={guestListRsvpFilter}
              onRsvpFilterChange={setGuestListRsvpFilter}
              filteredCount={filteredGuests.length}
              totalCount={allGuests.length}
              pdfBusy={pdfBusy}
              onDownloadPdf={() => exportGuestsPdf(`Lista de presenças — ${GUEST_PDF_EVENT_NAMES}`)}
            />
            <div className="glass overflow-hidden rounded-2xl">
              <div className="hidden border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_1fr_1fr_auto] sm:gap-2">
                <span>Nome</span>
                <span>Mesa</span>
                <span>Telemóvel</span>
                <span className="text-right">Presença</span>
              </div>
              <ul className="max-h-[55vh] divide-y divide-border overflow-y-auto text-sm">
                {filteredGuests.map((g) => {
                  const status = g.rsvp_status ?? "pending";
                  return (
                    <li
                      key={g.id}
                      className="flex flex-col gap-2 px-4 py-3 sm:grid sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center sm:gap-2"
                    >
                      <p className="font-medium">{g.name}</p>
                      <p className="text-muted-foreground sm:text-foreground">{g.table ?? "—"}</p>
                      <p className="font-mono text-xs tracking-wide text-primary sm:text-sm">{g.code}</p>
                      <div className="flex flex-col items-end gap-1 sm:text-right">
                        <RsvpBadge status={status} />
                        {g.checked_in_at && (
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                            Na porta
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {!allGuests.length && !guestsQuery.isLoading && (
                <p className="px-4 py-6 text-muted-foreground">Ainda não há convidados registados.</p>
              )}
              {allGuests.length > 0 && !filteredGuests.length && (
                <p className="px-4 py-6 text-muted-foreground">Nenhum convidado corresponde ao filtro.</p>
              )}
            </div>
          </div>
        )}

        {section === "guests" && (
          <div className="max-w-2xl">
            <h2 className="mb-2 text-xl font-semibold">Convidados & mesas</h2>
            <p className="mb-6 text-sm text-muted-foreground">Gerir convidados, mesas e contactos de acesso ao convite.</p>
            <GuestStatsCards {...presenceStats} />
            <p className="mb-3 text-sm font-medium">Lista de convidados</p>
            <GuestListToolbar
              search={guestListSearch}
              onSearchChange={setGuestListSearch}
              rsvpFilter={guestListRsvpFilter}
              onRsvpFilterChange={setGuestListRsvpFilter}
              filteredCount={filteredGuests.length}
              totalCount={allGuests.length}
              pdfBusy={pdfBusy}
              onDownloadPdf={() => exportGuestsPdf(`Lista de convidados — ${GUEST_PDF_EVENT_NAMES}`)}
            />
            <ul className="mb-6 max-h-[50vh] space-y-2 overflow-y-auto text-sm">
              {filteredGuests.map((g) =>
                editingGuestId === g.id ? (
                  <li key={g.id} className="glass rounded-xl p-4">
                    <form onSubmit={saveEditGuest} className="space-y-3">
                      <p className="text-sm font-medium">Editar convidado</p>
                      <input
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nome"
                        className="w-full rounded-full border border-input bg-transparent px-4 py-2 text-sm"
                      />
                      <input
                        required
                        value={editContact}
                        onChange={(e) => setEditContact(e.target.value)}
                        placeholder="Telemóvel"
                        inputMode="tel"
                        className="w-full rounded-full border border-input bg-transparent px-4 py-2 text-sm"
                      />
                      <input
                        value={editTable}
                        onChange={(e) => setEditTable(e.target.value)}
                        placeholder="Mesa (opcional)"
                        className="w-full rounded-full border border-input bg-transparent px-4 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={savingGuest}
                          className="bg-gold-gradient flex-1 rounded-full py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                        >
                          {savingGuest ? "A guardar…" : "Guardar"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditGuest}
                          className="glass flex-1 rounded-full py-2 text-sm font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </li>
                ) : (
                  <li key={g.id} className="glass rounded-xl px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{g.name}</p>
                        <p className="font-mono text-sm tracking-wide text-primary">Acesso: {g.code}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Contacto: {g.contact}
                          {g.table ? ` · ${g.table}` : ""}
                        </p>
                        <div className="mt-2">
                          <RsvpBadge status={g.rsvp_status ?? "pending"} />
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <button type="button" className="text-xs text-primary" onClick={() => startEditGuest(g)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="text-xs text-destructive"
                          onClick={async () => {
                            if (editingGuestId === g.id) cancelEditGuest();
                            await adminDeleteGuest(g.id);
                            qc.invalidateQueries({ queryKey: ["admin-guests"] });
                          }}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </li>
                ),
              )}
              {!allGuests.length && !guestsQuery.isLoading && (
                <p className="text-muted-foreground">Ainda não há convidados.</p>
              )}
              {allGuests.length > 0 && !filteredGuests.length && (
                <p className="text-muted-foreground">Nenhum convidado corresponde ao filtro.</p>
              )}
            </ul>
            <form onSubmit={addGuest} className="glass space-y-3 rounded-2xl p-5">
              <p className="text-sm font-medium">Novo convidado</p>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="w-full rounded-full border border-input bg-transparent px-4 py-2 text-sm" />
              <input
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Telemóvel (ex: 841041035) — será o acesso"
                inputMode="tel"
                className="w-full rounded-full border border-input bg-transparent px-4 py-2 text-sm"
              />
              <input value={table} onChange={(e) => setTable(e.target.value)} placeholder="Mesa (opcional)" className="w-full rounded-full border border-input bg-transparent px-4 py-2 text-sm" />
              <button type="submit" className="bg-gold-gradient w-full rounded-full py-2.5 text-sm font-semibold text-primary-foreground">
                Adicionar convidado
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
            <p className="mb-2 text-sm text-muted-foreground">Abra /tela no projetor. Brindes chegam por WebSocket em tempo real.</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Entrada na porta: <span className="text-primary">/porta</span> · Tela de presenças:{" "}
              <span className="text-primary">/tela-presenca</span>
            </p>
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
                <h3 className="mb-1 text-lg font-semibold">Galeria ao vivo (/tela)</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Só estas fotos rodam no fundo quando o modo <strong>Ao vivo</strong> está activo. Independentes da galeria
                  principal (A Jornada) no menu Galeria.
                </p>
                <label className="glass mb-4 grid h-36 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground">
                  Carregar fotos para o slideshow ao vivo
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onLiveSlides(e.target.files)} />
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {(screenStateQuery.data?.live_slides ?? []).map((item) => (
                    <figure key={item.id} className="glass relative overflow-hidden rounded-xl">
                      <img src={mediaUrl(item.url)} alt="" className="aspect-[3/4] w-full object-cover" loading="lazy" />
                      <button
                        type="button"
                        className="absolute right-2 top-2 rounded-full bg-destructive/90 px-2 py-0.5 text-xs text-destructive-foreground"
                        onClick={async () => {
                          await adminDeleteLiveSlide(item.id);
                          await qc.invalidateQueries({ queryKey: ["screen-state"] });
                          setMsg("Foto removida do ao vivo.");
                        }}
                      >
                        Remover
                      </button>
                    </figure>
                  ))}
                </div>
                {!screenStateQuery.data?.live_slides?.length && !screenStateQuery.isLoading && (
                  <p className="text-sm text-muted-foreground">Sem fotos ao vivo — carregue imagens acima.</p>
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
                Aparecem no convite digital (secção A Jornada). Selfies de convidados{" "}
                <strong>não</strong> entram aqui — vão só para a /tela (brinde) e para a lista abaixo.
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
                Referência para o organizador (comprimidas para a tela). Não aparecem em A Jornada no convite.
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
