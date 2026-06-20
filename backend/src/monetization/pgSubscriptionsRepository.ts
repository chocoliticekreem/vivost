import type { Db, UUID } from "../core";
import type { SubscriptionsRepository } from "./subscriptionsRepository";
import type { Subscription, SubscriptionStatus } from "./types";

interface SubscriptionRow {
  id: string;
  account_id: string;
  plan_id: string;
  status: string;
  started_at: Date | string;
  current_period_end: Date | string;
  cancel_at_period_end: boolean;
}

function toSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    accountId: row.account_id,
    planId: row.plan_id,
    status: row.status as SubscriptionStatus,
    startedAt: new Date(row.started_at),
    currentPeriodEnd: new Date(row.current_period_end),
    cancelAtPeriodEnd: row.cancel_at_period_end,
  };
}

export class PgSubscriptionsRepository implements SubscriptionsRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<Subscription | undefined> {
    const { rows } = await this.db.query<SubscriptionRow>(
      "select * from app.subscription where id = $1",
      [id],
    );
    return rows[0] ? toSubscription(rows[0]) : undefined;
  }

  async findByAccount(accountId: string): Promise<Subscription[]> {
    const { rows } = await this.db.query<SubscriptionRow>(
      "select * from app.subscription where account_id = $1 order by started_at desc",
      [accountId],
    );
    return rows.map(toSubscription);
  }

  async list(): Promise<Subscription[]> {
    const { rows } = await this.db.query<SubscriptionRow>(
      "select * from app.subscription",
    );
    return rows.map(toSubscription);
  }

  async save(entity: Subscription): Promise<Subscription> {
    await this.db.query(
      `insert into app.subscription
         (id, account_id, plan_id, status, started_at, current_period_end, cancel_at_period_end)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set
         account_id = excluded.account_id,
         plan_id = excluded.plan_id,
         status = excluded.status,
         started_at = excluded.started_at,
         current_period_end = excluded.current_period_end,
         cancel_at_period_end = excluded.cancel_at_period_end`,
      [
        entity.id,
        entity.accountId,
        entity.planId,
        entity.status,
        entity.startedAt,
        entity.currentPeriodEnd,
        entity.cancelAtPeriodEnd,
      ],
    );
    return entity;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query("delete from app.subscription where id = $1", [id]);
  }
}
