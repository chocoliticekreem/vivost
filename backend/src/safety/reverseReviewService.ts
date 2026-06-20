import {
  newId,
  ValidationError,
  type Clock,
  type Hasher,
  type UUID,
} from "../core";
import type { Rating, ReverseReview } from "./types";
import type { ReverseReviewRepository } from "./reverseReviewRepository";

/**
 * Normalise a free-form client contact value (phone or email) before hashing.
 * Trim + lowercase so the same contact always maps to the same hash for lookup.
 */
function normaliseContact(contact: string): string {
  return contact.trim().toLowerCase();
}

export class ReverseReviewService {
  constructor(
    private readonly repo: ReverseReviewRepository,
    private readonly hasher: Hasher,
    private readonly clock: Clock,
  ) {}

  async add(input: {
    reviewerAccountId: UUID;
    clientContact: string;
    rating: number;
    comment: string;
  }): Promise<ReverseReview> {
    if (
      !Number.isInteger(input.rating) ||
      input.rating < 1 ||
      input.rating > 5
    ) {
      throw new ValidationError("rating must be an integer between 1 and 5");
    }

    if (input.clientContact.trim() === "") {
      throw new ValidationError("clientContact is required");
    }

    const review: ReverseReview = {
      id: newId(),
      reviewerAccountId: input.reviewerAccountId,
      clientContactHash: this.hasher.hash(normaliseContact(input.clientContact)),
      rating: input.rating as Rating,
      comment: input.comment,
      createdAt: this.clock.now(),
    };
    return this.repo.save(review);
  }

  async forClient(input: { contact: string }): Promise<ReverseReview[]> {
    const hash = this.hasher.hash(normaliseContact(input.contact));
    return this.repo.findByContactHash(hash);
  }

  async averageRating(input: { contact: string }): Promise<number | null> {
    const reviews = await this.forClient(input);
    if (reviews.length === 0) return null;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return total / reviews.length;
  }
}
