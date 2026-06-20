import type { Db, UUID } from "../core";
import type { ClientScreening } from "./types";
import type { ScreeningRepository } from "./screeningRepository";

interface ScreeningRow {
  client_id: UUID;
  verified: boolean;
  references: number;
  verified_at: Date | null;
  updated_at: Date;
}

function toScreening(row: ScreeningRow): ClientScreening {
  return {
    clientId: row.client_id,
    verified: row.verified,
    references: Number(row.references),
    verifiedAt: row.verified_at ? new Date(row.verified_at) : null,
    updatedAt: new Date(row.updated_at),
  };
}

export class PgScreeningRepository implements ScreeningRepository {
  constructor(private readonly db: Db) {}

  async getByClientId(clientId: UUID): Promise<ClientScreening | undefined> {
    const { rows } = await this.db.query<ScreeningRow>(
      `select client_id, verified, "references", verified_at, updated_at
         from app.client_screening
        where client_id = $1`,
      [clientId],
    );
    const row = rows[0];
    return row ? toScreening(row) : undefined;
  }

  async save(screening: ClientScreening): Promise<ClientScreening> {
    await this.db.query(
      `insert into app.client_screening
         (client_id, verified, "references", verified_at, updated_at)
         values ($1, $2, $3, $4, $5)
       on conflict (client_id) do update
         set verified = excluded.verified,
             "references" = excluded."references",
             verified_at = excluded.verified_at`,
      [
        screening.clientId,
        screening.verified,
        screening.references,
        screening.verifiedAt,
        screening.updatedAt,
      ],
    );
    const saved = await this.getByClientId(screening.clientId);
    if (!saved) throw new Error("PgScreeningRepository.save: row not found after upsert");
    return saved;
  }
}
