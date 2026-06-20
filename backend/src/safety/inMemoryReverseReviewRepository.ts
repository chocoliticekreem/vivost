import { InMemoryRepository } from "../core";
import type { ReverseReview } from "./types";
import type { ReverseReviewRepository } from "./reverseReviewRepository";

export class InMemoryReverseReviewRepository
  extends InMemoryRepository<ReverseReview>
  implements ReverseReviewRepository
{
  async findByContactHash(contactHash: string): Promise<ReverseReview[]> {
    const all = await this.list();
    return all.filter((r) => r.clientContactHash === contactHash);
  }
}
