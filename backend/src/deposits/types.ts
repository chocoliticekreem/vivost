import { z } from "zod";
import type { UUID } from "../core";

export type DepositStatus = "held" | "released" | "forfeited";

/**
 * A deposit is a payment hold placed against an enquiry to deter no-shows.
 * holdId is the opaque reference returned by the PaymentProvider port; no card
 * data ever lands here. enquiryId is a plain UUID reference into the enquiries
 * domain.
 */
export interface Deposit {
  id: UUID;
  enquiryId: UUID;
  amountMinor: number;
  currency: string;
  holdId: string;
  status: DepositStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const holdDepositSchema = z.object({
  enquiryId: z.string().uuid(),
  amountMinor: z.number().int().positive(),
  currency: z.string().min(1),
});

export type HoldDepositInput = z.input<typeof holdDepositSchema>;
