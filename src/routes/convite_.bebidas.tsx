import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SubPage, validateC } from "@/components/SubPage";
import { fetchDrinksCatalog, fetchGuestByCode, submitDrinkOrder } from "@/lib/api";
import { isValidGuestCode, normalizeGuestCode } from "@/lib/guest-code";

export const Route = createFileRoute("/convite_/bebidas")({
  validateSearch: validateC,
  head: () => ({
    meta: [
      { title: "Bebidas — Graduação" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

const btn = "bg-gold-gradient mt-4 w-full rounded-full py-3 font-semibold text-primary-foreground shadow-gold disabled:opacity-50";

function Page() {
  const { c } = Route.useSearch();
  const code = c && isValidGuestCode(c) ? normalizeGuestCode(c) : undefined;
  const qc = useQueryClient();

  const guestQuery = useQuery({
    queryKey: ["guest", code],
    queryFn: () => fetchGuestByCode(code!),
    enabled: !!code,
  });

  const drinksQuery = useQuery({
    queryKey: ["drinks-catalog"],
    queryFn: fetchDrinksCatalog,
    refetchInterval: 8000,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const drinks = drinksQuery.data ?? [];
  const selected = drinks.find((d) => d.id === selectedId);
  const maxQty = selected ? Math.min(10, selected.quantity) : 1;

  const order = async () => {
    if (!code || !selectedId || qty < 1) return;
    setBusy(true);
    setErr("");
    try {
      await submitDrinkOrder(code, selectedId, qty);
      setDone(true);
      await qc.invalidateQueries({ queryKey: ["drinks-catalog"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao enviar pedido.");
    } finally {
      setBusy(false);
    }
  };

  if (!code) {
    return (
      <SubPage title="Bebidas" c={c}>
        <p className="text-muted-foreground">Abra esta página a partir do seu convite.</p>
      </SubPage>
    );
  }

  if (guestQuery.isLoading || drinksQuery.isLoading) {
    return (
      <SubPage title="Bebidas" c={c}>
        <p className="text-muted-foreground">A carregar…</p>
      </SubPage>
    );
  }

  if (!guestQuery.data) {
    return (
      <SubPage title="Bebidas" c={c}>
        <p className="text-muted-foreground">Convite não encontrado.</p>
      </SubPage>
    );
  }

  if (done) {
    return (
      <SubPage title="Bebidas" c={c}>
        <p className="glass rounded-2xl p-6 text-primary">
          Pedido enviado! O garçom irá entregar em breve.
        </p>
        <button
          type="button"
          className="glass mt-4 rounded-full px-6 py-2 text-sm font-semibold"
          onClick={() => {
            setDone(false);
            setSelectedId(null);
            setQty(1);
          }}
        >
          Fazer outro pedido
        </button>
      </SubPage>
    );
  }

  return (
    <SubPage title="Bebidas" c={c}>
      <p className="mb-6 text-sm text-muted-foreground">
        Olá, <span className="font-semibold text-foreground">{guestQuery.data.name}</span>. Escolha a bebida e a
        quantidade.
      </p>

      {!drinks.length && (
        <p className="glass rounded-2xl p-6 text-muted-foreground">O catálogo será disponibilizado em breve.</p>
      )}

      <ul className="space-y-2 text-left">
        {drinks.map((d) => {
          const out = d.quantity <= 0;
          const active = selectedId === d.id;
          return (
            <li key={d.id}>
              <button
                type="button"
                disabled={out}
                onClick={() => {
                  setSelectedId(d.id);
                  setQty(1);
                }}
                className={`glass w-full rounded-2xl px-4 py-3 text-left transition ${
                  active ? "ring-2 ring-primary" : ""
                } ${out ? "opacity-50" : "hover:ring-1 hover:ring-primary/40"}`}
              >
                <span className="font-semibold">{d.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {out ? "Esgotado" : `Disponível: ${d.quantity}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selected && selected.quantity > 0 && (
        <div className="glass mt-6 space-y-3 rounded-2xl p-5 text-left">
          <p className="text-sm font-medium">Quantidade</p>
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-input text-lg"
              disabled={qty <= 1}
              onClick={() => setQty((n) => Math.max(1, n - 1))}
            >
              −
            </button>
            <span className="min-w-[2rem] text-center text-xl font-semibold tabular-nums">{qty}</span>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-input text-lg"
              disabled={qty >= maxQty}
              onClick={() => setQty((n) => Math.min(maxQty, n + 1))}
            >
              +
            </button>
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button type="button" className={btn} disabled={busy} onClick={order}>
            {busy ? "A enviar…" : "Pedir bebida"}
          </button>
        </div>
      )}
    </SubPage>
  );
}
