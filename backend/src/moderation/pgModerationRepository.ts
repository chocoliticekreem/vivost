import type { Db, UUID } from "../core";
import type { ModerationAction, ModerationCategory } from "../core";
import type { ModerationVerdict } from "./types";
import type { ModerationRepository } from "./moderationRepository";

interface VerdictRow {
  id: UUID;
  message_id: UUID;
  conversation_id: UUID;
  tier: number;
  categories: string[];
  score: string | number;
  action: ModerationAction;
  reason: string;
  excerpt: string | null;
  needs_review: boolean;
  review_status: "open" | "actioned" | "dismissed";
  created_at: Date;
  updated_at: Date;
}

function toVerdict(row: VerdictRow): ModerationVerdict {
  return {
    id: row.id,
    messageId: row.message_id,
    conversationId: row.conversation_id,
    tier: row.tier as 1 | 2,
    categories: row.categories as ModerationCategory[],
    score: Number(row.score),
    action: row.action,
    reason: row.reason,
    excerpt: row.excerpt,
    needsReview: row.needs_review,
    reviewStatus: row.review_status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

const SELECT = `select id, message_id, conversation_id, tier, categories, score,
                       action, reason, excerpt, needs_review, review_status,
                       created_at, updated_at
                  from app.moderation_verdict`;

export class PgModerationRepository implements ModerationRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<ModerationVerdict | undefined> {
    const { rows } = await this.db.query<VerdictRow>(`${SELECT} where id = $1`, [id]);
    const row = rows[0];
    return row ? toVerdict(row) : undefined;
  }

  async list(): Promise<ModerationVerdict[]> {
    const { rows } = await this.db.query<VerdictRow>(`${SELECT} order by created_at asc`);
    return rows.map(toVerdict);
  }

  async listByMessage(messageId: UUID): Promise<ModerationVerdict[]> {
    const { rows } = await this.db.query<VerdictRow>(
      `${SELECT} where message_id = $1 order by created_at asc`,
      [messageId],
    );
    return rows.map(toVerdict);
  }

  async listQueue(): Promise<ModerationVerdict[]> {
    const { rows } = await this.db.query<VerdictRow>(
      `${SELECT} where needs_review and review_status = 'open' order by created_at desc`,
    );
    return rows.map(toVerdict);
  }

  async save(entity: ModerationVerdict): Promise<ModerationVerdict> {
    await this.db.query(
      `insert into app.moderation_verdict
         (id, message_id, conversation_id, tier, categories, score, action,
          reason, excerpt, needs_review, review_status, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       on conflict (id) do update
         set tier = excluded.tier,
             categories = excluded.categories,
             score = excluded.score,
             action = excluded.action,
             reason = excluded.reason,
             excerpt = excluded.excerpt,
             needs_review = excluded.needs_review,
             review_status = excluded.review_status,
             updated_at = excluded.updated_at`,
      [
        entity.id,
        entity.messageId,
        entity.conversationId,
        entity.tier,
        entity.categories,
        entity.score,
        entity.action,
        entity.reason,
        entity.excerpt,
        entity.needsReview,
        entity.reviewStatus,
        entity.createdAt,
        entity.updatedAt,
      ],
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgModerationRepository.save: row not found after upsert");
    return saved;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query(`delete from app.moderation_verdict where id = $1`, [id]);
  }
}
