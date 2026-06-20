import type { Repository, UUID } from "../core";
import type { Message } from "./types";

export interface MessageRepository extends Repository<Message> {
  listByConversation(conversationId: UUID): Promise<Message[]>;
}
