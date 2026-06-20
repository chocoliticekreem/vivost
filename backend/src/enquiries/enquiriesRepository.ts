import type { Repository, UUID } from "../core";
import type { Enquiry } from "./types";

export interface EnquiriesRepository extends Repository<Enquiry> {
  findByListing(listingId: UUID): Promise<Enquiry[]>;
}
