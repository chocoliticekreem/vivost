import type { Db, UUID } from "../core";
import type { TrustedContact } from "./types";
import type { TrustedContactRepository } from "./trustedContactRepository";

interface TrustedContactRow {
  id: string;
  account_id: string;
  name: string;
  contact_hash: string;
  created_at: Date;
}

function toContact(row: TrustedContactRow): TrustedContact {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    contactHash: row.contact_hash,
    createdAt: new Date(row.created_at),
  };
}

export class PgTrustedContactRepository implements TrustedContactRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<TrustedContact | undefined> {
    const { rows } = await this.db.query<TrustedContactRow>(
      "select * from app.trusted_contact where id = $1",
      [id],
    );
    return rows[0] ? toContact(rows[0]) : undefined;
  }

  async list(): Promise<TrustedContact[]> {
    const { rows } = await this.db.query<TrustedContactRow>(
      "select * from app.trusted_contact order by created_at desc",
    );
    return rows.map(toContact);
  }

  async listForAccount(accountId: string): Promise<TrustedContact[]> {
    const { rows } = await this.db.query<TrustedContactRow>(
      "select * from app.trusted_contact where account_id = $1 order by created_at desc",
      [accountId],
    );
    return rows.map(toContact);
  }

  async save(entity: TrustedContact): Promise<TrustedContact> {
    await this.db.query(
      `insert into app.trusted_contact
         (id, account_id, name, contact_hash, created_at)
       values ($1, $2, $3, $4, $5)
       on conflict (id) do update set
         account_id = excluded.account_id,
         name = excluded.name,
         contact_hash = excluded.contact_hash`,
      [entity.id, entity.accountId, entity.name, entity.contactHash, entity.createdAt],
    );
    return entity;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query("delete from app.trusted_contact where id = $1", [id]);
  }
}
