import type { Db, UUID } from "../core";
import type { BadDateReport, Severity } from "./types";
import type { BadDateRepository } from "./badDateRepository";

interface BadDateRow {
  id: string;
  reporter_account_id: string;
  phone_hash: string | null;
  email_hash: string | null;
  description: string;
  severity: string;
  created_at: Date;
}

function toReport(row: BadDateRow): BadDateReport {
  return {
    id: row.id,
    reporterAccountId: row.reporter_account_id,
    clientPhoneHash: row.phone_hash,
    clientEmailHash: row.email_hash,
    description: row.description,
    severity: row.severity as Severity,
    createdAt: new Date(row.created_at),
  };
}

export class PgBadDateRepository implements BadDateRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<BadDateReport | undefined> {
    const { rows } = await this.db.query<BadDateRow>(
      "select * from app.bad_date_report where id = $1",
      [id],
    );
    return rows[0] ? toReport(rows[0]) : undefined;
  }

  async list(): Promise<BadDateReport[]> {
    const { rows } = await this.db.query<BadDateRow>(
      "select * from app.bad_date_report order by created_at desc",
    );
    return rows.map(toReport);
  }

  async findByHashes(input: {
    phoneHash?: string | null;
    emailHash?: string | null;
  }): Promise<BadDateReport[]> {
    const { rows } = await this.db.query<BadDateRow>(
      `select * from app.bad_date_report
        where ($1::text is not null and phone_hash = $1)
           or ($2::text is not null and email_hash = $2)
        order by created_at desc`,
      [input.phoneHash ?? null, input.emailHash ?? null],
    );
    return rows.map(toReport);
  }

  async save(entity: BadDateReport): Promise<BadDateReport> {
    await this.db.query(
      `insert into app.bad_date_report
         (id, reporter_account_id, phone_hash, email_hash, description, severity, created_at)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set
         reporter_account_id = excluded.reporter_account_id,
         phone_hash = excluded.phone_hash,
         email_hash = excluded.email_hash,
         description = excluded.description,
         severity = excluded.severity`,
      [
        entity.id,
        entity.reporterAccountId,
        entity.clientPhoneHash ?? null,
        entity.clientEmailHash ?? null,
        entity.description,
        entity.severity,
        entity.createdAt,
      ],
    );
    return entity;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query("delete from app.bad_date_report where id = $1", [id]);
  }
}
