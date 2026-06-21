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
    // Managed Postgres (e.g. Supabase) requires TLS. Enable it for remote hosts;
    // leave local connections plain so tests against a local server still work.
    const isLocal = /@(localhost|127\.0\.0\.1|::1)[:/]/.test(conn);
    pool = new pg.Pool({
      connectionString: conn,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
      keepAlive: true,
    });
    // Managed poolers (e.g. Supabase) drop idle connections. Without an 'error'
    // listener, pg re-emits that on the pool as an unhandled 'error' event and
    // crashes the whole process. Log and let pg discard/recreate the client.
    pool.on("error", (err) => {
      console.error("[db] idle pg client error (recovering):", err.message);
    });
    return pool;
  }

  return {
    async query<R = any>(text: string, params?: unknown[]): Promise<{ rows: R[] }> {
      const result = await getPool().query(text, params as any[]);
      return { rows: result.rows as R[] };
    },
  };
}
