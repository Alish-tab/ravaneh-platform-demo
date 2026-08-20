const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Canonical application phone value: Latin digits without visual separators. */
export function normalizePhone(value: string): string {
  return value
    .trim()
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/\D+/g, '');
}

/** Presentation-only formatting; canonical state and clipboard values stay unformatted. */
export function formatPhoneForDisplay(value: string): string {
  const phone = normalizePhone(value);
  const mobile = /^(09\d{2})(\d{3})(\d{4})$/.exec(phone);
  if (mobile) return `${mobile[1]}-${mobile[2]}-${mobile[3]}`;

  const tehranLandline = /^(021)(\d{2})(\d{4})$/.exec(phone);
  if (tehranLandline) return `${tehranLandline[1]}-${tehranLandline[2]}-${tehranLandline[3]}`;

  return phone;
}
