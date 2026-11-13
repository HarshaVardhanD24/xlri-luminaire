/** Roll numbers: B26XXX, H26XXX, B25XXX or H25XXX (three digits). */
export const ROLL_RE = /^[BH](25|26)\d{3}$/;

export function normalizeRoll(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase();
}

/** Names: letters, spaces, dots, apostrophes and hyphens, 2 to 60 characters. */
export const NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,59}$/;
export const normalizeName = (s: string) => s.replace(/\s+/g, ' ').trim();
export const isValidName = (s: string) => NAME_RE.test(normalizeName(s));

export function isValidRoll(input: string): boolean {
  return ROLL_RE.test(normalizeRoll(input));
}
