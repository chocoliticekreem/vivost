import type { Db, UUID } from "../core";
import type { OffenderReport } from "./types";
import type { OffenderReportRepository } from "./offenderReportRepository";

interface OffenderReportRow {
  id: UUID;
  phone_hash: string | null;
  email_hash: string | null;
  reason: string;
  reported_by: UUID;
  created_at: Date;
}

function toReport(row: OffenderReportRow): OffenderReport {
  return {
    id: row.id,
    phoneHash: row.phone_hash,
    emailHash: row.email_hash,
    reason: row.reason,
    reportedByAccountId: row.reported_by,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Postgres adapter for the reported-offender DB. Stores hashes only — never raw
 * phone/email (GDPR minimisation).
 */
export class PgOffenderReportRepository implements OffenderReportRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<OffenderReport | undefined> {
    const { rows } = await this.db.query<OffenderReportRow>(
      `select id, phone_hash, email_hash, reason, reported_by, created_at
         from app.offender_report
        where id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toReport(row) : undefined;
  }

  async list(): Promise<OffenderReport[]> {
    const { rows } = await this.db.query<OffenderReportRow>(
      `select id, phone_hash, email_hash, reason, reported_by, created_at
         from app.offender_report
        order by created_at asc`,
    );
    return rows.map(toReport);
  }

  async findByHashes(hashes: string[]): Promise<OffenderReport[]> {
    if (hashes.length === 0) return [];
    const { rows } = await this.db.query<OffenderReportRow>(
      `select id, phone_hash, email_hash, reason, reported_by, created_at
         from app.offender_report
        where phone_hash = any($1) or email_hash = any($1)
        order by created_at asc`,
      [hashes],
    );
    return rows.map(toReport);
  }

  async save(entity: OffenderReport): Promise<OffenderReport> {
    await this.db.query(
      `insert into app.offender_report
         (id, phone_hash, email_hash, reason, reported_by, created_at)
         values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update
         set phone_hash = excluded.phone_hash,
             email_hash = excluded.email_hash,
             reason = excluded.reason,
             reported_by = excluded.reported_by`,
      [
        entity.id,
        entity.phoneHash ?? null,
        entity.emailHash ?? null,
        entity.reason,
        entity.reportedByAccountId,
        entity.createdAt,
      ],
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgOffenderReportRepository.save: row not found after upsert");
    return saved;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query(`delete from app.offender_report where id = $1`, [id]);
  }
}
