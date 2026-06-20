import { InMemoryRepository } from "../core";
import type { City } from "./types";
import type { GeoRepository } from "./geoRepository";

export class InMemoryGeoRepository
  extends InMemoryRepository<City>
  implements GeoRepository
{
  async findBySlug(slug: string): Promise<City | undefined> {
    const target = slug.toLowerCase();
    const all = await this.list();
    return all.find((c) => c.slug.toLowerCase() === target);
  }
}
