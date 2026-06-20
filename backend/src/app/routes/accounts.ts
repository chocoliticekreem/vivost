import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { registerAccountSchema } from "../../accounts";
import type { Container } from "../container";

const idParam = z.object({ id: z.string().uuid() });

export function registerAccounts(app: FastifyInstance, c: Container): void {
  app.post("/accounts", async (req, reply) => {
    const input = registerAccountSchema.parse(req.body);
    const account = await c.accountsService.register(input);
    void reply.status(201);
    return account;
  });

  app.get("/accounts/:id", async (req) => {
    const { id } = idParam.parse(req.params);
    return c.accountsService.getById(id);
  });

  app.post("/accounts/:id/suspend", async (req) => {
    const { id } = idParam.parse(req.params);
    return c.accountsService.suspend(id);
  });

  app.post("/accounts/:id/reactivate", async (req) => {
    const { id } = idParam.parse(req.params);
    return c.accountsService.reactivate(id);
  });

  app.delete("/accounts/:id", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    await c.accountsService.deleteAccount(id);
    void reply.status(204);
  });
}
