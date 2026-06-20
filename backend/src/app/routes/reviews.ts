import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { submitReviewSchema } from "../../reviews";
import type { Container } from "../container";

const idParam = z.object({ id: z.string().uuid() });
const listingIdParam = z.object({ listingId: z.string().uuid() });

export function registerReviews(app: FastifyInstance, c: Container): void {
  app.post("/reviews", async (req, reply) => {
    const input = submitReviewSchema.parse(req.body);
    const review = await c.reviewsService.submit(input);
    void reply.status(201);
    return review;
  });

  app.get("/listings/:listingId/reviews", async (req) => {
    const { listingId } = listingIdParam.parse(req.params);
    const [reviews, average] = await Promise.all([
      c.reviewsService.listForListing(listingId),
      c.reviewsService.averageRating(listingId),
    ]);
    return { reviews, average };
  });

  app.post("/reviews/:id/remove", async (req) => {
    const { id } = idParam.parse(req.params);
    return c.reviewsService.moderateRemove(id);
  });
}
