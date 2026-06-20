import type { FastifyInstance } from "fastify";
import type { Container } from "../container";

export function registerHealth(app: FastifyInstance, _c: Container): void {
  app.get("/health", async () => ({ status: "ok" }));
  app.get("/ready", async () => ({ status: "ok" }));
}
