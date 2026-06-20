import type { Repository, UUID } from "../core";
import type { Listing } from "./types";

export interface ListingsRepository extends Repository<Listing> {
  listByOwner(ownerAccountId: UUID): Promise<Listing[]>;
  listActive(): Promise<Listing[]>;
}
