import pg from "pg";

export interface Db {
  query<R = any>(text: string, params?: unknown[]): Promise<{ rows: R[] }>;
}

/**
 * Creates a Db backed by a lazily-constructed pg Pool. The pool is only
 * created on first query, using the provided connection string or
 * process.env.DATABASE_URL. Throws a clear error if neither is available.
 */
export function createPgDb(connectionString?: string): Db {
  let pool: pg.Pool | undefined;

  function getPool(): pg.Pool {
    if (pool) return pool;
    const conn = connectionString ?? process.env.DATABASE_URL;
    if (!conn) {
      throw new Error(
        "createPgDb: no connection string provided and DATABASE_URL is not set",
      );
    }
    pool = new pg.Pool({ connectionString: conn });
    return pool;
  }

  return {
    async query<R = any>(text: string, params?: unknown[]): Promise<{ rows: R[] }> {
      const result = await getPool().query(text, params as any[]);
      return { rows: result.rows as R[] };
    },
  };
}
