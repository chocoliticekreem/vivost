import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { createListingSchema, updateListingSchema } from "../../listings";
import type { Container } from "../container";

const idParam = z.object({ id: z.string().uuid() });
const accountIdParam = z.object({ accountId: z.string().uuid() });

const createBody = createListingSchema.extend({ ownerAccountId: z.string().uuid() });
const patchBody = z.object({
  actorAccountId: z.string().uuid(),
  patch: updateListingSchema,
});
const actorBody = z.object({ actorAccountId: z.string().uuid() });

export function registerListings(app: FastifyInstance, c: Container): void {
  app.get("/listings", async () => {
    return c.listingsService.listActive();
  });

  app.get("/listings/:id", async (req) => {
    const { id } = idParam.parse(req.params);
    return c.listingsService.getById(id);
  });

  app.post("/listings", async (req, reply) => {
    const { ownerAccountId, ...createInput } = createBody.parse(req.body);
    const listing = await c.listingsService.create(ownerAccountId, createInput);
    void reply.status(201);
    return listing;
  });

  app.patch("/listings/:id", async (req) => {
    const { id } = idParam.parse(req.params);
    const { actorAccountId, patch } = patchBody.parse(req.body);
    return c.listingsService.update(actorAccountId, id, patch);
  });

  app.post("/listings/:id/publish", async (req) => {
    const { id } = idParam.parse(req.params);
    const { actorAccountId } = actorBody.parse(req.body);
    return c.listingsService.publish(actorAccountId, id);
  });

  app.post("/listings/:id/suspend", async (req) => {
    const { id } = idParam.parse(req.params);
    const { actorAccountId } = actorBody.parse(req.body);
    return c.listingsService.suspend(actorAccountId, id);
  });

  app.post("/listings/:id/remove", async (req) => {
    const { id } = idParam.parse(req.params);
    const { actorAccountId } = actorBody.parse(req.body);
    return c.listingsService.remove(actorAccountId, id);
  });

  app.get("/accounts/:accountId/listings", async (req) => {
    const { accountId } = accountIdParam.parse(req.params);
    return c.listingsService.listByOwner(accountId);
  });
}
