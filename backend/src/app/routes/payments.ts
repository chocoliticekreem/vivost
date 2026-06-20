import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { Container } from "../container";

const idParam = z.object({ id: z.string().uuid() });

const checkoutBody = z.object({
  accountId: z.string().uuid(),
  kind: z.enum(["subscription", "boost", "verification", "deposit"]),
  amountMinor: z.number().int(),
  currency: z.string(),
  reference: z.string(),
});

const settleBody = z.object({ checkoutId: z.string() });
const refundBody = z.object({ amountMinor: z.number().int().optional() });

export function registerPayments(app: FastifyInstance, c: Container): void {
  app.post("/payments/checkout", async (req, reply) => {
    const { accountId, kind, amountMinor, currency, reference } = checkoutBody.parse(req.body);
    const result = await c.paymentsService.createCheckout(
      accountId,
      kind,
      amountMinor,
      currency,
      reference,
    );
    void reply.status(201);
    return result;
  });

  app.post("/payments/settle", async (req) => {
    const { checkoutId } = settleBody.parse(req.body);
    return c.paymentsService.settle(checkoutId);
  });

  app.post("/payments/:id/refund", async (req) => {
    const { id } = idParam.parse(req.params);
    const { amountMinor } = refundBody.parse(req.body ?? {});
    return c.paymentsService.refund(id, amountMinor);
  });

  app.post("/payments/webhook", async (req) => {
    const signature = req.headers["x-webhook-signature"];
    const payload = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? "");
    const valid = c.paymentsService.verifyWebhook(
      payload,
      typeof signature === "string" ? signature : "",
    );
    return { valid };
  });
}
