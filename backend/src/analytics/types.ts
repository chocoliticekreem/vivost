import type { UUID } from "../core";

export type AnalyticsEventType = "view" | "contact" | "conversion";

/**
 * A single per-listing funnel event. GDPR: holds NO personal data. The optional
 * sessionHash is a one-way hash of a session identifier only — never a raw id,
 * IP, or any PII. listingId references a listing by opaque UUID.
 */
export interface AnalyticsEvent {
  id: UUID;
  listingId: UUID;
  type: AnalyticsEventType;
  at: Date;
  sessionHash?: string | null;
}

/**
 * Aggregated funnel metrics for one listing.
 * contactRate = contacts / views (0 when views = 0).
 * conversionRate = conversions / contacts (0 when contacts = 0).
 */
export interface Funnel {
  views: number;
  contacts: number;
  conversions: number;
  contactRate: number;
  conversionRate: number;
}
