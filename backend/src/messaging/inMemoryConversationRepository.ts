import { InMemoryRepository } from "../core";
import type { UUID } from "../core";
import type { Conversation } from "./types";
import type { ConversationRepository } from "./conversationRepository";

export class InMemoryConversationRepository
  extends InMemoryRepository<Conversation>
  implements ConversationRepository
{
  async findByParticipants(
    accountId: UUID,
    clientId: UUID,
    listingId: UUID | null,
  ): Promise<Conversation | undefined> {
    const all = await this.list();
    return all.find(
      (c) =>
        c.accountId === accountId &&
        c.clientId === clientId &&
        c.listingId === listingId,
    );
  }
}
