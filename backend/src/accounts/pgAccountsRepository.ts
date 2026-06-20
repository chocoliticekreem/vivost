import { normaliseEmail } from "../core";
import type { Db, UUID } from "../core";
import type { Account, AccountRole, AccountStatus } from "./types";
import type { AccountsRepository } from "./accountsRepository";

interface AccountRow {
  id: UUID;
  email: string;
  role: AccountRole;
  status: AccountStatus;
  created_at: Date;
  updated_at: Date;
}

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Postgres adapter. The email is GDPR-separated into identity.account; the
 * app.account row holds role/status only and references identity.account by the
 * same UUID. delete() removes the identity row, which cascades to app.account.
 */
export class PgAccountsRepository implements AccountsRepository {
  constructor(private readonly db: Db) {}

  async getById(id: UUID): Promise<Account | undefined> {
    const { rows } = await this.db.query<AccountRow>(
      `select a.id, i.email, a.role, a.status, a.created_at, a.updated_at
         from app.account a
         join identity.account i on i.id = a.id
        where a.id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toAccount(row) : undefined;
  }

  async list(): Promise<Account[]> {
    const { rows } = await this.db.query<AccountRow>(
      `select a.id, i.email, a.role, a.status, a.created_at, a.updated_at
         from app.account a
         join identity.account i on i.id = a.id
        order by a.created_at asc`,
    );
    return rows.map(toAccount);
  }

  async findByEmail(email: string): Promise<Account | undefined> {
    const { rows } = await this.db.query<AccountRow>(
      `select a.id, i.email, a.role, a.status, a.created_at, a.updated_at
         from app.account a
         join identity.account i on i.id = a.id
        where i.email = $1`,
      [normaliseEmail(email)],
    );
    const row = rows[0];
    return row ? toAccount(row) : undefined;
  }

  async save(entity: Account): Promise<Account> {
    await this.db.query(
      `insert into identity.account (id, email, created_at)
         values ($1, $2, $3)
       on conflict (id) do update set email = excluded.email`,
      [entity.id, entity.email != null ? normaliseEmail(entity.email) : null, entity.createdAt],
    );
    await this.db.query(
      `insert into app.account (id, role, status, created_at, updated_at)
         values ($1, $2, $3, $4, $5)
       on conflict (id) do update
         set role = excluded.role,
             status = excluded.status`,
      [entity.id, entity.role, entity.status, entity.createdAt, entity.updatedAt],
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgAccountsRepository.save: row not found after upsert");
    return saved;
  }

  async delete(id: UUID): Promise<void> {
    // Hard erasure: delete the identity root row; cascades to app.account.
    await this.db.query(`delete from identity.account where id = $1`, [id]);
  }
}
