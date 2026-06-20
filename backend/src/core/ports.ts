import type { UUID } from "./ids";

/**
 * Payment processing port. Real adult-friendly processors (CCBill / Segpay)
 * are integrated later behind this interface. No real keys live here.
 */
export interface PaymentProvider {
  createCheckout(input: {
    amountMinor: number;
    currency: string;
    reference: string;
    kind: "subscription" | "boost" | "verification" | "deposit";
  }): Promise<{ checkoutId: string; url: string }>;
  capture(checkoutId: string): Promise<{ status: "paid" | "failed" }>;
  refund(
    checkoutId: string,
    amountMinor?: number,
  ): Promise<{ status: "refunded" | "failed" }>;
  holdDeposit(input: {
    amountMinor: number;
    currency: string;
    reference: string;
  }): Promise<{ holdId: string }>;
  releaseDeposit(holdId: string): Promise<{ status: "released" | "failed" }>;
  verifyWebhook(payload: string, signature: string): boolean;
}

/**
 * Identity / age verification port. GDPR-critical: getResult returns ONLY a
 * pass/fail/pending result plus method and date. The underlying documents
 * (ID images, selfies) are NEVER returned or stored — store results, not artefacts.
 */
export interface IdVerificationProvider {
  startCheck(input: {
    subjectId: UUID;
    method: "photo_id" | "facial_age_estimation" | "open_banking" | "credit_card" | "mno";
  }): Promise<{ checkId: string }>;
  getResult(
    checkId: string,
  ): Promise<{ status: "pass" | "fail" | "pending"; method: string; checkedAt: Date | null }>;
}

/**
 * In-process event bus. Lets domains react to each other's events without
 * importing each other — cross-domain coupling goes through events or UUIDs.
 */
export interface EventBus {
  publish(event: { type: string; payload: unknown }): Promise<void>;
  subscribe(type: string, handler: (payload: unknown) => void): void;
}
