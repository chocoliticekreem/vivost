import type { UUID } from "../core";

export type ReferralStatus = "pending" | "activated";

/**
 * A referral code owned by an account. Activity data only; ownerAccountId
 * references app.account by opaque UUID.
 */
export interface ReferralCode {
  id: UUID;
  ownerAccountId: UUID;
  code: string;
  createdAt: Date;
}

/**
 * A signup attributed to a referral code. Becomes 'activated' once the referred
 * account meets the activation gate, which triggers the double-sided reward.
 */
export interface Referral {
  id: UUID;
  codeId: UUID;
  referredAccountId: UUID;
  status: ReferralStatus;
  createdAt: Date;
  activatedAt: Date | null;
}

/**
 * An append-only reward ledger entry. balanceFor(account) sums amountMinor.
 * accountId references app.account by opaque UUID.
 */
export interface RewardLedgerEntry {
  id: UUID;
  accountId: UUID;
  amountMinor: number;
  reason: string;
  createdAt: Date;
}
