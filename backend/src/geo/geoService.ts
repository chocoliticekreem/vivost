import { NotFoundError, newId } from "../core";
import type { City } from "./types";
import { UK_CITY_SEED } from "./types";
import type { GeoRepository } from "./geoRepository";

export class GeoService {
  constructor(private readonly repo: GeoRepository) {}

  async listCities(): Promise<City[]> {
    return this.repo.list();
  }

  async getBySlug(slug: string): Promise<City> {
    const city = await this.repo.findBySlug(slug);
    if (!city) throw new NotFoundError(`City not found: ${slug}`);
    return city;
  }

  /**
   * Seed helper: inserts the UK city seed set into the repository. Idempotent by
   * slug — existing slugs are skipped. Returns the cities now present.
   */
  async seed(): Promise<City[]> {
    for (const seed of UK_CITY_SEED) {
      const existing = await this.repo.findBySlug(seed.slug);
      if (existing) continue;
      await this.repo.save({ id: newId(), ...seed });
    }
    return this.listCities();
  }
}
