import type { Repository } from "../core";
import type { City } from "./types";

export interface GeoRepository extends Repository<City> {
  findBySlug(slug: string): Promise<City | undefined>;
}
