import { z } from "zod";
import type { UUID } from "../core";

export interface Conversation {
  id: UUID;
  accountId: UUID;
  clientId: UUID;
  listingId: UUID | null;
  status: "open" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

export type MessageStatus = "delivered" | "redacted" | "held" | "blocked";

export interface Message {
  id: UUID;
  conversationId: UUID;
  senderRole: "worker" | "customer";
  body: string;
  originalBody: string | null;
  status: MessageStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const startConversationSchema = z.object({
  accountId: z.string().uuid(),
  clientId: z.string().uuid(),
  listingId: z.string().uuid().nullable().default(null),
});

export type StartConversationInput = z.input<typeof startConversationSchema>;

export const sendMessageSchema = z.object({
  senderRole: z.enum(["worker", "customer"]),
  body: z.string().min(1).max(4000),
});

export type SendMessageInput = z.input<typeof sendMessageSchema>;
