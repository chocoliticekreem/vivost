import type { Repository } from "../core";
import type { Placement } from "./types";

export interface PlacementsRepository extends Repository<Placement> {
  findByListing(listingId: string): Promise<Placement[]>;
  findByCategory(categorySlug: string): Promise<Placement[]>;
  findByCity(citySlug: string): Promise<Placement[]>;
}
