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
  SendMessageResult,
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
  ): Promise<SendMessageResult> {
    const conversation = await this.conversations.getById(input.conversationId);
    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    const parsed = sendMessageSchema.parse(input);
    const messageId = newId();
    const now = this.clock.now();

    const evaluation = this.moderation.evaluateInline({
      messageId,
      conversationId: input.conversationId,
      senderRole: parsed.senderRole,
      body: parsed.body,
    });

    let status: MessageStatus;
    let body: string;
    let originalBody: string | null;
    switch (evaluation.verdict.action) {
      case "redact":
        status = "redacted";
        body = evaluation.redactedBody;
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

    // The verdict's message_id is a FK to the row we just saved — persist it now.
    await this.moderation.commitInline(evaluation.verdict);

    await this.conversations.save({ ...conversation, updatedAt: now });

    const history = await this.messages.listByConversation(
      input.conversationId,
    );

    if (status !== "blocked" && status !== "held") {
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

    const strikeCount = history.filter(
      (m) => m.senderRole === parsed.senderRole && m.status === "blocked",
    ).length;

    const blocked = status === "blocked" || status === "held";
    const delivered = status === "delivered" || status === "redacted";
    const redacted = status === "redacted";
    const categories = evaluation.verdict.categories;

    let warning: string | null;
    if (blocked) {
      warning = `⚠ Your message was blocked (${categories.join(
        ", ",
      )}). This is warning ${strikeCount}. Keep the conversation on-platform and respectful.`;
    } else if (redacted) {
      warning = "Contact details were hidden for your safety and kept on record.";
    } else {
      warning = null;
    }

    return {
      message: saved,
      moderation: {
        action: evaluation.verdict.action,
        categories,
        blocked,
        delivered,
        redacted,
        reason: evaluation.verdict.reason,
        strikeCount,
        warning,
      },
    };
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
