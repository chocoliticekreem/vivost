import { NotFoundError, ValidationError, newId } from "../core";
import type { Clock, UUID } from "../core";
import { submitReviewSchema } from "./types";
import type { Review, ReviewRating, SubmitReviewInput } from "./types";
import type { ReviewsRepository } from "./reviewsRepository";

export class ReviewsService {
  constructor(
    private readonly repo: ReviewsRepository,
    private readonly clock: Clock,
  ) {}

  /**
   * A client rates a listing. Rating must be an integer 1-5. Reviews are
   * published immediately (the flywheel) and can be removed by moderation.
   */
  async submit(input: SubmitReviewInput): Promise<Review> {
    const data = submitReviewSchema.parse(input);
    if (data.rating < 1 || data.rating > 5) {
      throw new ValidationError("rating must be between 1 and 5");
    }

    const review: Review = {
      id: newId(),
      listingId: data.listingId,
      clientId: data.clientId,
      rating: data.rating as ReviewRating,
      comment: data.comment,
      status: "published",
      createdAt: this.clock.now(),
    };
    return this.repo.save(review);
  }

  async listForListing(listingId: UUID): Promise<Review[]> {
    const all = await this.repo.findByListing(listingId);
    return all.filter((r) => r.status === "published");
  }

  async averageRating(listingId: UUID): Promise<number> {
    const published = await this.listForListing(listingId);
    if (published.length === 0) return 0;
    const sum = published.reduce((acc, r) => acc + r.rating, 0);
    return sum / published.length;
  }

  async moderateRemove(reviewId: UUID): Promise<Review> {
    const review = await this.repo.getById(reviewId);
    if (!review) {
      throw new NotFoundError("Review not found");
    }
    return this.repo.save({ ...review, status: "removed" });
  }
}
