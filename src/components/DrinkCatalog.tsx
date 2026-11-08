import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Wine, X } from "lucide-react";
import { useState } from "react";
import { fetchDrinksCatalog, fetchGuestByCode, mediaUrl, submitDrinkOrder, type Drink } from "@/lib/api";
import {
  DRINK_CATEGORIES,
  DRINK_CATEGORY_LABEL,
  type DrinkCategory,
} from "@/lib/drink-categories";
import { ThemeToggle } from "@/components/ThemeToggle";

const btn = "bg-gold-gradient w-full rounded-full py-3 font-semibold text-primary-foreground shadow-gold disabled:opacity-50";

function DrinkCard({ drink, onSelect }: { drink: Drink; onSelect: () => void }) {
  const out = drink.quantity <= 0;
  const img = drink.image_url ? mediaUrl(drink.image_url) : null;

  return (
    <button
      type="button"
      disabled={out}
      onClick={onSelect}
      className={`glass overflow-hidden rounded-2xl text-left transition ${
        out ? "opacity-50" : "hover:ring-2 hover:ring-primary/50"
      }`}
    >
      <div className="relative aspect-square w-full bg-secondary/40">
        {img ? (
          <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full w-full place-items-center text-primary/40">
            <Wine className="h-16 w-16" strokeWidth={1.2} />
          </div>
        )}
        {out && (
          <span className="absolute inset-x-0 bottom-0 bg-background/80 py-1 text-center text-xs font-medium">
            Esgotado
          </span>
        )}
      </div>
      <p className="px-3 py-3 text-center text-sm font-semibold leading-tight">{drink.name}</p>
    </button>
  );
}

function CategoryPicker({ onSelect }: { onSelect: (c: DrinkCategory) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {DRINK_CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat)}
          className="glass rounded-2xl border border-primary/20 px-6 py-8 text-center transition hover:border-primary/50 hover:shadow-gold"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">{cat}</p>
          <p className="mt-2 text-xl font-semibold text-foreground">{DRINK_CATEGORY_LABEL[cat]}</p>
        </button>
      ))}
    </div>
  );
}

type DrinkCatalogProps = {
  code: string;
  guestName?: string;
  showBackToInvite?: boolean;
};

export function DrinkCatalog({ code, guestName, showBackToInvite }: DrinkCatalogProps) {
  const qc = useQueryClient();
  const [category, setCategory] = useState<DrinkCategory | null>(null);

  const guestQuery = useQuery({
    queryKey: ["guest", code],
    queryFn: () => fetchGuestByCode(code),
  });

  const drinksQuery = useQuery({
    queryKey: ["drinks-catalog", category],
    queryFn: () => fetchDrinksCatalog(category!),
    enabled: !!category,
    refetchInterval: 8000,
  });

  const [selected, setSelected] = useState<Drink | null>(null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const name = guestName ?? guestQuery.data?.name;
  const drinks = drinksQuery.data ?? [];
  const maxQty = selected ? Math.min(10, selected.quantity) : 1;

  const order = async () => {
    if (!selected || qty < 1) return;
    setBusy(true);
    setErr("");
    try {
      await submitDrinkOrder(code, selected.id, qty);
      setDone(true);
      setSelected(null);
      await qc.invalidateQueries({ queryKey: ["drinks-catalog", category] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao enviar pedido.");
    } finally {
      setBusy(false);
    }
  };

  if (guestQuery.isLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-lg px-4 py-8 text-center">
        <ThemeToggle />
        <p className="text-muted-foreground">A carregar…</p>
      </main>
    );
  }

  if (!guestQuery.data) {
    return (
      <main className="mx-auto min-h-screen max-w-lg px-4 py-8 text-center">
        <ThemeToggle />
        <p className="text-muted-foreground">Convite não encontrado. Verifique o número.</p>
      </main>
    );
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-lg px-4 pb-12 pt-6">
      <ThemeToggle />
      <header className="mb-6 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Evento</p>
        <h1 className="font-script text-gold-gradient mt-1 text-5xl">Catálogo de bebidas</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Olá, <span className="font-semibold text-foreground">{name}</span>.
          {category
            ? ` — ${DRINK_CATEGORY_LABEL[category]}`
            : " Escolha a categoria."}
        </p>
        {showBackToInvite && !category && (
          <a href={`/convite?c=${encodeURIComponent(code)}`} className="mt-2 inline-block text-sm text-primary underline">
            Voltar ao convite
          </a>
        )}
      </header>

      {!category && (
        <>
          <p className="mb-4 text-center text-sm text-muted-foreground">Seleccione uma categoria para ver as bebidas.</p>
          <CategoryPicker onSelect={setCategory} />
        </>
      )}

      {category && (
        <>
          <button
            type="button"
            onClick={() => {
              setCategory(null);
              setSelected(null);
              setDone(false);
            }}
            className="glass mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-primary"
          >
            <ArrowLeft size={16} /> Categorias
          </button>

          {drinksQuery.isLoading && (
            <p className="text-center text-muted-foreground">A carregar bebidas…</p>
          )}

          {done && (
            <p className="glass mb-6 rounded-2xl p-4 text-center text-sm text-primary">
              Pedido enviado! O garçom irá entregar em breve.
            </p>
          )}

          {!drinksQuery.isLoading && !drinks.length && (
            <p className="glass rounded-2xl p-8 text-center text-muted-foreground">
              Ainda não há bebidas nesta categoria.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {drinks.map((d) => (
              <DrinkCard
                key={d.id}
                drink={d}
                onSelect={() => {
                  if (d.quantity <= 0) return;
                  setSelected(d);
                  setQty(1);
                  setErr("");
                  setDone(false);
                }}
              />
            ))}
          </div>
        </>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-labelledby="drink-order-title"
        >
          <div className="relative glass w-full max-w-sm rounded-3xl p-5 text-center">
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:text-foreground"
              onClick={() => setSelected(null)}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
            {selected.image_url ? (
              <img
                src={mediaUrl(selected.image_url)}
                alt=""
                className="mx-auto mb-3 h-32 w-32 rounded-2xl object-cover"
              />
            ) : (
              <div className="mx-auto mb-3 grid h-32 w-32 place-items-center rounded-2xl bg-secondary/50 text-primary/40">
                <Wine size={48} />
              </div>
            )}
            <h2 id="drink-order-title" className="text-lg font-semibold">
              {selected.name}
            </h2>

            <p className="mb-2 mt-6 text-sm font-medium">Quantidade</p>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full border border-input text-lg"
                disabled={qty <= 1}
                onClick={() => setQty((n) => Math.max(1, n - 1))}
              >
                −
              </button>
              <span className="min-w-[2rem] text-xl font-semibold tabular-nums">{qty}</span>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full border border-input text-lg"
                disabled={qty >= maxQty}
                onClick={() => setQty((n) => Math.min(maxQty, n + 1))}
              >
                +
              </button>
            </div>
            {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
            <button type="button" className={`${btn} mt-5`} disabled={busy} onClick={order}>
              {busy ? "A enviar…" : "Confirmar pedido"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
