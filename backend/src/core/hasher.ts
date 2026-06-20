import { createHash } from "node:crypto";

export interface Hasher {
  hash(value: string): string;
}

export const sha256Hasher: Hasher = {
  hash(value: string): string {
    return createHash("sha256").update(value, "utf8").digest("hex");
  },
};

/**
 * Normalise a phone number before hashing/storing.
 * Strips spaces, dashes, parentheses and a leading "+"; keeps digits.
 * Never store the raw phone number for the offender checker — hash the result.
 */
export function normalisePhone(s: string): string {
  return s
    .trim()
    .replace(/^\+/, "")
    .replace(/[\s\-()]/g, "");
}

/**
 * Normalise an email before hashing/storing: lowercase and trim.
 * Never store the raw email for the offender checker — hash the result.
 */
export function normaliseEmail(s: string): string {
  return s.trim().toLowerCase();
}
