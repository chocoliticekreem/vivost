import type { Db, UUID } from "../core";
import type { Rating, ReverseReview } from "./types";
import type { ReverseReviewRepository } from "./reverseReviewRepository";

interface ReverseReviewRow {
  id: string;
  reviewer_account_id: string;
  client_contact_hash: string;
  rating: number | string;
  comment: string;
  created_at: Date;
}

function toReview(row: ReverseReviewRow): ReverseReview {
  return {
    id: row.id,
    reviewerAccountId: row.reviewer_account_id,
    clientContactHash: row.client_contact_hash,
    rating: Number(row.rating) as Rating,
    comment: row.comment,
    createdAt: new Date(row.created_at),
  };
}

export class PgReverseReviewRepository implements ReverseReviewRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<ReverseReview | undefined> {
    const { rows } = await this.db.query<ReverseReviewRow>(
      "select * from app.reverse_review where id = $1",
      [id],
    );
    return rows[0] ? toReview(rows[0]) : undefined;
  }

  async list(): Promise<ReverseReview[]> {
    const { rows } = await this.db.query<ReverseReviewRow>(
      "select * from app.reverse_review order by created_at desc",
    );
    return rows.map(toReview);
  }

  async findByContactHash(contactHash: string): Promise<ReverseReview[]> {
    const { rows } = await this.db.query<ReverseReviewRow>(
      "select * from app.reverse_review where client_contact_hash = $1 order by created_at desc",
      [contactHash],
    );
    return rows.map(toReview);
  }

  async save(entity: ReverseReview): Promise<ReverseReview> {
    await this.db.query(
      `insert into app.reverse_review
         (id, reviewer_account_id, client_contact_hash, rating, comment, created_at)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update set
         reviewer_account_id = excluded.reviewer_account_id,
         client_contact_hash = excluded.client_contact_hash,
         rating = excluded.rating,
         comment = excluded.comment`,
      [
        entity.id,
        entity.reviewerAccountId,
        entity.clientContactHash,
        entity.rating,
        entity.comment,
        entity.createdAt,
      ],
    );
    return entity;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query("delete from app.reverse_review where id = $1", [id]);
  }
}
