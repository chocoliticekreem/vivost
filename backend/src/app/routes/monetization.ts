import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { Container } from "../container";
import { planKeySchema, placementKindSchema } from "../../monetization";

const idParam = z.object({ id: z.string() });
const accountIdParam = z.object({ accountId: z.string() });
const listingIdParam = z.object({ listingId: z.string() });

const subscribeBody = z.object({
  accountId: z.string(),
  planKey: planKeySchema,
});

const placementBody = z.object({
  listingId: z.string(),
  kind: placementKindSchema,
  durationDays: z.number(),
  citySlug: z.string().nullable().optional(),
  categorySlug: z.string().nullable().optional(),
});

export function registerMonetization(app: FastifyInstance, c: Container): void {
  app.get("/plans", async () => {
    return c.plansService.listActive();
  });

  app.post("/subscriptions", async (req, reply) => {
    const { accountId, planKey } = subscribeBody.parse(req.body);
    const sub = await c.subscriptionsService.subscribe(accountId, planKey);
    void reply.status(201);
    return sub;
  });

  app.post("/subscriptions/:id/cancel", async (req) => {
    const { id } = idParam.parse(req.params);
    return c.subscriptionsService.cancel(id);
  });

  app.get("/accounts/:accountId/entitlements", async (req) => {
    const { accountId } = accountIdParam.parse(req.params);
    return c.subscriptionsService.resolveEntitlements(accountId);
  });

  app.post("/placements", async (req, reply) => {
    const { listingId, kind, durationDays, citySlug, categorySlug } =
      placementBody.parse(req.body);
    const placement = await c.placementsService.purchase(listingId, kind, durationDays, {
      citySlug,
      categorySlug,
    });
    void reply.status(201);
    return placement;
  });

  app.get("/listings/:listingId/placements", async (req) => {
    const { listingId } = listingIdParam.parse(req.params);
    return c.placementsService.activeFor(listingId, c.clock.now());
  });
}
