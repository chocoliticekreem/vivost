import type { Repository, UUID } from "../core";
import type { Review } from "./types";

export interface ReviewsRepository extends Repository<Review> {
  findByListing(listingId: UUID): Promise<Review[]>;
}
