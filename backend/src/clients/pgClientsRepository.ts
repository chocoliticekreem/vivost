import { normaliseEmail } from "../core";
import type { Db, UUID } from "../core";
import type { Client, ClientStatus } from "./types";
import type { ClientsRepository } from "./clientsRepository";

interface ClientRow {
  id: UUID;
  email: string;
  status: ClientStatus;
  created_at: Date;
  updated_at: Date;
}

function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Postgres adapter. The email is GDPR-separated into identity.client; the
 * app.client row holds status only and references identity.client by the same
 * UUID. delete() removes the identity row, which cascades to app.client.
 */
export class PgClientsRepository implements ClientsRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<Client | undefined> {
    const { rows } = await this.db.query<ClientRow>(
      `select c.id, i.email, c.status, c.created_at, c.updated_at
         from app.client c
         join identity.client i on i.id = c.id
        where c.id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toClient(row) : undefined;
  }

  async list(): Promise<Client[]> {
    const { rows } = await this.db.query<ClientRow>(
      `select c.id, i.email, c.status, c.created_at, c.updated_at
         from app.client c
         join identity.client i on i.id = c.id
        order by c.created_at asc`,
    );
    return rows.map(toClient);
  }

  async findByEmail(email: string): Promise<Client | undefined> {
    const { rows } = await this.db.query<ClientRow>(
      `select c.id, i.email, c.status, c.created_at, c.updated_at
         from app.client c
         join identity.client i on i.id = c.id
        where i.email = $1`,
      [normaliseEmail(email)],
    );
    const row = rows[0];
    return row ? toClient(row) : undefined;
  }

  async save(entity: Client): Promise<Client> {
    await this.db.query(
      `insert into identity.client (id, email, created_at)
         values ($1, $2, $3)
       on conflict (id) do update set email = excluded.email`,
      [entity.id, entity.email != null ? normaliseEmail(entity.email) : null, entity.createdAt],
    );
    await this.db.query(
      `insert into app.client (id, status, created_at, updated_at)
         values ($1, $2, $3, $4)
       on conflict (id) do update
         set status = excluded.status`,
      [entity.id, entity.status, entity.createdAt, entity.updatedAt],
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgClientsRepository.save: row not found after upsert");
    return saved;
  }

  async delete(id: UUID): Promise<void> {
    // Hard erasure: delete the identity root row; cascades to app.client.
    await this.db.query(`delete from identity.client where id = $1`, [id]);
  }
}
