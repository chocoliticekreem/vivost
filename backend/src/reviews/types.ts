import { z } from "zod";
import type { UUID } from "../core";

export type ReviewRating = 1 | 2 | 3 | 4 | 5;
export type ReviewStatus = "published" | "pending" | "removed";

/**
 * A public review: a client rates a listing. Part of the trust flywheel.
 * listingId and clientId are opaque UUID references into other domains.
 */
export interface Review {
  id: UUID;
  listingId: UUID;
  clientId: UUID;
  rating: ReviewRating;
  comment: string;
  status: ReviewStatus;
  createdAt: Date;
}

export const submitReviewSchema = z.object({
  listingId: z.string().uuid(),
  clientId: z.string().uuid(),
  rating: z.number().int(),
  comment: z.string(),
});

export type SubmitReviewInput = z.input<typeof submitReviewSchema>;
