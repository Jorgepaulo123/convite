import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SubPage, validateC } from "@/components/SubPage";
import { fetchGuestByCode, submitRsvp } from "@/lib/api";
import { isValidGuestCode, normalizeGuestCode } from "@/lib/guest-code";

export const Route = createFileRoute("/convite_/presenca")({
  validateSearch: validateC,
  head: () => ({
    meta: [
      { title: "Presença — Graduação Dra Kayan" },
      { name: "description", content: "Presença no convite da Dra Kayan." },
      { property: "og:title", content: "Presença — Dra Kayan" },
      { property: "og:description", content: "Presença no convite da Dra Kayan." },
    ],
  }),
  component: Page,
});

const btn = "bg-gold-gradient mt-4 w-full rounded-full py-3 font-semibold text-primary-foreground shadow-gold disabled:opacity-50";

function Page() {
  const { c } = Route.useSearch();
  const code = c && isValidGuestCode(c) ? normalizeGuestCode(c) : undefined;
  const guestQuery = useQuery({
    queryKey: ["guest", code],
    queryFn: () => fetchGuestByCode(code!),
    enabled: !!code,
  });
  const guest = guestQuery.data;
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const respond = async (status: "yes" | "no") => {
    if (!code) return;
    setBusy(true);
    setErr("");
    try {
      await submitRsvp(code, status);
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao registar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SubPage title="Presença" c={c}>
      {done ? (
        <p className="glass rounded-2xl p-6 text-primary">Obrigado! A sua resposta foi registada.</p>
      ) : (
        <>
          <p className="mb-6">{guest?.name ?? "Convidado"}, vai estar connosco?</p>
          {err && <p className="mb-3 text-sm text-destructive">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button className={btn} disabled={busy || !code} onClick={() => respond("yes")}>
              Sim, vou
            </button>
            <button className="glass mt-4 rounded-full py-3 font-semibold disabled:opacity-50" disabled={busy || !code} onClick={() => respond("no")}>
              Não poderei
            </button>
          </div>
        </>
      )}
    </SubPage>
  );
}
