import type { Db, UUID } from "../core";
import type { PlacementsRepository } from "./placementsRepository";
import type { Placement, PlacementKind } from "./types";

interface PlacementRow {
  id: string;
  listing_id: string;
  kind: string;
  starts_at: Date | string;
  ends_at: Date | string;
  city_slug: string | null;
  category_slug: string | null;
}

function toPlacement(row: PlacementRow): Placement {
  return {
    id: row.id,
    listingId: row.listing_id,
    kind: row.kind as PlacementKind,
    startsAt: new Date(row.starts_at),
    endsAt: new Date(row.ends_at),
    citySlug: row.city_slug,
    categorySlug: row.category_slug,
  };
}

export class PgPlacementsRepository implements PlacementsRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<Placement | undefined> {
    const { rows } = await this.db.query<PlacementRow>(
      "select * from app.placement where id = $1",
      [id],
    );
    return rows[0] ? toPlacement(rows[0]) : undefined;
  }

  async findByListing(listingId: string): Promise<Placement[]> {
    const { rows } = await this.db.query<PlacementRow>(
      "select * from app.placement where listing_id = $1",
      [listingId],
    );
    return rows.map(toPlacement);
  }

  async findByCategory(categorySlug: string): Promise<Placement[]> {
    const { rows } = await this.db.query<PlacementRow>(
      "select * from app.placement where category_slug = $1",
      [categorySlug],
    );
    return rows.map(toPlacement);
  }

  async findByCity(citySlug: string): Promise<Placement[]> {
    const { rows } = await this.db.query<PlacementRow>(
      "select * from app.placement where city_slug = $1",
      [citySlug],
    );
    return rows.map(toPlacement);
  }

  async list(): Promise<Placement[]> {
    const { rows } = await this.db.query<PlacementRow>(
      "select * from app.placement",
    );
    return rows.map(toPlacement);
  }

  async save(entity: Placement): Promise<Placement> {
    await this.db.query(
      `insert into app.placement
         (id, listing_id, kind, starts_at, ends_at, city_slug, category_slug)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set
         listing_id = excluded.listing_id,
         kind = excluded.kind,
         starts_at = excluded.starts_at,
         ends_at = excluded.ends_at,
         city_slug = excluded.city_slug,
         category_slug = excluded.category_slug`,
      [
        entity.id,
        entity.listingId,
        entity.kind,
        entity.startsAt,
        entity.endsAt,
        entity.citySlug,
        entity.categorySlug,
      ],
    );
    return entity;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query("delete from app.placement where id = $1", [id]);
  }
}
