import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { Container } from "../container";

/**
 * Candidate locations for the tester HTML. The import.meta.url path works in
 * local dev (tsx) where the file sits next to the source tree; the cwd-relative
 * paths cover Vercel, where the function runs from the project root and the
 * file is bundled via `includeFiles: backend/public/**`.
 */
const htmlCandidates = [
  fileURLToPath(new URL("../../../public/chat-tester.html", import.meta.url)),
  path.join(process.cwd(), "backend/public/chat-tester.html"),
  path.join(process.cwd(), "public/chat-tester.html"),
];

function readTesterHtml(): string {
  for (const candidate of htmlCandidates) {
    if (existsSync(candidate)) {
      return readFileSync(candidate, "utf8");
    }
  }
  throw new Error(
    `chat-tester.html not found; looked in: ${htmlCandidates.join(", ")}`,
  );
}

/**
 * Serves the standalone chat-moderation tester UI from the API itself, so the
 * page and the endpoints it calls share an origin (no CORS edge cases). Read at
 * request time so edits to the HTML show up without a server restart. Dev tool.
 */
export function registerDevUi(app: FastifyInstance, _c: Container): void {
  const serve = (_req: unknown, reply: FastifyReply): string => {
    void reply.header("content-type", "text/html; charset=utf-8");
    return readTesterHtml();
  };
  app.get("/", serve);
  app.get("/chat", serve);
}
