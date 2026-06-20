import { z } from "zod";
import type { UUID } from "../core";

export type EnquiryStatus = "pending" | "accepted" | "declined";

/**
 * An enquiry is a structured contact from a client to a listing. The
 * anti-timewaster fields (preferredTime, confirmedReadServices, references)
 * force the client to engage seriously before the advertiser is bothered.
 * listingId/clientId are opaque UUID references into other domains — never
 * joined here, per the cross-domain rule.
 */
export interface Enquiry {
  id: UUID;
  listingId: UUID;
  clientId?: UUID | null;
  name: string;
  preferredTime: string;
  confirmedReadServices: boolean;
  references?: string | null;
  message: string;
  status: EnquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const submitEnquirySchema = z.object({
  listingId: z.string().uuid(),
  clientId: z.string().uuid().nullable().default(null),
  name: z.string().min(1),
  preferredTime: z.string().min(1),
  confirmedReadServices: z.boolean(),
  references: z.string().nullable().default(null),
  message: z.string().min(1),
});

export type SubmitEnquiryInput = z.input<typeof submitEnquirySchema>;
