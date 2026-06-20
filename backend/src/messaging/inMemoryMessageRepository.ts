import { InMemoryRepository } from "../core";
import type { UUID } from "../core";
import type { Message } from "./types";
import type { MessageRepository } from "./messageRepository";

export class InMemoryMessageRepository
  extends InMemoryRepository<Message>
  implements MessageRepository
{
  async listByConversation(conversationId: UUID): Promise<Message[]> {
    const all = await this.list();
    return all
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}
