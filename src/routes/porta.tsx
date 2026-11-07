import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, UserX } from "lucide-react";
import { useMemo, useState } from "react";
import { fetchCheckinRoster, registerDoorCheckin, unregisterDoorCheckin, type CheckinResult } from "@/lib/api";
import { GUEST_CODE_MAX_LEN, isValidGuestCode, normalizeGuestCode } from "@/lib/guest-code";

export const Route = createFileRoute("/porta")({
  head: () => ({
    meta: [
      { title: "Verificação na porta — Graduação" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortaPage,
});

function formatEntry(iso: string) {
  return new Date(iso).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PortaPage() {
  const qc = useQueryClient();
  const [phone, setPhone] = useState("");
  const [listSearch, setListSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [markingCode, setMarkingCode] = useState<string | null>(null);
  const [removingCode, setRemovingCode] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResult | null>(null);

  const refreshLists = async () => {
    await qc.invalidateQueries({ queryKey: ["checkin-roster"] });
    await qc.invalidateQueries({ queryKey: ["attendance-stats"] });
  };

  const markEntry = async (code: string) => {
    setMarkingCode(code);
    setResult(null);
    try {
      const res = await registerDoorCheckin(code);
      setResult(res);
      await refreshLists();
    } catch (e) {
      setResult({
        ok: false,
        on_list: false,
        message: e instanceof Error ? e.message : "Erro ao marcar entrada.",
      });
    } finally {
      setMarkingCode(null);
    }
  };

  const removeEntry = async (code: string) => {
    setRemovingCode(code);
    setResult(null);
    try {
      const res = await unregisterDoorCheckin(code);
      setResult(res);
      await refreshLists();
    } catch (e) {
      setResult({
        ok: false,
        on_list: false,
        message: e instanceof Error ? e.message : "Erro ao remover entrada.",
      });
    } finally {
      setRemovingCode(null);
    }
  };

  const rosterQuery = useQuery({
    queryKey: ["checkin-roster"],
    queryFn: fetchCheckinRoster,
    refetchInterval: 5000,
  });

  const q = listSearch.trim().toLowerCase();
  const allGuests = rosterQuery.data?.guests ?? [];
  const filteredAll = useMemo(() => {
    if (!q) return allGuests;
    return allGuests.filter((g) =>
      [g.name, g.code, g.table ?? ""].join(" ").toLowerCase().includes(q),
    );
  }, [allGuests, q]);

  const filteredEntered = useMemo(() => {
    const entered = allGuests.filter((g) => g.checked_in_at);
    const list = q
      ? entered.filter((g) => [g.name, g.code, g.table ?? ""].join(" ").toLowerCase().includes(q))
      : entered;
    return [...list].sort(
      (a, b) => new Date(b.checked_in_at!).getTime() - new Date(a.checked_in_at!).getTime(),
    );
  }, [allGuests, q]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeGuestCode(phone);
    if (!isValidGuestCode(normalized)) {
      setResult({
        ok: false,
        on_list: false,
        message: "Introduza o contacto do WhatsApp completo (mín. 8 dígitos).",
      });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res = await registerDoorCheckin(normalized);
      setResult(res);
      if (res.ok) setPhone("");
      await refreshLists();
    } catch (e) {
      setResult({
        ok: false,
        on_list: false,
        message: e instanceof Error ? e.message : "Erro de ligação à API.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.35em] text-primary">Entrada</p>
        <h1 className="font-script text-gold-gradient mb-2 text-center text-5xl">Verificação</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">Introduza o contacto do WhatsApp do convidado.</p>

        <form onSubmit={submit} className="glass mx-auto mb-6 max-w-md space-y-4 rounded-3xl p-6">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            maxLength={GUEST_CODE_MAX_LEN + 4}
            placeholder="Ex: 84 933 4480"
            className="w-full rounded-2xl border border-input bg-transparent px-4 py-4 text-center text-xl font-mono tracking-wide"
          />
          <button
            type="submit"
            disabled={busy}
            className="bg-gold-gradient w-full rounded-full py-4 text-base font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "A verificar…" : "Verificar e registar presença"}
          </button>
        </form>

        {result && (
          <div
            className={`mx-auto mb-8 max-w-md rounded-3xl p-6 text-center ${
              result.on_list ? "glass ring-2 ring-primary/40" : "bg-destructive/10 ring-2 ring-destructive/30"
            }`}
          >
            {result.on_list ? (
              <CheckCircle2 className="mx-auto mb-3 text-primary" size={48} />
            ) : (
              <UserX className="mx-auto mb-3 text-destructive" size={48} />
            )}
            <p className={`text-lg font-semibold ${result.on_list ? "text-primary" : "text-destructive"}`}>
              {result.message}
            </p>
            {result.on_list && result.name && (
              <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-left text-sm">
                <div className="flex justify-between gap-3 border-b border-white/10 pb-2">
                  <span className="text-muted-foreground">Nome</span>
                  <span className="text-right font-semibold text-foreground">{result.name}</span>
                </div>
                <div className="flex justify-between gap-3 border-b border-white/10 pb-2">
                  <span className="text-muted-foreground">Mesa</span>
                  <span className="text-right font-semibold text-primary">{result.table ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-3 pt-1">
                  <span className="text-muted-foreground">Total de pessoas</span>
                  <span className="text-right text-lg font-bold tabular-nums text-primary">
                    {result.party_size ?? 1}
                  </span>
                </div>
              </div>
            )}
            {result.already_checked_in && result.on_list && (
              <p className="mt-2 text-xs text-muted-foreground">(Entrada já registada antes)</p>
            )}
          </div>
        )}

        <div className="glass mb-4 rounded-2xl p-4">
          <input
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
            placeholder="Pesquisar nas listas (nome, telemóvel, mesa)…"
            className="w-full rounded-full border border-input bg-transparent px-4 py-2 text-sm"
          />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Entraram:{" "}
            <span className="font-semibold text-primary">{rosterQuery.data?.checked_in ?? "—"}</span> /{" "}
            {rosterQuery.data?.total_guests ?? "—"} convidados
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold">
              Lista de convidados <span className="text-muted-foreground">({filteredAll.length})</span>
            </h2>
            <PortaGuestList
              guests={filteredAll}
              emptyMessage={
                rosterQuery.isLoading
                  ? "A carregar…"
                  : allGuests.length && !filteredAll.length
                    ? "Nenhum resultado na pesquisa."
                    : "Sem convidados na lista."
              }
              showEntry={false}
              showMarkButton
              markingCode={markingCode}
              onMarkEntry={markEntry}
            />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold">
              Convidados que entraram{" "}
              <span className="text-muted-foreground">({filteredEntered.length})</span>
            </h2>
            <PortaGuestList
              guests={filteredEntered}
              emptyMessage={
                rosterQuery.isLoading
                  ? "A carregar…"
                  : filteredEntered.length === 0
                    ? "Ainda ninguém entrou."
                    : "Nenhum resultado na pesquisa."
              }
              showEntry
              showRemoveButton
              removingCode={removingCode}
              markingCode={markingCode}
              onRemoveEntry={removeEntry}
            />
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Tela de totais: <span className="text-primary">/presencas</span>
        </p>
      </div>
    </main>
  );
}

function PortaGuestList({
  guests,
  emptyMessage,
  showEntry,
  showMarkButton,
  showRemoveButton,
  markingCode,
  removingCode,
  onMarkEntry,
  onRemoveEntry,
}: {
  guests: { name: string; table?: string | null; code: string; checked_in_at?: string | null }[];
  emptyMessage: string;
  showEntry: boolean;
  showMarkButton?: boolean;
  showRemoveButton?: boolean;
  markingCode?: string | null;
  removingCode?: string | null;
  onMarkEntry?: (code: string) => void;
  onRemoveEntry?: (code: string) => void;
}) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <ul className="max-h-[50vh] divide-y divide-border overflow-y-auto text-sm lg:max-h-[55vh]">
        {guests.map((g) => {
          const entered = !!g.checked_in_at;
          const marking = markingCode === g.code;
          const removing = removingCode === g.code;
          const actionBusy = !!markingCode || !!removingCode;
          return (
            <li
              key={`${g.code}-${g.checked_in_at ?? "pending"}`}
              className="flex items-start justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">
                  {g.name}
                  {g.table && (
                    <span className="ml-1.5 font-semibold text-primary">· Mesa {g.table}</span>
                  )}
                </p>
                <p className="font-mono text-xs text-primary">{g.code}</p>
                {showEntry && g.checked_in_at && (
                  <p className="mt-1 text-xs text-gold-soft">Entrada: {formatEntry(g.checked_in_at)}</p>
                )}
                {showMarkButton && entered && (
                  <p className="mt-1 text-xs text-primary">Já entrou</p>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                {showMarkButton && !entered && onMarkEntry && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => onMarkEntry(g.code)}
                    className="bg-gold-gradient rounded-full px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {marking ? "…" : "Marcar entrada"}
                  </button>
                )}
                {showRemoveButton && entered && onRemoveEntry && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => onRemoveEntry(g.code)}
                    className="rounded-full border border-destructive/50 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  >
                    {removing ? "…" : "Remover entrada"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {!guests.length && <p className="px-4 py-6 text-center text-muted-foreground">{emptyMessage}</p>}
    </div>
  );
}
