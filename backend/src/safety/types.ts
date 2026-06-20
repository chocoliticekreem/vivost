import { z } from "zod";
import type { UUID } from "../core";

// =============================================================================
// Bad-date reports (provider-only visibility; client contact is hashed — GDPR)
// =============================================================================

export type Severity = "low" | "medium" | "high";

/**
 * A bad-date report filed by an advertiser about a client. The client's
 * contact details are NEVER stored raw — only a normalised SHA-256 hash of the
 * phone and/or email is persisted (GDPR special-category data). Reports are
 * visible only to verified advertisers; that gate is enforced at the API layer.
 */
export interface BadDateReport {
  id: UUID;
  reporterAccountId: UUID;
  clientPhoneHash?: string | null;
  clientEmailHash?: string | null;
  description: string;
  severity: Severity;
  createdAt: Date;
}

export const severitySchema = z.enum(["low", "medium", "high"]);

// =============================================================================
// Reverse reviews (worker rates client; provider-only; contact hashed — GDPR)
// =============================================================================

export type Rating = 1 | 2 | 3 | 4 | 5;

/**
 * A review a worker leaves about a client. The client is identified only by a
 * normalised hash of their contact value — never the raw value (GDPR).
 */
export interface ReverseReview {
  id: UUID;
  reviewerAccountId: UUID;
  clientContactHash: string;
  rating: Rating;
  comment: string;
  createdAt: Date;
}

// =============================================================================
// Check-in / panic (booking safety)
// =============================================================================

export type CheckInStatus = "active" | "safe" | "overdue" | "panic";

/**
 * A trusted contact an account can notify in a safety situation. The contact
 * value (phone/email) is stored only as a normalised hash (GDPR).
 */
export interface TrustedContact {
  id: UUID;
  accountId: UUID;
  name: string;
  contactHash: string;
  createdAt: Date;
}

/**
 * A booking safety check-in. The account starts a timed session before a
 * booking; if they do not mark themselves safe before expectedEndAt the session
 * becomes overdue and an event is published. A panic trigger publishes
 * immediately.
 */
export interface CheckInSession {
  id: UUID;
  accountId: UUID;
  trustedContactId: UUID;
  startedAt: Date;
  expectedEndAt: Date;
  status: CheckInStatus;
  createdAt: Date;
}
