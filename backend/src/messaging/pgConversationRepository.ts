import type { Db, UUID } from "../core";
import type { Conversation } from "./types";
import type { ConversationRepository } from "./conversationRepository";

interface ConversationRow {
  id: UUID;
  account_id: UUID;
  client_id: UUID;
  listing_id: UUID | null;
  status: "open" | "closed";
  created_at: Date;
  updated_at: Date;
}

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    accountId: row.account_id,
    clientId: row.client_id,
    listingId: row.listing_id,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

const SELECT = `select id, account_id, client_id, listing_id, status, created_at, updated_at
   from app.conversation`;

export class PgConversationRepository implements ConversationRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<Conversation | undefined> {
    const { rows } = await this.db.query<ConversationRow>(
      `${SELECT} where id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toConversation(row) : undefined;
  }

  async list(): Promise<Conversation[]> {
    const { rows } = await this.db.query<ConversationRow>(
      `${SELECT} order by created_at asc`,
    );
    return rows.map(toConversation);
  }

  async findByParticipants(
    accountId: UUID,
    clientId: UUID,
    listingId: UUID | null,
  ): Promise<Conversation | undefined> {
    const { rows } = await this.db.query<ConversationRow>(
      `${SELECT}
         where account_id = $1
           and client_id = $2
           and listing_id is not distinct from $3`,
      [accountId, clientId, listingId],
    );
    const row = rows[0];
    return row ? toConversation(row) : undefined;
  }

  async save(entity: Conversation): Promise<Conversation> {
    await this.db.query(
      `insert into app.conversation
         (id, account_id, client_id, listing_id, status, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update
         set account_id = excluded.account_id,
             client_id = excluded.client_id,
             listing_id = excluded.listing_id,
             status = excluded.status,
             updated_at = excluded.updated_at`,
      [
        entity.id,
        entity.accountId,
        entity.clientId,
        entity.listingId,
        entity.status,
        entity.createdAt,
        entity.updatedAt,
      ],
    );
    const saved = await this.getById(entity.id);
    if (!saved)
      throw new Error("PgConversationRepository.save: row not found after upsert");
    return saved;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query(`delete from app.conversation where id = $1`, [id]);
  }
}
