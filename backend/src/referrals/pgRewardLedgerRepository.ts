import type { Db, UUID } from "../core";
import type { RewardLedgerEntry } from "./types";
import type { RewardLedgerRepository } from "./rewardLedgerRepository";

interface LedgerRow {
  id: UUID;
  account_id: UUID;
  amount_minor: string;
  reason: string;
  created_at: Date;
}

function toEntry(row: LedgerRow): RewardLedgerEntry {
  return {
    id: row.id,
    accountId: row.account_id,
    amountMinor: Number(row.amount_minor),
    reason: row.reason,
    createdAt: new Date(row.created_at),
  };
}

export class PgRewardLedgerRepository implements RewardLedgerRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<RewardLedgerEntry | undefined> {
    const { rows } = await this.db.query<LedgerRow>(
      `select id, account_id, amount_minor, reason, created_at
         from app.reward_ledger where id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toEntry(row) : undefined;
  }

  async list(): Promise<RewardLedgerEntry[]> {
    const { rows } = await this.db.query<LedgerRow>(
      `select id, account_id, amount_minor, reason, created_at
         from app.reward_ledger order by created_at asc`,
    );
    return rows.map(toEntry);
  }

  async findByAccount(accountId: string): Promise<RewardLedgerEntry[]> {
    const { rows } = await this.db.query<LedgerRow>(
      `select id, account_id, amount_minor, reason, created_at
         from app.reward_ledger where account_id = $1 order by created_at asc`,
      [accountId],
    );
    return rows.map(toEntry);
  }

  async save(entity: RewardLedgerEntry): Promise<RewardLedgerEntry> {
    await this.db.query(
      `insert into app.reward_ledger (id, account_id, amount_minor, reason, created_at)
         values ($1, $2, $3, $4, $5)
       on conflict (id) do update
         set account_id = excluded.account_id,
             amount_minor = excluded.amount_minor,
             reason = excluded.reason`,
      [entity.id, entity.accountId, entity.amountMinor, entity.reason, entity.createdAt],
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgRewardLedgerRepository.save: row not found after upsert");
    return saved;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query(`delete from app.reward_ledger where id = $1`, [id]);
  }
}
