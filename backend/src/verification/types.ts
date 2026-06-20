import type { UUID } from "../core";

export type VerificationSubjectType = "account" | "listing";

export type VerificationMethod =
  | "photo_id"
  | "facial_age_estimation"
  | "open_banking"
  | "credit_card"
  | "mno";

export type VerificationStatus = "pass" | "fail" | "pending";

export type VerificationBadge = "id_verified" | null;

/**
 * Stores verification RESULTS only — a status, the method used, the provider's
 * opaque checkId, and dates. NEVER any ID images or selfies (GDPR Art 9
 * minimisation). The IdVerificationProvider port returns results only.
 */
export interface VerificationRecord {
  id: UUID;
  subjectId: UUID;
  subjectType: VerificationSubjectType;
  method: VerificationMethod;
  checkId: string;
  status: VerificationStatus;
  checkedAt: Date | null;
  createdAt: Date;
}
