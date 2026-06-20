import type { Db, UUID } from "../core";
import type { Referral, ReferralCode, ReferralStatus } from "./types";
import type {
  ReferralCodeRepository,
  ReferralRepository,
} from "./referralRepository";

interface CodeRow {
  id: UUID;
  owner_account_id: UUID;
  code: string;
  created_at: Date;
}

function toCode(row: CodeRow): ReferralCode {
  return {
    id: row.id,
    ownerAccountId: row.owner_account_id,
    code: row.code,
    createdAt: new Date(row.created_at),
  };
}

export class PgReferralCodeRepository implements ReferralCodeRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<ReferralCode | undefined> {
    const { rows } = await this.db.query<CodeRow>(
      `select id, owner_account_id, code, created_at
         from app.referral_code where id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toCode(row) : undefined;
  }

  async list(): Promise<ReferralCode[]> {
    const { rows } = await this.db.query<CodeRow>(
      `select id, owner_account_id, code, created_at
         from app.referral_code order by created_at asc`,
    );
    return rows.map(toCode);
  }

  async findByCode(code: string): Promise<ReferralCode | undefined> {
    const { rows } = await this.db.query<CodeRow>(
      `select id, owner_account_id, code, created_at
         from app.referral_code where code = $1`,
      [code],
    );
    const row = rows[0];
    return row ? toCode(row) : undefined;
  }

  async save(entity: ReferralCode): Promise<ReferralCode> {
    await this.db.query(
      `insert into app.referral_code (id, owner_account_id, code, created_at)
         values ($1, $2, $3, $4)
       on conflict (id) do update
         set owner_account_id = excluded.owner_account_id,
             code = excluded.code`,
      [entity.id, entity.ownerAccountId, entity.code, entity.createdAt],
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgReferralCodeRepository.save: row not found after upsert");
    return saved;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query(`delete from app.referral_code where id = $1`, [id]);
  }
}

interface ReferralRow {
  id: UUID;
  code_id: UUID;
  referred_account_id: UUID;
  status: ReferralStatus;
  created_at: Date;
  activated_at: Date | null;
}

function toReferral(row: ReferralRow): Referral {
  return {
    id: row.id,
    codeId: row.code_id,
    referredAccountId: row.referred_account_id,
    status: row.status,
    createdAt: new Date(row.created_at),
    activatedAt: row.activated_at ? new Date(row.activated_at) : null,
  };
}

export class PgReferralRepository implements ReferralRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<Referral | undefined> {
    const { rows } = await this.db.query<ReferralRow>(
      `select id, code_id, referred_account_id, status, created_at, activated_at
         from app.referral where id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toReferral(row) : undefined;
  }

  async list(): Promise<Referral[]> {
    const { rows } = await this.db.query<ReferralRow>(
      `select id, code_id, referred_account_id, status, created_at, activated_at
         from app.referral order by created_at asc`,
    );
    return rows.map(toReferral);
  }

  async findByCodeId(codeId: string): Promise<Referral[]> {
    const { rows } = await this.db.query<ReferralRow>(
      `select id, code_id, referred_account_id, status, created_at, activated_at
         from app.referral where code_id = $1 order by created_at asc`,
      [codeId],
    );
    return rows.map(toReferral);
  }

  async save(entity: Referral): Promise<Referral> {
    await this.db.query(
      `insert into app.referral
         (id, code_id, referred_account_id, status, created_at, activated_at)
         values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update
         set code_id = excluded.code_id,
             referred_account_id = excluded.referred_account_id,
             status = excluded.status,
             activated_at = excluded.activated_at`,
      [
        entity.id,
        entity.codeId,
        entity.referredAccountId,
        entity.status,
        entity.createdAt,
        entity.activatedAt,
      ],
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgReferralRepository.save: row not found after upsert");
    return saved;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query(`delete from app.referral where id = $1`, [id]);
  }
}
