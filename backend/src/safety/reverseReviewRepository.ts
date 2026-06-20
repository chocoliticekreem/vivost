import type { Repository } from "../core";
import type { ReverseReview } from "./types";

export interface ReverseReviewRepository extends Repository<ReverseReview> {
  findByContactHash(contactHash: string): Promise<ReverseReview[]>;
}
