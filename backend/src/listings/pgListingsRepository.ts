import type { Db, UUID } from "../core";
import type { Listing, ListingAttribute, ListingStatus } from "./types";
import type { ListingsRepository } from "./listingsRepository";

interface ListingRow {
  id: UUID;
  owner_account_id: UUID;
  name: string;
  category_slug: string;
  location: string;
  area: string | null;
  hourly_rate: string | number;
  availability: string;
  image_color: string;
  photos: string[];
  description: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  ethnicity: string | null;
  languages: string[];
  services: string[];
  verified: boolean;
  region: string | null;
  source_url: string | null;
  attributes: ListingAttribute[];
  status: ListingStatus;
  created_at: Date;
  updated_at: Date;
}

const COLUMNS = `
  id, owner_account_id, name, category_slug, location, area, hourly_rate,
  availability, image_color, photos, description, phone, age, gender, ethnicity,
  languages, services, verified, region, source_url, attributes, status,
  created_at, updated_at`;

function toListing(row: ListingRow): Listing {
  return {
    id: row.id,
    ownerAccountId: row.owner_account_id,
    name: row.name,
    categorySlug: row.category_slug,
    location: row.location,
    area: row.area,
    hourlyRate: typeof row.hourly_rate === "string" ? Number(row.hourly_rate) : row.hourly_rate,
    availability: row.availability,
    imageColor: row.image_color,
    photos: row.photos ?? [],
    description: row.description,
    phone: row.phone,
    age: row.age,
    gender: row.gender,
    ethnicity: row.ethnicity,
    languages: row.languages ?? [],
    services: row.services ?? [],
    verified: row.verified,
    region: row.region,
    sourceUrl: row.source_url,
    attributes: row.attributes ?? [],
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class PgListingsRepository implements ListingsRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<Listing | undefined> {
    const { rows } = await this.db.query<ListingRow>(
      `select ${COLUMNS} from app.listing where id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toListing(row) : undefined;
  }

  async list(): Promise<Listing[]> {
    const { rows } = await this.db.query<ListingRow>(
      `select ${COLUMNS} from app.listing order by created_at asc`,
    );
    return rows.map(toListing);
  }

  async listByOwner(ownerAccountId: UUID): Promise<Listing[]> {
    const { rows } = await this.db.query<ListingRow>(
      `select ${COLUMNS} from app.listing where owner_account_id = $1 order by created_at asc`,
      [ownerAccountId],
    );
    return rows.map(toListing);
  }

  async listActive(): Promise<Listing[]> {
    const { rows } = await this.db.query<ListingRow>(
      `select ${COLUMNS} from app.listing where status = 'active' order by created_at asc`,
    );
    return rows.map(toListing);
  }

  async save(entity: Listing): Promise<Listing> {
    await this.db.query(
      `insert into app.listing (
         id, owner_account_id, name, category_slug, location, area, hourly_rate,
         availability, image_color, photos, description, phone, age, gender,
         ethnicity, languages, services, verified, region, source_url,
         attributes, status, created_at, updated_at
       ) values (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
         $17, $18, $19, $20, $21, $22, $23, $24
       )
       on conflict (id) do update set
         owner_account_id = excluded.owner_account_id,
         name = excluded.name,
         category_slug = excluded.category_slug,
         location = excluded.location,
         area = excluded.area,
         hourly_rate = excluded.hourly_rate,
         availability = excluded.availability,
         image_color = excluded.image_color,
         photos = excluded.photos,
         description = excluded.description,
         phone = excluded.phone,
         age = excluded.age,
         gender = excluded.gender,
         ethnicity = excluded.ethnicity,
         languages = excluded.languages,
         services = excluded.services,
         verified = excluded.verified,
         region = excluded.region,
         source_url = excluded.source_url,
         attributes = excluded.attributes,
         status = excluded.status`,
      [
        entity.id,
        entity.ownerAccountId,
        entity.name,
        entity.categorySlug,
        entity.location,
        entity.area ?? null,
        entity.hourlyRate,
        entity.availability,
        entity.imageColor,
        entity.photos,
        entity.description,
        entity.phone ?? null,
        entity.age ?? null,
        entity.gender ?? null,
        entity.ethnicity ?? null,
        entity.languages ?? [],
        entity.services ?? [],
        entity.verified,
        entity.region ?? null,
        entity.sourceUrl ?? null,
        JSON.stringify(entity.attributes ?? []),
        entity.status,
        entity.createdAt,
        entity.updatedAt,
      ],
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgListingsRepository.save: row not found after upsert");
    return saved;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query(`delete from app.listing where id = $1`, [id]);
  }
}
