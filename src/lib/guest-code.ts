/** Código de convite = número de telemóvel (só dígitos). */
export const GUEST_CODE_MIN_LEN = 8;
export const GUEST_CODE_MAX_LEN = 15;

export function normalizeGuestCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, GUEST_CODE_MAX_LEN);
}

export function isValidGuestCode(code: string): boolean {
  const digits = normalizeGuestCode(code);
  return digits.length >= GUEST_CODE_MIN_LEN && digits.length <= GUEST_CODE_MAX_LEN;
}
