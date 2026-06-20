import type { Db, UUID } from "../core";
import type { AnalyticsEvent, AnalyticsEventType } from "./types";
import type { AnalyticsRepository } from "./analyticsRepository";

interface EventRow {
  id: UUID;
  listing_id: UUID;
  type: AnalyticsEventType;
  at: Date;
  session_hash: string | null;
}

function toEvent(row: EventRow): AnalyticsEvent {
  return {
    id: row.id,
    listingId: row.listing_id,
    type: row.type,
    at: new Date(row.at),
    sessionHash: row.session_hash,
  };
}

/**
 * Postgres adapter for app.analytics_event. Stores no PII; session_hash is a
 * one-way hash only. listing_id references app.listing ON DELETE CASCADE.
 */
export class PgAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<AnalyticsEvent | undefined> {
    const { rows } = await this.db.query<EventRow>(
      `select id, listing_id, type, at, session_hash
         from app.analytics_event
        where id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toEvent(row) : undefined;
  }

  async list(): Promise<AnalyticsEvent[]> {
    const { rows } = await this.db.query<EventRow>(
      `select id, listing_id, type, at, session_hash
         from app.analytics_event
        order by at asc`,
    );
    return rows.map(toEvent);
  }

  async save(entity: AnalyticsEvent): Promise<AnalyticsEvent> {
    await this.db.query(
      `insert into app.analytics_event (id, listing_id, type, at, session_hash)
         values ($1, $2, $3, $4, $5)
       on conflict (id) do update
         set listing_id = excluded.listing_id,
             type = excluded.type,
             at = excluded.at,
             session_hash = excluded.session_hash`,
      [entity.id, entity.listingId, entity.type, entity.at, entity.sessionHash ?? null],
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgAnalyticsRepository.save: row not found after upsert");
    return saved;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query(`delete from app.analytics_event where id = $1`, [id]);
  }

  async countByType(
    listingId: string,
  ): Promise<Record<AnalyticsEventType, number>> {
    const { rows } = await this.db.query<{ type: AnalyticsEventType; count: string }>(
      `select type, count(*)::text as count
         from app.analytics_event
        where listing_id = $1
        group by type`,
      [listingId],
    );
    const counts: Record<AnalyticsEventType, number> = {
      view: 0,
      contact: 0,
      conversion: 0,
    };
    for (const row of rows) counts[row.type] = Number(row.count);
    return counts;
  }

  async viewCountsByListing(): Promise<{ listingId: string; views: number }[]> {
    const { rows } = await this.db.query<{ listing_id: UUID; views: string }>(
      `select listing_id, count(*)::text as views
         from app.analytics_event
        where type = 'view'
        group by listing_id
        order by count(*) desc`,
    );
    return rows.map((r) => ({ listingId: r.listing_id, views: Number(r.views) }));
  }
}
