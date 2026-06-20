import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { Container } from "../container";

const htmlPath = fileURLToPath(new URL("../../../public/chat-tester.html", import.meta.url));

/**
 * Serves the standalone chat-moderation tester UI from the API itself, so the
 * page and the endpoints it calls share an origin (no CORS edge cases). Read at
 * request time so edits to the HTML show up without a server restart. Dev tool.
 */
export function registerDevUi(app: FastifyInstance, _c: Container): void {
  const serve = (_req: unknown, reply: FastifyReply): string => {
    void reply.header("content-type", "text/html; charset=utf-8");
    return readFileSync(htmlPath, "utf8");
  };
  app.get("/", serve);
  app.get("/chat", serve);
}
