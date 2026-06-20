import type { Db, UUID } from "../core";
import type { City } from "./types";
import type { GeoRepository } from "./geoRepository";

interface CityRow {
  id: UUID;
  slug: string;
  name: string;
  region: string;
  lat: number | null;
  lng: number | null;
}

function toCity(row: CityRow): City {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    region: row.region,
    lat: row.lat,
    lng: row.lng,
  };
}

/**
 * Postgres adapter for cities. Cities hold no personal data, so they live in
 * the public `app` schema with no identity separation.
 */
export class PgGeoRepository implements GeoRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<City | undefined> {
    const { rows } = await this.db.query<CityRow>(
      `select id, slug, name, region, lat, lng from app.city where id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toCity(row) : undefined;
  }

  async list(): Promise<City[]> {
    const { rows } = await this.db.query<CityRow>(
      `select id, slug, name, region, lat, lng from app.city order by name asc`,
    );
    return rows.map(toCity);
  }

  async findBySlug(slug: string): Promise<City | undefined> {
    const { rows } = await this.db.query<CityRow>(
      `select id, slug, name, region, lat, lng from app.city where slug = $1`,
      [slug.toLowerCase()],
    );
    const row = rows[0];
    return row ? toCity(row) : undefined;
  }

  async save(entity: City): Promise<City> {
    await this.db.query(
      `insert into app.city (id, slug, name, region, lat, lng)
         values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update
         set slug = excluded.slug,
             name = excluded.name,
             region = excluded.region,
             lat = excluded.lat,
             lng = excluded.lng`,
      [entity.id, entity.slug.toLowerCase(), entity.name, entity.region, entity.lat ?? null, entity.lng ?? null],
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgGeoRepository.save: row not found after upsert");
    return saved;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query(`delete from app.city where id = $1`, [id]);
  }
}
