import { InMemoryRepository } from "../core";
import type { UUID } from "../core";
import type { Review } from "./types";
import type { ReviewsRepository } from "./reviewsRepository";

export class InMemoryReviewsRepository
  extends InMemoryRepository<Review>
  implements ReviewsRepository
{
  async findByListing(listingId: UUID): Promise<Review[]> {
    const all = await this.list();
    return all
      .filter((r) => r.listingId === listingId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}
