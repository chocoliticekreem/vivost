import type { Db, UUID } from "../core";
import type {
  VerificationMethod,
  VerificationRecord,
  VerificationStatus,
  VerificationSubjectType,
} from "./types";
import type { VerificationRepository } from "./verificationRepository";

interface Row {
  id: UUID;
  subject_id: UUID;
  subject_type: VerificationSubjectType;
  method: VerificationMethod;
  check_id: string;
  status: VerificationStatus;
  checked_at: Date | null;
  created_at: Date;
}

function toEntity(row: Row): VerificationRecord {
  return {
    id: row.id,
    subjectId: row.subject_id,
    subjectType: row.subject_type,
    method: row.method,
    checkId: row.check_id,
    status: row.status,
    checkedAt: row.checked_at,
    createdAt: row.created_at,
  };
}

export class PgVerificationRepository implements VerificationRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<VerificationRecord | undefined> {
    const { rows } = await this.db.query<Row>(
      `select id, subject_id, subject_type, method, check_id, status, checked_at, created_at
       from app.verification_record where id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toEntity(row) : undefined;
  }

  async list(): Promise<VerificationRecord[]> {
    const { rows } = await this.db.query<Row>(
      `select id, subject_id, subject_type, method, check_id, status, checked_at, created_at
       from app.verification_record order by created_at desc`,
    );
    return rows.map(toEntity);
  }

  async findBySubject(subjectId: UUID): Promise<VerificationRecord[]> {
    const { rows } = await this.db.query<Row>(
      `select id, subject_id, subject_type, method, check_id, status, checked_at, created_at
       from app.verification_record where subject_id = $1 order by created_at desc`,
      [subjectId],
    );
    return rows.map(toEntity);
  }

  async save(entity: VerificationRecord): Promise<VerificationRecord> {
    const { rows } = await this.db.query<Row>(
      `insert into app.verification_record
         (id, subject_id, subject_type, method, check_id, status, checked_at, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do update set
         subject_id = excluded.subject_id,
         subject_type = excluded.subject_type,
         method = excluded.method,
         check_id = excluded.check_id,
         status = excluded.status,
         checked_at = excluded.checked_at
       returning id, subject_id, subject_type, method, check_id, status, checked_at, created_at`,
      [
        entity.id,
        entity.subjectId,
        entity.subjectType,
        entity.method,
        entity.checkId,
        entity.status,
        entity.checkedAt,
        entity.createdAt,
      ],
    );
    return toEntity(rows[0]!);
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query(`delete from app.verification_record where id = $1`, [id]);
  }
}
