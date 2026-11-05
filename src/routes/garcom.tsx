import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, PackageCheck, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import {
  fetchStaffDrinkOrders,
  updateDrinkOrderStatus,
  type DrinkOrder,
  type DrinkOrderStatus,
} from "@/lib/api";

export const Route = createFileRoute("/garcom")({
  head: () => ({
    meta: [
      { title: "Garçom — Pedidos de bebidas" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GarcomPage,
});

const STATUS_LABEL: Record<DrinkOrderStatus, string> = {
  pending: "Pendente",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const FILTER_TABS: { id: "pending" | "all" | DrinkOrderStatus; label: string }[] = [
  { id: "pending", label: "Pendentes" },
  { id: "delivered", label: "Entregues" },
  { id: "all", label: "Todos" },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: DrinkOrderStatus) {
  const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium";
  if (status === "pending") return `${base} bg-amber-500/20 text-amber-800 dark:text-amber-200`;
  if (status === "delivered") return `${base} bg-emerald-500/20 text-emerald-800 dark:text-emerald-200`;
  return `${base} bg-muted text-muted-foreground`;
}

function GarcomPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "all" | DrinkOrderStatus>("pending");
  const [busyId, setBusyId] = useState<number | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["staff-drink-orders", filter],
    queryFn: () =>
      filter === "all" ? fetchStaffDrinkOrders() : fetchStaffDrinkOrders(filter === "pending" ? "pending" : filter),
    refetchInterval: 3000,
  });

  const orders = ordersQuery.data ?? [];

  const pendingCount = useMemo(() => {
    if (filter === "pending") return orders.length;
    return orders.filter((o) => o.status === "pending").length;
  }, [filter, orders]);

  const setStatus = async (order: DrinkOrder, status: DrinkOrderStatus) => {
    setBusyId(order.id);
    try {
      await updateDrinkOrderStatus(order.id, status);
      await qc.invalidateQueries({ queryKey: ["staff-drink-orders"] });
      await qc.invalidateQueries({ queryKey: ["drinks-catalog"] });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-6 pb-16">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Evento</p>
        <h1 className="text-2xl font-semibold">Pedidos — Garçom</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pendingCount} pendente{pendingCount === 1 ? "" : "s"} nesta vista
        </p>
        <Link to="/porta" className="mt-2 inline-block text-sm text-primary underline">
          Porta / presenças
        </Link>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              filter === tab.id ? "bg-gold-gradient text-primary-foreground" : "glass"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {ordersQuery.isLoading && <p className="text-muted-foreground">A carregar pedidos…</p>}

      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.id} className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-semibold">{o.drink_name}</p>
                <p className="text-sm text-muted-foreground">
                  {o.guest_name} · <span className="tabular-nums font-medium text-foreground">×{o.quantity}</span>
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={12} /> {formatTime(o.created_at)}
                </p>
              </div>
              <span className={statusBadge(o.status)}>{STATUS_LABEL[o.status]}</span>
            </div>

            {o.status === "pending" && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === o.id}
                  onClick={() => setStatus(o, "delivered")}
                  className="bg-gold-gradient inline-flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <PackageCheck size={16} /> Marcar entregue
                </button>
                <button
                  type="button"
                  disabled={busyId === o.id}
                  onClick={() => setStatus(o, "cancelled")}
                  className="glass inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm text-destructive disabled:opacity-50"
                >
                  <XCircle size={16} /> Cancelar
                </button>
              </div>
            )}

            {o.status === "delivered" && o.delivered_at && (
              <p className="mt-2 flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                <Check size={12} /> Entregue às {formatTime(o.delivered_at)}
              </p>
            )}
          </li>
        ))}
      </ul>

      {!ordersQuery.isLoading && !orders.length && (
        <p className="glass rounded-2xl p-8 text-center text-muted-foreground">Nenhum pedido nesta lista.</p>
      )}
    </main>
  );
}
