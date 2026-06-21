import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { Container } from "../container";

/**
 * Candidate locations for the tester HTML, computed lazily at request time.
 * The import.meta.url path works in local dev (tsx) where the file sits next to
 * the source tree; the cwd-relative paths cover Vercel, where the function runs
 * from the project root and the file is bundled via `includeFiles`. The
 * import.meta.url candidate is guarded because esbuild's bundled CJS output can
 * leave it unusable as a URL base — falling back to the cwd paths.
 */
function htmlCandidates(): string[] {
  const candidates: string[] = [];
  try {
    candidates.push(
      fileURLToPath(new URL("../../../public/chat-tester.html", import.meta.url)),
    );
  } catch {
    // import.meta.url not usable here (bundled function) — use cwd paths.
  }
  candidates.push(path.join(process.cwd(), "backend/public/chat-tester.html"));
  candidates.push(path.join(process.cwd(), "public/chat-tester.html"));
  return candidates;
}

function readTesterHtml(): string {
  const candidates = htmlCandidates();
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return readFileSync(candidate, "utf8");
    }
  }
  throw new Error(
    `chat-tester.html not found; looked in: ${candidates.join(", ")}`,
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
