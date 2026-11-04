// Dados estáticos do evento — convidados vêm da API FastAPI.
export const EVENT = {
  graduate: "Dra Kayan",
  date: "28.11.2026",
  dateLong: "Sábado, 28 de Novembro de 2026",
  venue: "Residencial Bendiak",
  /** Centro do mapa embebido (coordenadas Google Maps). */
  mapQuery: "-13.3069805,35.2446737",
  mapUrl:
    "https://www.google.com/maps/place/Residencial+Bendiak/@-13.3069753,35.2420988,788m/data=!3m2!1e3!4b1!4m6!3m5!1s0x18e0f531713c1b4d:0x9a720ad1671dd802!8m2!3d-13.3069805!4d35.2446737!16s%2Fg%2F11c30sjkdg",
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
    mpesa: "84 000 0000",
    emola: "86 000 0000",
    bank: "0000 0000 0000 0000 0000 0",
  },
  orquidea: {
    displayName: "Orquídea",
    mpesa: "84 000 0001",
    emola: "86 000 0001",
    bank: "0000 0000 0000 0000 0001 0",
  },
};
