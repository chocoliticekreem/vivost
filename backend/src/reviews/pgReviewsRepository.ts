import type { Db, UUID } from "../core";
import type { Review, ReviewRating, ReviewStatus } from "./types";
import type { ReviewsRepository } from "./reviewsRepository";

interface ReviewRow {
  id: UUID;
  listing_id: UUID;
  client_id: UUID;
  rating: number | string;
  comment: string;
  status: string;
  created_at: Date | string;
}

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    listingId: row.listing_id,
    clientId: row.client_id,
    rating: Number(row.rating) as ReviewRating,
    comment: row.comment,
    status: row.status as ReviewStatus,
    createdAt: new Date(row.created_at),
  };
}

export class PgReviewsRepository implements ReviewsRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<Review | undefined> {
    const { rows } = await this.db.query<ReviewRow>(
      "select * from app.review where id = $1",
      [id],
    );
    const row = rows[0];
    return row ? toReview(row) : undefined;
  }

  async list(): Promise<Review[]> {
    const { rows } = await this.db.query<ReviewRow>(
      "select * from app.review order by created_at asc",
    );
    return rows.map(toReview);
  }

  async findByListing(listingId: UUID): Promise<Review[]> {
    const { rows } = await this.db.query<ReviewRow>(
      "select * from app.review where listing_id = $1 order by created_at asc",
      [listingId],
    );
    return rows.map(toReview);
  }

  async save(entity: Review): Promise<Review> {
    await this.db.query(
      `insert into app.review
         (id, listing_id, client_id, rating, comment, status, created_at)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set
         status = excluded.status`,
      [
        entity.id,
        entity.listingId,
        entity.clientId,
        entity.rating,
        entity.comment,
        entity.status,
        entity.createdAt,
      ],
    );
    const saved = await this.getById(entity.id);
    if (!saved) {
      throw new Error("PgReviewsRepository.save: row not found after upsert");
    }
    return saved;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query("delete from app.review where id = $1", [id]);
  }
}
