import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { sendMessageSchema, startConversationSchema } from "../../messaging";
import type { Container } from "../container";

const idParam = z.object({ id: z.string().uuid() });

export function registerMessaging(app: FastifyInstance, c: Container): void {
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
    const message = await c.messagingService.sendMessage({
      conversationId: id,
      ...input,
    });
    void reply.status(201);
    return message;
  });
}
