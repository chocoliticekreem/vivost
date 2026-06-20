import { z } from "zod";
import type { UUID } from "../core";

/**
 * ClientScreening is the verification status advertisers see before accepting a
 * booking. References is a count of how many references the client has supplied.
 * Keyed by clientId (1:1 with a client). No personal data here — clientId is an
 * opaque UUID reference into the clients domain.
 */
export interface ClientScreening {
  clientId: UUID;
  verified: boolean;
  references: number;
  verifiedAt: Date | null;
  updatedAt: Date;
}

/**
 * Reported-offender record for the reverse-checker. GDPR minimisation: only
 * HASHES of contact details are stored, never raw phone/email. At least one of
 * phoneHash/emailHash is present.
 */
export interface OffenderReport {
  id: UUID;
  phoneHash?: string | null;
  emailHash?: string | null;
  reason: string;
  reportedByAccountId: UUID;
  createdAt: Date;
}

export const reportOffenderSchema = z
  .object({
    phone: z.string().min(1).nullable().default(null),
    email: z.string().min(1).nullable().default(null),
    reason: z.string().min(1),
    reportedByAccountId: z.string().uuid(),
  });

export type ReportOffenderInput = z.input<typeof reportOffenderSchema>;

export const checkOffenderSchema = z.object({
  phone: z.string().min(1).nullable().default(null),
  email: z.string().min(1).nullable().default(null),
});

export type CheckOffenderInput = z.input<typeof checkOffenderSchema>;

export interface CheckResult {
  matches: number;
  reasons: string[];
}
