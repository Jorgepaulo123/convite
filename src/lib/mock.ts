// Dados estáticos do evento — convidados vêm da API FastAPI.
export const EVENT = {
  graduate: "Dra Kayan",
  date: "28.11.2026",
  dateLong: "Sábado, 28 de Novembro de 2026",
  venue: "Bendiak Village",
  mapQuery: "-13.3427738,35.2871901",
  mapUrl: "https://www.google.com/maps/search/Bendiak+Village/@-13.3427738,35.2871901,17z",
  agenda: [
    { title: "Cerimónia", time: "16H00" },
    { title: "Cocktail", time: "18H00" },
    { title: "Jantar & Dança", time: "19H30" },
  ],
};

export type GiftRecipientId = "kayan" | "orquidea";

export const GIFT_RECIPIENTS: Record<
  GiftRecipientId,
  { displayName: string; mpesa: string; emola: string; bank: string }
> = {
  kayan: {
    displayName: "Kayan",
    mpesa: "84 933 4480",
    emola: "87 933 4480",
    bank: "0008 0000 8983 3932 1018 0 — BCI",
  },
  orquidea: {
    displayName: "Orquídea",
    mpesa: "84 000 0001",
    emola: "86 000 0001",
    bank: "0000 0000 0000 0000 0001 0",
  },
};
