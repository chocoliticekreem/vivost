import type { IncomingMessage, ServerResponse } from "node:http";
import { buildServer } from "../backend/src/app/server";
import { createPgContainer, createInMemoryContainer } from "../backend/src/app/container";
import { createPgDb } from "../backend/src/core/db";

/**
 * Single Fastify app, built once at module scope and reused across warm
 * invocations. Uses the pg container when DATABASE_URL is set, otherwise the
 * in-memory container (so previews work without a database).
 */
const container = process.env.DATABASE_URL
  ? createPgContainer(createPgDb(process.env.DATABASE_URL))
  : createInMemoryContainer();

const app = buildServer(container);

let readyPromise: Promise<unknown> | undefined;

/**
 * Vercel Node serverless handler. Vercel routes `/api/*` here; the backend
 * registers routes without an `/api` prefix (`/health`, `/messaging/start`,
 * ...), so we strip a leading `/api` from the URL before handing the raw
 * request to Fastify's underlying http server.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (!readyPromise) readyPromise = app.ready();
  await readyPromise;

  const url = req.url ?? "/";
  if (url === "/api") {
    req.url = "/";
  } else if (url.startsWith("/api/")) {
    req.url = url.slice("/api".length);
  }

  app.server.emit("request", req, res);
}
