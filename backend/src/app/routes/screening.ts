import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { Container } from "../container";

const clientIdParam = z.object({ clientId: z.string().uuid() });

const reverseCheckBody = z.object({
  phone: z.string().min(1).nullable().default(null),
  email: z.string().min(1).nullable().default(null),
});

const offenderReportBody = z.object({
  phone: z.string().min(1).nullable().default(null),
  email: z.string().min(1).nullable().default(null),
  reason: z.string().min(1),
  reportedByAccountId: z.string().uuid(),
});

export function registerScreening(app: FastifyInstance, c: Container): void {
  app.post("/clients/:clientId/screening/request", async (req, reply) => {
    const { clientId } = clientIdParam.parse(req.params);
    const screening = await c.screeningService.requestScreening(clientId);
    void reply.status(201);
    return screening;
  });

  app.post("/clients/:clientId/screening/reference", async (req) => {
    const { clientId } = clientIdParam.parse(req.params);
    return c.screeningService.addReference(clientId);
  });

  app.post("/clients/:clientId/screening/verify", async (req) => {
    const { clientId } = clientIdParam.parse(req.params);
    return c.screeningService.markVerified(clientId);
  });

  app.get("/clients/:clientId/screening", async (req) => {
    const { clientId } = clientIdParam.parse(req.params);
    return c.screeningService.getStatus(clientId);
  });

  app.post("/reverse-check", async (req) => {
    const body = reverseCheckBody.parse(req.body);
    return c.reverseCheckerService.check(body);
  });

  app.post("/offender-reports", async (req, reply) => {
    const body = offenderReportBody.parse(req.body);
    const report = await c.reverseCheckerService.report(body);
    void reply.status(201);
    return report;
  });
}
