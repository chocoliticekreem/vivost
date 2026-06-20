import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { registerClientSchema } from "../../clients";
import type { Container } from "../container";

const idParam = z.object({ id: z.string().uuid() });

export function registerClients(app: FastifyInstance, c: Container): void {
  app.post("/clients", async (req, reply) => {
    const input = registerClientSchema.parse(req.body);
    const client = await c.clientsService.register(input);
    void reply.status(201);
    return client;
  });

  app.get("/clients/:id", async (req) => {
    const { id } = idParam.parse(req.params);
    return c.clientsService.getById(id);
  });

  app.post("/clients/:id/suspend", async (req) => {
    const { id } = idParam.parse(req.params);
    return c.clientsService.suspend(id);
  });

  app.delete("/clients/:id", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    await c.clientsService.deleteClient(id);
    void reply.status(204);
  });
}
