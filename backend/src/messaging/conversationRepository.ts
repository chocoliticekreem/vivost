import type { Repository, UUID } from "../core";
import type { Conversation } from "./types";

export interface ConversationRepository extends Repository<Conversation> {
  findByParticipants(
    accountId: UUID,
    clientId: UUID,
    listingId: UUID | null,
  ): Promise<Conversation | undefined>;
}
