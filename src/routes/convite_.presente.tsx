import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { SubPage, validateC } from "@/components/SubPage";
import { ackPresent } from "@/lib/api";
import { isValidGuestCode, normalizeGuestCode } from "@/lib/guest-code";
import { GIFT_RECIPIENTS, type GiftRecipientId } from "@/lib/mock";

export const Route = createFileRoute("/convite_/presente")({
  validateSearch: validateC,
  head: () => ({
    meta: [
      { title: "Presente — Graduação Dra Kayan" },
      { name: "description", content: "Presente no convite da Dra Kayan." },
      { property: "og:title", content: "Presente — Dra Kayan" },
      { property: "og:description", content: "Presente no convite da Dra Kayan." },
    ],
  }),
  component: Page,
});

const btn = "bg-gold-gradient mt-4 w-full rounded-full py-3 font-semibold text-primary-foreground shadow-gold disabled:opacity-50";
const pickBtn =
  "glass flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl px-4 py-8 transition hover:shadow-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function PaymentDetails({ recipientId }: { recipientId: GiftRecipientId }) {
  const r = GIFT_RECIPIENTS[recipientId];
  return (
    <div className="glass space-y-3 rounded-2xl p-5 text-left text-sm">
      <p className="text-center font-script text-3xl text-primary">{r.displayName}</p>
      <p>
        <span className="font-semibold text-primary">M-Pesa:</span> {r.mpesa}
      </p>
      {r.emola ? (
        <p>
          <span className="font-semibold text-primary">e-Mola:</span> {r.emola}
        </p>
      ) : null}
      <p>
        <span className="font-semibold text-primary">Banco (NIB):</span> {r.bank}
      </p>
    </div>
  );
}

function Page() {
  const { c } = Route.useSearch();
  const code = c && isValidGuestCode(c) ? normalizeGuestCode(c) : undefined;
  const [recipient, setRecipient] = useState<GiftRecipientId | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!code) return;
    setBusy(true);
    try {
      await ackPresent(code);
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SubPage title="Presente" c={c}>
      {done ? (
        <p className="glass rounded-2xl p-6 text-primary">Muito obrigada pelo carinho! 💛</p>
      ) : recipient === null ? (
        <>
          <p className="mb-6 text-sm text-muted-foreground">
            A sua presença é o maior presente. Se desejar contribuir, escolha para quem:
          </p>
          <div className="flex gap-3">
            {(Object.keys(GIFT_RECIPIENTS) as GiftRecipientId[]).map((id) => (
              <button key={id} type="button" className={pickBtn} onClick={() => setRecipient(id)}>
                <span className="font-script text-gold-gradient text-4xl">{GIFT_RECIPIENTS[id].displayName}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setRecipient(null)}
          >
            <ChevronLeft size={16} />
            Escolher outra pessoa
          </button>
          <PaymentDetails recipientId={recipient} />
          <button className={btn} disabled={busy || !code} onClick={confirm}>
            Já enviei o meu presente
          </button>
        </>
      )}
    </SubPage>
  );
}
