import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Camera } from "lucide-react";
import { SubPage, validateC } from "@/components/SubPage";
import { uploadGuestPhoto } from "@/lib/api";
import { isValidGuestCode, normalizeGuestCode } from "@/lib/guest-code";

export const Route = createFileRoute("/convite_/foto")({
  validateSearch: validateC,
  head: () => ({
    meta: [
      { title: "Tirar foto — Graduação Dra Kayan" },
      { name: "description", content: "Tire uma selfie para a galeria do convite." },
      { property: "og:title", content: "Tirar foto — Dra Kayan" },
      { property: "og:description", content: "Partilhe um momento na galeria A Jornada." },
    ],
  }),
  component: Page,
});

function Page() {
  const { c } = Route.useSearch();
  const code = c && isValidGuestCode(c) ? normalizeGuestCode(c) : undefined;
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const qc = useQueryClient();

  const send = async () => {
    if (!code || !file) return;
    setBusy(true);
    setErr("");
    try {
      await uploadGuestPhoto(code, file);
      await qc.invalidateQueries({ queryKey: ["gallery"] });
      setSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao enviar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SubPage title="Foto" c={c}>
      {sent ? (
        <p className="glass rounded-2xl p-6 text-primary">Selfie adicionada à galeria A Jornada! 📸</p>
      ) : (
        <>
          <label className="glass grid aspect-[3/4] w-full cursor-pointer place-items-center overflow-hidden rounded-3xl">
            {preview ? (
              <img src={preview} alt="Pré-visualização" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-3 text-primary">
                <Camera size={48} />
                Toque para abrir a câmara
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  setPreview(URL.createObjectURL(f));
                }
              }}
            />
          </label>
          {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
          <button disabled={!file || busy || !code} onClick={send} className="bg-gold-gradient mt-4 w-full rounded-full py-3 font-semibold text-primary-foreground shadow-gold disabled:opacity-50">
            {busy ? "A enviar…" : "Enviar para a galeria"}
          </button>
        </>
      )}
    </SubPage>
  );
}
