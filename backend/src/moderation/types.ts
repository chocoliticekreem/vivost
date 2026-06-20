import { z } from "zod";
import type { ModerationAction, ModerationCategory, UUID } from "../core";

export type { ModerationAction, ModerationCategory } from "../core";

export interface ModerationVerdict {
  id: UUID;
  messageId: UUID;
  conversationId: UUID;
  tier: 1 | 2;
  categories: ModerationCategory[];
  score: number;
  action: ModerationAction;
  reason: string;
  excerpt: string | null;
  needsReview: boolean;
  reviewStatus: "open" | "actioned" | "dismissed";
  createdAt: Date;
  updatedAt: Date;
}

export interface Tier1Result {
  categories: ModerationCategory[];
  action: ModerationAction;
  redactedBody: string; // === input body when nothing was redacted
  excerpt: string | null;
}

export interface InlineResult {
  verdict: ModerationVerdict;
  redactedBody: string;
}

export const resolveVerdictSchema = z.object({
  status: z.enum(["actioned", "dismissed"]),
});

export type ResolveVerdictInput = z.input<typeof resolveVerdictSchema>;
