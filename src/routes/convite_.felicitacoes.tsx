import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SubPage, validateC } from "@/components/SubPage";
import { sendFelicitation } from "@/lib/api";

export const Route = createFileRoute("/convite_/felicitacoes")({
  validateSearch: validateC,
  head: () => ({
    meta: [
      { title: "Felicitações — Graduação Dra Kayan" },
      { name: "description", content: "Felicitações no convite da Dra Kayan." },
      { property: "og:title", content: "Felicitações — Dra Kayan" },
      { property: "og:description", content: "Felicitações no convite da Dra Kayan." },
    ],
  }),
  component: Page,
});

const btn = "bg-gold-gradient mt-4 w-full rounded-full py-3 font-semibold text-primary-foreground shadow-gold disabled:opacity-50";
const field = "glass w-full rounded-2xl p-4 text-sm outline-none placeholder:text-muted-foreground";

function Page() {
  const { c } = Route.useSearch();
  const code = c && /^\d{6}$/.test(c) ? c : undefined;
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const send = async () => {
    if (!code || !message.trim()) return;
    setBusy(true);
    setErr("");
    try {
      await sendFelicitation(code, message.trim());
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao enviar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SubPage title="Felicitações" c={c}>
      {done ? (
        <p className="glass rounded-2xl p-6 text-primary">A sua mensagem vai aparecer na tela gigante! ✨</p>
      ) : (
        <>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva uma felicitação para a Dra Kayan..."
            className={field + " h-40"}
          />
          {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
          <button className={btn} disabled={busy || !message.trim() || !code} onClick={send}>
            {busy ? "A enviar…" : "Enviar para a tela"}
          </button>
        </>
      )}
    </SubPage>
  );
}
