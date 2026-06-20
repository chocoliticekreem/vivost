import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { resolveVerdictSchema } from "../../moderation";
import type { Container } from "../container";

const idParam = z.object({ id: z.string().uuid() });
const messageIdParam = z.object({ messageId: z.string().uuid() });

export function registerModeration(app: FastifyInstance, c: Container): void {
  app.get("/moderation/queue", async () => {
    return c.moderationService.listQueue();
  });

  app.get("/moderation/messages/:messageId/verdicts", async (req) => {
    const { messageId } = messageIdParam.parse(req.params);
    return c.moderationService.listByMessage(messageId);
  });

  app.post("/moderation/verdicts/:id/resolve", async (req) => {
    const { id } = idParam.parse(req.params);
    const { status } = resolveVerdictSchema.parse(req.body);
    return c.moderationService.resolve(id, status);
  });
}
