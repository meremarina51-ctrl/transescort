import { randomInt } from 'crypto';

/** Excludes visually ambiguous characters (0/O, 1/I/L). */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const GROUPS = 4;
const GROUP_LENGTH = 4;

/** Generates a human-typeable backup code, e.g. "A7K9-XQ2R-BC3D-FG4H". */
export function generateRecoveryCode(): string {
  const groups = Array.from({ length: GROUPS }, () =>
    Array.from({ length: GROUP_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join(''),
  );
  return groups.join('-');
}

/** Normalizes user-entered codes (case/whitespace) before hashing or comparing. */
export function normalizeRecoveryCode(code: string): string {
  return code.trim().toUpperCase();
}
