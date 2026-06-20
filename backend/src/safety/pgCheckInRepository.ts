import type { Db, UUID } from "../core";
import type { CheckInSession, CheckInStatus } from "./types";
import type { CheckInRepository } from "./checkInRepository";

interface CheckInRow {
  id: string;
  account_id: string;
  trusted_contact_id: string;
  started_at: Date;
  expected_end_at: Date;
  status: string;
  created_at: Date;
}

function toSession(row: CheckInRow): CheckInSession {
  return {
    id: row.id,
    accountId: row.account_id,
    trustedContactId: row.trusted_contact_id,
    startedAt: new Date(row.started_at),
    expectedEndAt: new Date(row.expected_end_at),
    status: row.status as CheckInStatus,
    createdAt: new Date(row.created_at),
  };
}

export class PgCheckInRepository implements CheckInRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<CheckInSession | undefined> {
    const { rows } = await this.db.query<CheckInRow>(
      "select * from app.check_in_session where id = $1",
      [id],
    );
    return rows[0] ? toSession(rows[0]) : undefined;
  }

  async list(): Promise<CheckInSession[]> {
    const { rows } = await this.db.query<CheckInRow>(
      "select * from app.check_in_session order by created_at desc",
    );
    return rows.map(toSession);
  }

  async listActive(): Promise<CheckInSession[]> {
    const { rows } = await this.db.query<CheckInRow>(
      "select * from app.check_in_session where status = 'active' order by created_at desc",
    );
    return rows.map(toSession);
  }

  async save(entity: CheckInSession): Promise<CheckInSession> {
    await this.db.query(
      `insert into app.check_in_session
         (id, account_id, trusted_contact_id, started_at, expected_end_at, status, created_at)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set
         account_id = excluded.account_id,
         trusted_contact_id = excluded.trusted_contact_id,
         started_at = excluded.started_at,
         expected_end_at = excluded.expected_end_at,
         status = excluded.status`,
      [
        entity.id,
        entity.accountId,
        entity.trustedContactId,
        entity.startedAt,
        entity.expectedEndAt,
        entity.status,
        entity.createdAt,
      ],
    );
    return entity;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query("delete from app.check_in_session where id = $1", [id]);
  }
}
