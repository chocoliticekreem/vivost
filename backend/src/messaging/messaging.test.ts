import { describe, expect, it, vi } from "vitest";
import { NotFoundError, fixedClock, newId } from "../core";
import { fakeModerationProvider, inMemoryEventBus } from "../core/testing";
import { ModerationService } from "../moderation";
import { InMemoryModerationRepository } from "../moderation";
import { MessagingService } from "./messagingService";
import { InMemoryConversationRepository } from "./inMemoryConversationRepository";
import { InMemoryMessageRepository } from "./inMemoryMessageRepository";

const NOW = new Date("2026-01-01T00:00:00.000Z");

function makeService() {
  const conversations = new InMemoryConversationRepository();
  const messages = new InMemoryMessageRepository();
  const eventBus = inMemoryEventBus();
  const moderation = new ModerationService(
    new InMemoryModerationRepository(),
    fakeModerationProvider(),
    fixedClock(NOW),
    eventBus,
  );
  const service = new MessagingService(
    conversations,
    messages,
    moderation,
    fixedClock(NOW),
    eventBus,
  );
  return { conversations, messages, eventBus, service };
}

function participants() {
  return { accountId: newId(), clientId: newId(), listingId: null };
}

describe("MessagingService.startConversation", () => {
  it("creates a conversation", async () => {
    const { service } = makeService();
    const p = participants();
    const conv = await service.startConversation(p);
    expect(conv.accountId).toBe(p.accountId);
    expect(conv.clientId).toBe(p.clientId);
    expect(conv.status).toBe("open");
  });

  it("dedups by participants", async () => {
    const { service } = makeService();
    const p = participants();
    const first = await service.startConversation(p);
    const second = await service.startConversation(p);
    expect(second.id).toBe(first.id);
  });
});

describe("MessagingService.sendMessage", () => {
  it("delivers a clean message and publishes message.sent with context", async () => {
    const { service, eventBus } = makeService();
    const spy = vi.fn();
    eventBus.subscribe("message.sent", spy);

    const conv = await service.startConversation(participants());
    const { message: msg, moderation } = await service.sendMessage({
      conversationId: conv.id,
      senderRole: "customer",
      body: "are you available friday evening?",
    });

    expect(msg.status).toBe("delivered");
    expect(msg.originalBody).toBeNull();
    expect(moderation.action).toBe("allow");
    expect(moderation.delivered).toBe(true);
    expect(moderation.warning).toBeNull();
    expect(spy).toHaveBeenCalledTimes(1);
    const payload = spy.mock.calls[0]?.[0] as {
      context: { senderRole: string; body: string }[];
    };
    expect(payload.context).toEqual([
      { senderRole: "customer", body: "are you available friday evening?" },
    ]);
  });

  it("stores a phone-number message as redacted with masked body and originalBody", async () => {
    const { service } = makeService();
    const conv = await service.startConversation(participants());
    const original = "ring +44 7700 900456 tonight";
    const { message: msg, moderation } = await service.sendMessage({
      conversationId: conv.id,
      senderRole: "worker",
      body: original,
    });

    expect(msg.status).toBe("redacted");
    expect(msg.body).toContain("[redacted]");
    expect(msg.body).not.toMatch(/900456/);
    expect(msg.originalBody).toBe(original);
    expect(moderation.redacted).toBe(true);
    expect(moderation.delivered).toBe(true);
    expect(moderation.warning).not.toBeNull();
  });

  it("blocks a payment-word message, does not deliver it, and warns the sender", async () => {
    const { service, eventBus } = makeService();
    const spy = vi.fn();
    eventBus.subscribe("message.sent", spy);

    const conv = await service.startConversation(participants());
    const { message: msg, moderation } = await service.sendMessage({
      conversationId: conv.id,
      senderRole: "customer",
      body: "send a deposit via cashapp first",
    });

    expect(msg.status).toBe("blocked");
    expect(msg.originalBody).toBeNull();
    expect(moderation.blocked).toBe(true);
    expect(moderation.delivered).toBe(false);
    expect(moderation.action).toBe("block");
    expect(moderation.warning).not.toBeNull();
    expect(moderation.strikeCount).toBe(1);
    expect(spy).not.toHaveBeenCalled();

    const visible = await service.listMessages(conv.id);
    const deliveredToRecipient = visible.filter(
      (m) => m.status === "delivered" || m.status === "redacted",
    );
    expect(deliveredToRecipient).toHaveLength(0);
  });

  it("increments strikeCount on a second blocked send", async () => {
    const { service } = makeService();
    const conv = await service.startConversation(participants());
    const first = await service.sendMessage({
      conversationId: conv.id,
      senderRole: "customer",
      body: "send a deposit via cashapp first",
    });
    expect(first.moderation.strikeCount).toBe(1);

    const second = await service.sendMessage({
      conversationId: conv.id,
      senderRole: "customer",
      body: "pay me on paypal now",
    });
    expect(second.message.status).toBe("blocked");
    expect(second.moderation.strikeCount).toBe(2);
    expect(second.moderation.warning).toContain("warning 2");
  });

  it("blocks a safety body, does not deliver it, and raises a Tier-1 escalation", async () => {
    const { service, eventBus } = makeService();
    const sent = vi.fn();
    const escalation = vi.fn();
    eventBus.subscribe("message.sent", sent);
    eventBus.subscribe("moderation.safety_escalation", escalation);

    const conv = await service.startConversation(participants());
    const { message: msg, moderation } = await service.sendMessage({
      conversationId: conv.id,
      senderRole: "customer",
      body: "are you underage?",
    });

    expect(msg.status).toBe("blocked");
    expect(moderation.blocked).toBe(true);
    expect(escalation).toHaveBeenCalledTimes(1);
    expect(sent).not.toHaveBeenCalled();
  });

  it("throws NotFoundError for a missing conversation", async () => {
    const { service } = makeService();
    await expect(
      service.sendMessage({
        conversationId: "00000000-0000-0000-0000-000000000000",
        senderRole: "customer",
        body: "hello",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("MessagingService.listMessages", () => {
  it("returns messages in chronological order", async () => {
    const { service } = makeService();
    const conv = await service.startConversation(participants());
    await service.sendMessage({
      conversationId: conv.id,
      senderRole: "customer",
      body: "first message",
    });
    await service.sendMessage({
      conversationId: conv.id,
      senderRole: "worker",
      body: "second message",
    });

    const messages = await service.listMessages(conv.id);
    expect(messages).toHaveLength(2);
    expect(messages[0]?.body).toBe("first message");
    expect(messages[1]?.body).toBe("second message");
  });
});
