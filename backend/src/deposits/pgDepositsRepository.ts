import type { Db, UUID } from "../core";
import type { Deposit, DepositStatus } from "./types";
import type { DepositsRepository } from "./depositsRepository";

interface DepositRow {
  id: UUID;
  enquiry_id: UUID;
  amount_minor: number | string;
  currency: string;
  hold_id: string;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
}

function toDeposit(row: DepositRow): Deposit {
  return {
    id: row.id,
    enquiryId: row.enquiry_id,
    amountMinor: Number(row.amount_minor),
    currency: row.currency,
    holdId: row.hold_id,
    status: row.status as DepositStatus,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class PgDepositsRepository implements DepositsRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<Deposit | undefined> {
    const { rows } = await this.db.query<DepositRow>(
      "select * from app.deposit where id = $1",
      [id],
    );
    const row = rows[0];
    return row ? toDeposit(row) : undefined;
  }

  async list(): Promise<Deposit[]> {
    const { rows } = await this.db.query<DepositRow>(
      "select * from app.deposit order by created_at asc",
    );
    return rows.map(toDeposit);
  }

  async findByEnquiry(enquiryId: UUID): Promise<Deposit[]> {
    const { rows } = await this.db.query<DepositRow>(
      "select * from app.deposit where enquiry_id = $1 order by created_at asc",
      [enquiryId],
    );
    return rows.map(toDeposit);
  }

  async save(entity: Deposit): Promise<Deposit> {
    await this.db.query(
      `insert into app.deposit
         (id, enquiry_id, amount_minor, currency, hold_id, status,
          created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do update set
         status = excluded.status`,
      [
        entity.id,
        entity.enquiryId,
        entity.amountMinor,
        entity.currency,
        entity.holdId,
        entity.status,
        entity.createdAt,
        entity.updatedAt,
      ],
    );
    const saved = await this.getById(entity.id);
    if (!saved) {
      throw new Error("PgDepositsRepository.save: row not found after upsert");
    }
    return saved;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query("delete from app.deposit where id = $1", [id]);
  }
}
