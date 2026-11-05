import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Wine } from "lucide-react";
import { useState } from "react";
import { DrinkCatalog } from "@/components/DrinkCatalog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { verifyGuestCode } from "@/lib/api";
import { GUEST_CODE_MAX_LEN, isValidGuestCode, normalizeGuestCode } from "@/lib/guest-code";

export const Route = createFileRoute("/catalogo")({
  validateSearch: (s: Record<string, unknown>): { c?: string } => ({
    c: typeof s["c"] === "string" ? s["c"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Catálogo de bebidas — Graduação" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CatalogoPage,
});

function CatalogoPage() {
  const { c } = Route.useSearch();
  const navigate = useNavigate();
  const code = c && isValidGuestCode(c) ? normalizeGuestCode(c) : undefined;

  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (code) {
    return <DrinkCatalog code={code} showBackToInvite />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeGuestCode(phone);
    if (!isValidGuestCode(normalized)) {
      setError("Introduza o número do convite (telemóvel completo).");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const guest = await verifyGuestCode(normalized);
      navigate({ to: "/catalogo", search: { c: guest.code }, replace: true });
    } catch {
      setError("Número não encontrado. Verifique com a organização.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12 text-center">
      <ThemeToggle />
      <div className="glass mx-auto w-full max-w-sm rounded-3xl p-8">
        <div className="bg-gold-gradient mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full text-primary-foreground">
          <Wine size={28} />
        </div>
        <h1 className="font-script text-gold-gradient text-4xl">Catálogo</h1>
        <p className="mt-2 text-sm text-muted-foreground">Introduza o número do seu convite para ver as bebidas.</p>
        <form onSubmit={submit} className="mt-6 space-y-3 text-left">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Número do convite (WhatsApp)</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              maxLength={GUEST_CODE_MAX_LEN + 4}
              placeholder="Ex: 841041035"
              className="w-full rounded-full border border-input bg-transparent px-4 py-3 text-sm"
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-gold-gradient w-full rounded-full py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? "A verificar…" : "Abrir catálogo de bebidas"}
          </button>
        </form>
      </div>
    </main>
  );
}
