import { NotFoundError, newId } from "../core";
import type { Clock, EventBus, ModerationProvider, UUID } from "../core";
import { screenTier1 } from "./tier1";
import type { InlineResult, ModerationVerdict } from "./types";
import type { ModerationRepository } from "./moderationRepository";

const ALL_CATEGORIES = [
  "financial_scam",
  "off_platform",
  "harassment",
  "safety_legal",
] as const;

export class ModerationService {
  constructor(
    private readonly repo: ModerationRepository,
    private readonly provider: ModerationProvider,
    private readonly clock: Clock,
    private readonly eventBus: EventBus,
  ) {}

  async screenInline(input: {
    messageId: UUID;
    conversationId: UUID;
    senderRole: "worker" | "customer";
    body: string;
  }): Promise<InlineResult> {
    const result = this.evaluateInline(input);
    await this.commitInline(result.verdict);
    return result;
  }

  /**
   * Pure Tier-1 evaluation: builds the verdict and the (possibly redacted) body
   * WITHOUT persisting or publishing. The verdict's message_id is a foreign key,
   * so the caller must save the message row first, then call commitInline().
   */
  evaluateInline(input: {
    messageId: UUID;
    conversationId: UUID;
    senderRole: "worker" | "customer";
    body: string;
  }): InlineResult {
    const t1 = screenTier1(input.body);
    const now = this.clock.now();
    const needsReview = t1.action === "block";
    const score = t1.action === "allow" ? 0 : t1.action === "redact" ? 0.5 : 0.9;

    const verdict: ModerationVerdict = {
      id: newId(),
      messageId: input.messageId,
      conversationId: input.conversationId,
      tier: 1,
      categories: t1.categories,
      score,
      action: t1.action,
      reason:
        t1.categories.length > 0
          ? `Tier-1 matched: ${t1.categories.join(", ")} → ${t1.action}`
          : "Tier-1: no match",
      excerpt: t1.excerpt,
      needsReview,
      reviewStatus: "open",
      createdAt: now,
      updatedAt: now,
    };
    return { verdict, redactedBody: t1.redactedBody };
  }

  /**
   * Persists a Tier-1 verdict and raises a safety escalation when required.
   * Call only after the referenced message row exists (FK on message_id).
   */
  async commitInline(verdict: ModerationVerdict): Promise<void> {
    if (verdict.categories.includes("safety_legal")) {
      await this.eventBus.publish({
        type: "moderation.safety_escalation",
        payload: {
          messageId: verdict.messageId,
          conversationId: verdict.conversationId,
          categories: verdict.categories,
        },
      });
    }
    await this.repo.save(verdict);
  }

  async screenDeep(input: {
    messageId: UUID;
    conversationId: UUID;
    senderRole: "worker" | "customer";
    body: string;
    context: { senderRole: "worker" | "customer"; body: string }[];
  }): Promise<void> {
    const r = await this.provider.analyze({
      body: input.body,
      context: input.context,
      focus: [...ALL_CATEGORIES],
    });
    if (!r.flagged) return;

    const now = this.clock.now();
    const verdict: ModerationVerdict = {
      id: newId(),
      messageId: input.messageId,
      conversationId: input.conversationId,
      tier: 2,
      categories: r.categories,
      score: r.score,
      action: r.action,
      reason: r.reason,
      excerpt: null,
      needsReview: true,
      reviewStatus: "open",
      createdAt: now,
      updatedAt: now,
    };

    if (r.categories.includes("safety_legal")) {
      await this.eventBus.publish({
        type: "moderation.safety_escalation",
        payload: {
          messageId: input.messageId,
          conversationId: input.conversationId,
          categories: r.categories,
        },
      });
    }

    await this.repo.save(verdict);
  }

  async listQueue(): Promise<ModerationVerdict[]> {
    return this.repo.listQueue();
  }

  async listByMessage(messageId: UUID): Promise<ModerationVerdict[]> {
    return this.repo.listByMessage(messageId);
  }

  async resolve(
    id: UUID,
    status: "actioned" | "dismissed",
  ): Promise<ModerationVerdict> {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new NotFoundError("Moderation verdict not found");
    }
    const updated: ModerationVerdict = {
      ...existing,
      reviewStatus: status,
      needsReview: false,
      updatedAt: this.clock.now(),
    };
    return this.repo.save(updated);
  }
}
