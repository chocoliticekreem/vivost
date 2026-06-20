import type { Db, UUID } from "../core";
import type { PlansRepository } from "./plansRepository";
import type { Plan, PlanFeatures, PlanKey } from "./types";

interface PlanRow {
  id: string;
  key: string;
  name: string;
  price_minor: number | string;
  currency: string;
  interval_months: number | string;
  features: PlanFeatures;
  active: boolean;
}

function toPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    key: row.key as PlanKey,
    name: row.name,
    priceMinor: Number(row.price_minor),
    currency: row.currency,
    intervalMonths: Number(row.interval_months),
    features: row.features,
    active: row.active,
  };
}

export class PgPlansRepository implements PlansRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<Plan | undefined> {
    const { rows } = await this.db.query<PlanRow>(
      "select * from app.plan where id = $1",
      [id],
    );
    return rows[0] ? toPlan(rows[0]) : undefined;
  }

  async getByKey(key: PlanKey): Promise<Plan | undefined> {
    const { rows } = await this.db.query<PlanRow>(
      "select * from app.plan where key = $1",
      [key],
    );
    return rows[0] ? toPlan(rows[0]) : undefined;
  }

  async list(): Promise<Plan[]> {
    const { rows } = await this.db.query<PlanRow>(
      "select * from app.plan order by features->>'priorityRank'",
    );
    return rows.map(toPlan);
  }

  async listActive(): Promise<Plan[]> {
    const { rows } = await this.db.query<PlanRow>(
      "select * from app.plan where active = true order by features->>'priorityRank'",
    );
    return rows.map(toPlan);
  }

  async save(entity: Plan): Promise<Plan> {
    await this.db.query(
      `insert into app.plan
         (id, key, name, price_minor, currency, interval_months, features, active)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do update set
         key = excluded.key,
         name = excluded.name,
         price_minor = excluded.price_minor,
         currency = excluded.currency,
         interval_months = excluded.interval_months,
         features = excluded.features,
         active = excluded.active`,
      [
        entity.id,
        entity.key,
        entity.name,
        entity.priceMinor,
        entity.currency,
        entity.intervalMonths,
        JSON.stringify(entity.features),
        entity.active,
      ],
    );
    return entity;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query("delete from app.plan where id = $1", [id]);
  }
}
