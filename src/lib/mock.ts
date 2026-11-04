// Dados estáticos do evento — convidados vêm da API FastAPI.
export const EVENT = {
  graduate: "Dra Kayan",
  date: "28.11.2026",
  dateLong: "Sábado, 28 de Novembro de 2026",
  venue: "Alojamento Bendiak — Bendiak Village",
  mapQuery: "-13.3427738,35.2871901",
  mapUrl:
    "https://www.google.com/maps/place/Alojamento+Bendiak/@-13.3248346,35.2453322,6306m/data=!3m1!1e3!4m10!1m2!2m1!1sBendiak!3m6!1s0x18e08beaf08b0ad5:0x53f3dc3b72bf7790!8m2!3d-13.3427738!4d35.2871901!16s%2Fg%2F11sg_06y_l",
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
