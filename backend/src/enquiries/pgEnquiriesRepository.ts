import type { Db, UUID } from "../core";
import type { Enquiry, EnquiryStatus } from "./types";
import type { EnquiriesRepository } from "./enquiriesRepository";

interface EnquiryRow {
  id: UUID;
  listing_id: UUID;
  client_id: UUID | null;
  name: string;
  preferred_time: string;
  confirmed_read_services: boolean;
  references: string | null;
  message: string;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
}

function toEnquiry(row: EnquiryRow): Enquiry {
  return {
    id: row.id,
    listingId: row.listing_id,
    clientId: row.client_id,
    name: row.name,
    preferredTime: row.preferred_time,
    confirmedReadServices: row.confirmed_read_services,
    references: row.references,
    message: row.message,
    status: row.status as EnquiryStatus,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class PgEnquiriesRepository implements EnquiriesRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<Enquiry | undefined> {
    const { rows } = await this.db.query<EnquiryRow>(
      "select * from app.enquiry where id = $1",
      [id],
    );
    const row = rows[0];
    return row ? toEnquiry(row) : undefined;
  }

  async list(): Promise<Enquiry[]> {
    const { rows } = await this.db.query<EnquiryRow>(
      "select * from app.enquiry order by created_at asc",
    );
    return rows.map(toEnquiry);
  }

  async findByListing(listingId: UUID): Promise<Enquiry[]> {
    const { rows } = await this.db.query<EnquiryRow>(
      "select * from app.enquiry where listing_id = $1 order by created_at asc",
      [listingId],
    );
    return rows.map(toEnquiry);
  }

  async save(entity: Enquiry): Promise<Enquiry> {
    await this.db.query(
      `insert into app.enquiry
         (id, listing_id, client_id, name, preferred_time,
          confirmed_read_services, "references", message, status,
          created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       on conflict (id) do update set
         status = excluded.status`,
      [
        entity.id,
        entity.listingId,
        entity.clientId ?? null,
        entity.name,
        entity.preferredTime,
        entity.confirmedReadServices,
        entity.references ?? null,
        entity.message,
        entity.status,
        entity.createdAt,
        entity.updatedAt,
      ],
    );
    const saved = await this.getById(entity.id);
    if (!saved) {
      throw new Error("PgEnquiriesRepository.save: row not found after upsert");
    }
    return saved;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query("delete from app.enquiry where id = $1", [id]);
  }
}
