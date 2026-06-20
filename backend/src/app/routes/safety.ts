import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { Container } from "../container";

const badDateReportBody = z.object({
  reporterAccountId: z.string().uuid(),
  phone: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
  description: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
});

const searchBody = z.object({
  phone: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
});

const reverseReviewBody = z.object({
  reviewerAccountId: z.string().uuid(),
  clientContact: z.string().min(1),
  rating: z.number().int(),
  comment: z.string(),
});

const reverseReviewQuery = z.object({ contact: z.string().min(1) });

const trustedContactBody = z.object({
  accountId: z.string().uuid(),
  name: z.string().min(1),
  contact: z.string().min(1),
});

const checkInBody = z.object({
  accountId: z.string().uuid(),
  trustedContactId: z.string().uuid(),
  durationMinutes: z.number(),
});

const checkInIdParam = z.object({ id: z.string().uuid() });

export function registerSafety(app: FastifyInstance, c: Container): void {
  app.post("/safety/bad-date-reports", async (req, reply) => {
    const body = badDateReportBody.parse(req.body);
    const report = await c.badDateService.report(body);
    void reply.status(201);
    return report;
  });

  app.get("/safety/bad-date-reports", async () => {
    return c.badDateService.listForVerifiedProvider();
  });

  app.post("/safety/bad-date-reports/search", async (req) => {
    const body = searchBody.parse(req.body);
    return c.badDateService.search(body);
  });

  app.post("/safety/reverse-reviews", async (req, reply) => {
    const body = reverseReviewBody.parse(req.body);
    const review = await c.reverseReviewService.add(body);
    void reply.status(201);
    return review;
  });

  app.get("/safety/reverse-reviews", async (req) => {
    const { contact } = reverseReviewQuery.parse(req.query);
    const [reviews, average] = await Promise.all([
      c.reverseReviewService.forClient({ contact }),
      c.reverseReviewService.averageRating({ contact }),
    ]);
    return { reviews, average };
  });

  app.post("/safety/trusted-contacts", async (req, reply) => {
    const body = trustedContactBody.parse(req.body);
    const contact = await c.trustedContactService.add(body);
    void reply.status(201);
    return contact;
  });

  app.post("/safety/check-ins", async (req, reply) => {
    const body = checkInBody.parse(req.body);
    const session = await c.checkInService.start(body);
    void reply.status(201);
    return session;
  });

  app.post("/safety/check-ins/:id/safe", async (req) => {
    const { id } = checkInIdParam.parse(req.params);
    return c.checkInService.markSafe(id);
  });

  app.post("/safety/check-ins/:id/panic", async (req) => {
    const { id } = checkInIdParam.parse(req.params);
    return c.checkInService.triggerPanic(id);
  });

  app.post("/safety/check-ins/evaluate-overdue", async () => {
    return c.checkInService.evaluateOverdue(c.clock.now());
  });
}
