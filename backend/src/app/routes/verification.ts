import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { Container } from "../container";

const idParam = z.object({ id: z.string().uuid() });
const subjectIdParam = z.object({ subjectId: z.string().uuid() });

const startBody = z.object({
  subjectId: z.string().uuid(),
  subjectType: z.enum(["account", "listing"]),
  method: z.enum(["photo_id", "facial_age_estimation", "open_banking", "credit_card", "mno"]),
});

export function registerVerification(app: FastifyInstance, c: Container): void {
  app.post("/verification", async (req, reply) => {
    const { subjectId, subjectType, method } = startBody.parse(req.body);
    const record = await c.verificationService.startVerification(subjectId, subjectType, method);
    void reply.status(201);
    return record;
  });

  app.post("/verification/:id/refresh", async (req) => {
    const { id } = idParam.parse(req.params);
    return c.verificationService.refreshResult(id);
  });

  app.get("/verification/subject/:subjectId", async (req) => {
    const { subjectId } = subjectIdParam.parse(req.params);
    return {
      isVerified: await c.verificationService.isVerified(subjectId),
      status: await c.verificationService.latestStatus(subjectId),
      badge: await c.verificationService.badgeFor(subjectId),
    };
  });
}
