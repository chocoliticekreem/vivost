import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPgDb } from "./db";

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "migrations");

const CREATE_MIGRATIONS_TABLE = `
  create table if not exists public.schema_migrations (
    filename text primary key,
    applied_at timestamptz not null default now()
  );
`;

export async function runMigrations(connectionString?: string): Promise<void> {
  const conn = connectionString ?? process.env.DATABASE_URL;
  if (!conn) {
    console.log("DATABASE_URL is not set — skipping migrations (this is safe).");
    return;
  }

  const db = createPgDb(conn);
  await db.query(CREATE_MIGRATIONS_TABLE);

  const { rows } = await db.query<{ filename: string }>(
    "select filename from public.schema_migrations",
  );
  const applied = new Set(rows.map((r) => r.filename));

  const entries = await readdir(MIGRATIONS_DIR);
  const files = entries.filter((f) => f.endsWith(".sql")).sort();

  for (const filename of files) {
    if (applied.has(filename)) continue;
    const sql = await readFile(join(MIGRATIONS_DIR, filename), "utf8");
    console.log(`Applying migration: ${filename}`);
    await db.query("begin");
    try {
      await db.query(sql);
      await db.query("insert into public.schema_migrations (filename) values ($1)", [filename]);
      await db.query("commit");
    } catch (err) {
      await db.query("rollback");
      throw err;
    }
  }

  console.log("Migrations up to date.");
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  runMigrations().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
