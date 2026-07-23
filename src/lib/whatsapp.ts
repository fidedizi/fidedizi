export const WHATSAPP_COUNTRY_CODE = "55";

export function addCountryCode(dddAndNumber: string) {
  return `${WHATSAPP_COUNTRY_CODE}${dddAndNumber}`;
}

export function stripCountryCode(fullNumber: string) {
  return fullNumber.length > 11 && fullNumber.startsWith(WHATSAPP_COUNTRY_CODE)
    ? fullNumber.slice(WHATSAPP_COUNTRY_CODE.length)
    : fullNumber;
}

export function formatWhatsApp(fullNumber: string) {
  const match = fullNumber.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  if (!match) return fullNumber;
  const [, ddd, prefix, suffix] = match;
  // Alguns números ainda estão salvos no formato antigo, sem o "nono dígito"
  // (8 dígitos no total) — normaliza a exibição para sempre ter 9 dígitos.
  const normalizedPrefix = prefix.length === 4 ? `9${prefix}` : prefix;
  return `(${ddd}) ${normalizedPrefix}-${suffix}`;
}
