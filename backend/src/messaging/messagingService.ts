import { NotFoundError, newId } from "../core";
import type { Clock, EventBus, UUID } from "../core";
import type { ModerationService } from "../moderation";
import {
  sendMessageSchema,
  startConversationSchema,
} from "./types";
import type {
  Conversation,
  Message,
  MessageStatus,
  SendMessageInput,
  StartConversationInput,
} from "./types";
import type { ConversationRepository } from "./conversationRepository";
import type { MessageRepository } from "./messageRepository";

const CONTEXT_WINDOW = 10;

export class MessagingService {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly moderation: ModerationService,
    private readonly clock: Clock,
    private readonly eventBus: EventBus,
  ) {}

  async startConversation(input: StartConversationInput): Promise<Conversation> {
    const parsed = startConversationSchema.parse(input);

    const existing = await this.conversations.findByParticipants(
      parsed.accountId,
      parsed.clientId,
      parsed.listingId,
    );
    if (existing) return existing;

    const now = this.clock.now();
    const conversation: Conversation = {
      id: newId(),
      accountId: parsed.accountId,
      clientId: parsed.clientId,
      listingId: parsed.listingId,
      status: "open",
      createdAt: now,
      updatedAt: now,
    };
    return this.conversations.save(conversation);
  }

  async sendMessage(
    input: { conversationId: UUID } & SendMessageInput,
  ): Promise<Message> {
    const conversation = await this.conversations.getById(input.conversationId);
    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    const parsed = sendMessageSchema.parse(input);
    const messageId = newId();
    const now = this.clock.now();

    const inline = await this.moderation.screenInline({
      messageId,
      conversationId: input.conversationId,
      senderRole: parsed.senderRole,
      body: parsed.body,
    });

    let status: MessageStatus;
    let body: string;
    let originalBody: string | null;
    switch (inline.verdict.action) {
      case "redact":
        status = "redacted";
        body = inline.redactedBody;
        originalBody = parsed.body;
        break;
      case "hold":
        status = "held";
        body = parsed.body;
        originalBody = null;
        break;
      case "block":
        status = "blocked";
        body = parsed.body;
        originalBody = null;
        break;
      default:
        status = "delivered";
        body = parsed.body;
        originalBody = null;
        break;
    }

    const message: Message = {
      id: messageId,
      conversationId: input.conversationId,
      senderRole: parsed.senderRole,
      body,
      originalBody,
      status,
      createdAt: now,
      updatedAt: now,
    };
    const saved = await this.messages.save(message);

    await this.conversations.save({ ...conversation, updatedAt: now });

    if (status !== "blocked" && status !== "held") {
      const history = await this.messages.listByConversation(
        input.conversationId,
      );
      const context = history
        .slice(-CONTEXT_WINDOW)
        .map((m) => ({ senderRole: m.senderRole, body: m.body }));
      await this.eventBus.publish({
        type: "message.sent",
        payload: {
          messageId,
          conversationId: input.conversationId,
          senderRole: parsed.senderRole,
          body,
          context,
        },
      });
    }

    return saved;
  }

  async getConversation(id: UUID): Promise<Conversation> {
    const conversation = await this.conversations.getById(id);
    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }
    return conversation;
  }

  async listMessages(conversationId: UUID): Promise<Message[]> {
    return this.messages.listByConversation(conversationId);
  }
}
