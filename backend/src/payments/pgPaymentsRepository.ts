import type { Db, UUID } from "../core";
import type { Payment, PaymentKind, PaymentStatus } from "./types";
import type { PaymentsRepository } from "./paymentsRepository";

interface Row {
  id: UUID;
  account_id: UUID;
  kind: PaymentKind;
  amount_minor: string | number;
  currency: string;
  reference: string;
  checkout_id: string;
  status: PaymentStatus;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: Row): Payment {
  return {
    id: row.id,
    accountId: row.account_id,
    kind: row.kind,
    amountMinor: Number(row.amount_minor),
    currency: row.currency,
    reference: row.reference,
    checkoutId: row.checkout_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const COLS =
  "id, account_id, kind, amount_minor, currency, reference, checkout_id, status, created_at, updated_at";

export class PgPaymentsRepository implements PaymentsRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<Payment | undefined> {
    const { rows } = await this.db.query<Row>(
      `select ${COLS} from app.payment where id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toEntity(row) : undefined;
  }

  async list(): Promise<Payment[]> {
    const { rows } = await this.db.query<Row>(
      `select ${COLS} from app.payment order by created_at desc`,
    );
    return rows.map(toEntity);
  }

  async findByCheckoutId(checkoutId: string): Promise<Payment | undefined> {
    const { rows } = await this.db.query<Row>(
      `select ${COLS} from app.payment where checkout_id = $1`,
      [checkoutId],
    );
    const row = rows[0];
    return row ? toEntity(row) : undefined;
  }

  async save(entity: Payment): Promise<Payment> {
    const { rows } = await this.db.query<Row>(
      `insert into app.payment
         (id, account_id, kind, amount_minor, currency, reference, checkout_id, status, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       on conflict (id) do update set
         account_id = excluded.account_id,
         kind = excluded.kind,
         amount_minor = excluded.amount_minor,
         currency = excluded.currency,
         reference = excluded.reference,
         checkout_id = excluded.checkout_id,
         status = excluded.status
       returning ${COLS}`,
      [
        entity.id,
        entity.accountId,
        entity.kind,
        entity.amountMinor,
        entity.currency,
        entity.reference,
        entity.checkoutId,
        entity.status,
        entity.createdAt,
        entity.updatedAt,
      ],
    );
    return toEntity(rows[0]!);
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query(`delete from app.payment where id = $1`, [id]);
  }
}
