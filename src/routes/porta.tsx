import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, UserX } from "lucide-react";
import { useState } from "react";
import { registerDoorCheckin, type CheckinResult } from "@/lib/api";
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

function PortaPage() {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);

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
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-md">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.35em] text-primary">Entrada</p>
        <h1 className="font-script text-gold-gradient mb-2 text-center text-5xl">Verificação</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">Introduza o contacto do WhatsApp do convidado.</p>

        <form onSubmit={submit} className="glass space-y-4 rounded-3xl p-6">
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
            className={`mt-6 rounded-3xl p-6 text-center ${
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
            {result.name && (
              <p className="mt-2 text-xl font-medium">{result.name}</p>
            )}
            {result.table && <p className="mt-1 text-sm text-muted-foreground">{result.table}</p>}
            {result.already_checked_in && result.on_list && (
              <p className="mt-2 text-xs text-muted-foreground">(Entrada já registada antes)</p>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Tela de totais: <span className="text-primary">/tela-presenca</span>
        </p>
      </div>
    </main>
  );
}
