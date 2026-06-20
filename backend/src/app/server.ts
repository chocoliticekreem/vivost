import Fastify from "fastify";
import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import type { Container } from "./container";
import { registerErrorHandler } from "./errors";
import { allRegistrars } from "./routes";

/**
 * Builds the Fastify app from a container. Registers CORS (open origin for the
 * localhost UI), the error handler, and every route registrar. Does NOT listen.
 */
export function buildServer(c: Container): FastifyInstance {
  const app = Fastify({ logger: false });

  void app.register(cors, { origin: true });
  registerErrorHandler(app);

  for (const register of allRegistrars) {
    register(app, c);
  }

  return app;
}
