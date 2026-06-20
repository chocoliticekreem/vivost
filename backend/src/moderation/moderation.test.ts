import { describe, expect, it, vi } from "vitest";
import { NotFoundError, fixedClock, newId } from "../core";
import { fakeModerationProvider, inMemoryEventBus } from "../core/testing";
import { ModerationService } from "./moderationService";
import { InMemoryModerationRepository } from "./inMemoryModerationRepository";
import { screenTier1 } from "./tier1";

const NOW = new Date("2026-01-01T00:00:00.000Z");

function makeService() {
  const repo = new InMemoryModerationRepository();
  const eventBus = inMemoryEventBus();
  const service = new ModerationService(
    repo,
    fakeModerationProvider(),
    fixedClock(NOW),
    eventBus,
  );
  return { repo, eventBus, service };
}

function inlineInput(body: string) {
  return {
    messageId: newId(),
    conversationId: newId(),
    senderRole: "customer" as const,
    body,
  };
}

describe("screenTier1", () => {
  it("redacts a phone number and masks it in redactedBody", () => {
    const r = screenTier1("call me on +44 7700 900123 anytime");
    expect(r.action).toBe("redact");
    expect(r.categories).toContain("off_platform");
    expect(r.redactedBody).toContain("[redacted]");
    expect(r.redactedBody).not.toMatch(/900123/);
  });

  it("redacts an email address", () => {
    const r = screenTier1("reach me at jane.doe@example.com please");
    expect(r.action).toBe("redact");
    expect(r.redactedBody).toContain("[redacted]");
    expect(r.redactedBody).not.toContain("jane.doe@example.com");
  });

  it("redacts an app word", () => {
    const r = screenTier1("let us move to whatsapp instead");
    expect(r.action).toBe("redact");
    expect(r.categories).toContain("off_platform");
    expect(r.redactedBody).not.toMatch(/whatsapp/i);
  });

  it("blocks a payment-redirect body", () => {
    const r = screenTier1("send a deposit via cashapp first");
    expect(r.action).toBe("block");
    expect(r.categories).toContain("financial_scam");
    expect(r.redactedBody).toBe("send a deposit via cashapp first");
  });

  it("blocks a harassment body", () => {
    const r = screenTier1("i know where you live");
    expect(r.action).toBe("block");
    expect(r.categories).toContain("harassment");
  });

  it("blocks a safety_legal body and wins precedence over off_platform", () => {
    const r = screenTier1("she is underage, text whatsapp now");
    expect(r.action).toBe("block");
    expect(r.categories).toContain("safety_legal");
  });

  it("allows a clean body with no excerpt", () => {
    const r = screenTier1("hello, are you available friday evening?");
    expect(r.action).toBe("allow");
    expect(r.categories).toEqual([]);
    expect(r.excerpt).toBeNull();
    expect(r.redactedBody).toBe("hello, are you available friday evening?");
  });
});

describe("ModerationService.screenInline", () => {
  it("redacts a phone number and returns masked body", async () => {
    const { service, repo } = makeService();
    const input = inlineInput("ring +44 7700 900456 tonight");
    const { verdict, redactedBody } = await service.screenInline(input);

    expect(verdict.action).toBe("redact");
    expect(verdict.tier).toBe(1);
    expect(verdict.score).toBe(0.5);
    expect(verdict.needsReview).toBe(false);
    expect(redactedBody).toContain("[redacted]");

    const stored = await repo.listByMessage(input.messageId);
    expect(stored).toHaveLength(1);
  });

  it("blocks a payment word and marks needsReview", async () => {
    const { service } = makeService();
    const { verdict } = await service.screenInline(
      inlineInput("pay the deposit by bitcoin"),
    );
    expect(verdict.action).toBe("block");
    expect(verdict.score).toBe(0.9);
    expect(verdict.needsReview).toBe(true);
    expect(verdict.reviewStatus).toBe("open");
  });

  it("blocks a safety word and publishes moderation.safety_escalation", async () => {
    const { service, eventBus } = makeService();
    const spy = vi.fn();
    eventBus.subscribe("moderation.safety_escalation", spy);

    const { verdict } = await service.screenInline(
      inlineInput("are you underage?"),
    );
    expect(verdict.action).toBe("block");
    expect(verdict.needsReview).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toMatchObject({
      categories: ["safety_legal"],
    });
  });

  it("allows a clean body: score 0, needsReview false, no escalation", async () => {
    const { service, eventBus } = makeService();
    const spy = vi.fn();
    eventBus.subscribe("moderation.safety_escalation", spy);

    const { verdict } = await service.screenInline(
      inlineInput("looking forward to meeting you"),
    );
    expect(verdict.action).toBe("allow");
    expect(verdict.score).toBe(0);
    expect(verdict.needsReview).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("ModerationService.screenDeep", () => {
  it("persists a tier-2 verdict and escalates for a safety body", async () => {
    const { service, repo, eventBus } = makeService();
    const spy = vi.fn();
    eventBus.subscribe("moderation.safety_escalation", spy);

    const messageId = newId();
    const conversationId = newId();
    await service.screenDeep({
      messageId,
      conversationId,
      senderRole: "worker",
      body: "this involves trafficking",
      context: [],
    });

    const stored = await repo.listByMessage(messageId);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.tier).toBe(2);
    expect(stored[0]?.categories).toEqual(["safety_legal"]);
    expect(stored[0]?.needsReview).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the provider does not flag", async () => {
    const { service, repo } = makeService();
    const messageId = newId();
    await service.screenDeep({
      messageId,
      conversationId: newId(),
      senderRole: "customer",
      body: "see you at 8pm",
      context: [],
    });
    expect(await repo.listByMessage(messageId)).toHaveLength(0);
  });
});

describe("ModerationService.listQueue", () => {
  it("returns only open + needsReview verdicts, newest first", async () => {
    const { service } = makeService();
    await service.screenInline(inlineInput("pay via bitcoin")); // hold → queued
    await service.screenInline(inlineInput("hello there")); // allow → not queued

    const queue = await service.listQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]?.needsReview).toBe(true);
    expect(queue[0]?.reviewStatus).toBe("open");
  });
});

describe("ModerationService.resolve", () => {
  it("flips reviewStatus and clears needsReview", async () => {
    const { service } = makeService();
    const { verdict } = await service.screenInline(
      inlineInput("pay via bitcoin"),
    );
    const resolved = await service.resolve(verdict.id, "actioned");
    expect(resolved.reviewStatus).toBe("actioned");
    expect(resolved.needsReview).toBe(false);

    const queue = await service.listQueue();
    expect(queue).toHaveLength(0);
  });

  it("throws NotFoundError for a missing id", async () => {
    const { service } = makeService();
    await expect(
      service.resolve("00000000-0000-0000-0000-000000000000", "dismissed"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
