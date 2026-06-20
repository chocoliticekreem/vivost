import type { UUID } from "../core";

export type PaymentKind = "subscription" | "boost" | "verification" | "deposit";

export type PaymentStatus = "created" | "paid" | "failed" | "refunded";

/**
 * Payment is provider-agnostic. It references an account by opaque UUID only and
 * stores no card data — the underlying PaymentProvider (adult-friendly
 * processors, integrated later) owns all sensitive payment instrument data.
 */
export interface Payment {
  id: UUID;
  accountId: UUID;
  kind: PaymentKind;
  amountMinor: number;
  currency: string;
  reference: string;
  checkoutId: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}
