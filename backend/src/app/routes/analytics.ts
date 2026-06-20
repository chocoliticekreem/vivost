import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { Container } from "../container";

const listingIdParam = z.object({ listingId: z.string().uuid() });

const eventBody = z.object({
  listingId: z.string().uuid(),
  type: z.enum(["view", "contact", "conversion"]),
  sessionHash: z.string().nullable().optional(),
});

const topQuery = z.object({
  limit: z.coerce.number().int().positive().optional(),
});

export function registerAnalytics(app: FastifyInstance, c: Container): void {
  app.post("/analytics/events", async (req, reply) => {
    const { listingId, type, sessionHash } = eventBody.parse(req.body);
    const event = await c.analyticsService.record(listingId, type, sessionHash);
    void reply.status(201);
    return event;
  });

  app.get("/listings/:listingId/analytics", async (req) => {
    const { listingId } = listingIdParam.parse(req.params);
    return c.analyticsService.funnelFor(listingId);
  });

  app.get("/analytics/top", async (req) => {
    const { limit } = topQuery.parse(req.query);
    return c.analyticsService.topListings(limit ?? 10);
  });
}
