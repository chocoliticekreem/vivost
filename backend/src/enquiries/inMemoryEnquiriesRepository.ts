import { InMemoryRepository } from "../core";
import type { UUID } from "../core";
import type { Enquiry } from "./types";
import type { EnquiriesRepository } from "./enquiriesRepository";

export class InMemoryEnquiriesRepository
  extends InMemoryRepository<Enquiry>
  implements EnquiriesRepository
{
  async findByListing(listingId: UUID): Promise<Enquiry[]> {
    const all = await this.list();
    return all
      .filter((e) => e.listingId === listingId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}
