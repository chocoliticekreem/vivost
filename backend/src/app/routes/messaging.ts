import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { sendMessageSchema, startConversationSchema } from "../../messaging";
import type { Container } from "../container";

const idParam = z.object({ id: z.string().uuid() });

const startSchema = z.object({
  workerRef: z.string().min(1),
  workerName: z.string().nullable().default(null),
  customerEmail: z.string().email(),
});

export function registerMessaging(app: FastifyInstance, c: Container): void {
  app.post("/messaging/start", async (req, reply) => {
    const { workerRef, customerEmail } = startSchema.parse(req.body);
    const worker = await c.accountsService.ensureByEmail(
      `worker.${workerRef}@vivost.local`,
      "advertiser",
    );
    const customer = await c.clientsService.ensureByEmail(customerEmail);
    const conversation = await c.messagingService.startConversation({
      accountId: worker.id,
      clientId: customer.id,
      listingId: null,
    });
    void reply.status(201);
    return {
      conversationId: conversation.id,
      customerId: customer.id,
      workerId: worker.id,
    };
  });

  app.post("/conversations", async (req, reply) => {
    const input = startConversationSchema.parse(req.body);
    const conversation = await c.messagingService.startConversation(input);
    void reply.status(201);
    return conversation;
  });

  app.get("/conversations/:id", async (req) => {
    const { id } = idParam.parse(req.params);
    return c.messagingService.getConversation(id);
  });

  app.get("/conversations/:id/messages", async (req) => {
    const { id } = idParam.parse(req.params);
    return c.messagingService.listMessages(id);
  });

  app.post("/conversations/:id/messages", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const input = sendMessageSchema.parse(req.body);
    const result = await c.messagingService.sendMessage({
      conversationId: id,
      ...input,
    });
    void reply.status(201);
    return result;
  });
}
