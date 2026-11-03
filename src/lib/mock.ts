// Dados estáticos do evento — convidados vêm da API FastAPI.
export const EVENT = {
  graduate: "Dra Kayan",
  date: "28.11.2026",
  dateLong: "Sábado, 28 de Novembro de 2026",
  venue: "Salão Polana, Maputo",
  mapQuery: "Polana Serena Hotel Maputo",
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
