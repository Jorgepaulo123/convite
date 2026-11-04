/** URL pública do site (Vercel). Defina VITE_SITE_URL se usar outro domínio. */
const DEFAULT_SITE_URL = "https://convite-zeta-liart.vercel.app";

export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") || DEFAULT_SITE_URL;

export const OG_IMAGE_PATH = "/og-convite.jpeg";

export const OG_IMAGE_URL = `${SITE_URL}${OG_IMAGE_PATH}`;

export const INVITE_OG_TITLE = "CONVITE — Kayan & Orquídea";

export const INVITE_OG_DESCRIPTION =
  "Têm a honra de convidá-lo(a) a celebrar a conclusão dos graus de Mestrado e Licenciatura. A vossa presença será uma honra para nós!";

/** Texto completo na página do convidado */
export const INVITE_BODY = {
  label: "Convite",
  names: "Kayan & Orquídea",
  paragraphs: [
    "Têm a honra e o prazer de convidá-lo(a) para celebrar connosco uma conquista muito especial: a conclusão dos graus de Mestrado e Licenciatura.",
    "Venha partilhar a nossa alegria e ajudar-nos a eternizar este momento único e inesquecível!",
  ],
  closing: "A VOSSA PRESENÇA SERÁ UMA HONRA PARA NÓS!",
} as const;

export function shareMetaTags(options?: { title?: string; description?: string }) {
  const title = options?.title ?? INVITE_OG_TITLE;
  const description = options?.description ?? INVITE_OG_DESCRIPTION;
  return [
    { title },
    { name: "description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: OG_IMAGE_URL },
    { property: "og:url", content: SITE_URL },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: OG_IMAGE_URL },
  ];
}
