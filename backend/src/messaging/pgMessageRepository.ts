import type { Db, UUID } from "../core";
import type { Message, MessageStatus } from "./types";
import type { MessageRepository } from "./messageRepository";

interface MessageRow {
  id: UUID;
  conversation_id: UUID;
  sender_role: "worker" | "customer";
  body: string;
  original_body: string | null;
  status: MessageStatus;
  created_at: Date;
  updated_at: Date;
}

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderRole: row.sender_role,
    body: row.body,
    originalBody: row.original_body,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

const SELECT = `select id, conversation_id, sender_role, body, original_body, status, created_at, updated_at
   from app.message`;

export class PgMessageRepository implements MessageRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<Message | undefined> {
    const { rows } = await this.db.query<MessageRow>(`${SELECT} where id = $1`, [
      id,
    ]);
    const row = rows[0];
    return row ? toMessage(row) : undefined;
  }

  async list(): Promise<Message[]> {
    const { rows } = await this.db.query<MessageRow>(
      `${SELECT} order by created_at asc`,
    );
    return rows.map(toMessage);
  }

  async listByConversation(conversationId: UUID): Promise<Message[]> {
    const { rows } = await this.db.query<MessageRow>(
      `${SELECT} where conversation_id = $1 order by created_at asc`,
      [conversationId],
    );
    return rows.map(toMessage);
  }

  async save(entity: Message): Promise<Message> {
    await this.db.query(
      `insert into app.message
         (id, conversation_id, sender_role, body, original_body, status, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do update
         set conversation_id = excluded.conversation_id,
             sender_role = excluded.sender_role,
             body = excluded.body,
             original_body = excluded.original_body,
             status = excluded.status,
             updated_at = excluded.updated_at`,
      [
        entity.id,
        entity.conversationId,
        entity.senderRole,
        entity.body,
        entity.originalBody,
        entity.status,
        entity.createdAt,
        entity.updatedAt,
      ],
    );
    const saved = await this.getById(entity.id);
    if (!saved)
      throw new Error("PgMessageRepository.save: row not found after upsert");
    return saved;
  }

  async delete(id: UUID): Promise<void> {
    await this.db.query(`delete from app.message where id = $1`, [id]);
  }
}
