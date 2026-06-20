import { InMemoryRepository } from "../core";
import type { PlacementsRepository } from "./placementsRepository";
import type { Placement } from "./types";

export class InMemoryPlacementsRepository
  extends InMemoryRepository<Placement>
  implements PlacementsRepository
{
  async findByListing(listingId: string): Promise<Placement[]> {
    const all = await this.list();
    return all.filter((p) => p.listingId === listingId);
  }

  async findByCategory(categorySlug: string): Promise<Placement[]> {
    const all = await this.list();
    return all.filter((p) => p.categorySlug === categorySlug);
  }

  async findByCity(citySlug: string): Promise<Placement[]> {
    const all = await this.list();
    return all.filter((p) => p.citySlug === citySlug);
  }
}
