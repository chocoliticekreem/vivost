import type { IncomingMessage, ServerResponse } from "node:http";
import { buildServer } from "./app/server";
import { createPgContainer, createInMemoryContainer } from "./app/container";
import { createPgDb } from "./core/db";

/**
 * Vercel serverless entry. Bundled by scripts/build-api.mjs (esbuild) into a
 * single self-contained CommonJS file, so all relative imports are resolved at
 * build time (Node's ESM resolver never sees the extensionless source imports).
 * The Fastify app is built once at module scope and reused across warm invokes.
 */
const container = process.env.DATABASE_URL
  ? createPgContainer(createPgDb(process.env.DATABASE_URL))
  : createInMemoryContainer();

const app = buildServer(container);

let readyPromise: PromiseLike<unknown> | undefined;

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (!readyPromise) readyPromise = app.ready();
  await readyPromise;

  // Vercel routes /api/* here; backend routes have no /api prefix.
  const url = req.url ?? "/";
  if (url === "/api") {
    req.url = "/";
  } else if (url.startsWith("/api/")) {
    req.url = url.slice("/api".length);
  }

  app.server.emit("request", req, res);
}
