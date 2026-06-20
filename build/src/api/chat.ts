/**
 * Chat API client + anonymous customer identity.
 *
 * Talks to the Vivost messaging backend so a customer can message a worker from a
 * profile page. There is no auth: the customer is an anonymous client persisted in
 * localStorage; the worker is identified by its Profile id (workerRef).
 *
 * API_BASE is hardcoded to localhost for this dev integration; productionising it
 * (env / DefinePlugin) is a follow-up.
 */

const API_BASE = 'http://localhost:8787';

const CUSTOMER_EMAIL_KEY = 'vivost-customer-email';
const CONVO_KEY_PREFIX = 'vivost-convo-';

export type ModerationCategory =
  | 'financial_scam'
  | 'off_platform'
  | 'harassment'
  | 'safety_legal';

export type ModerationAction =
  | 'allow'
  | 'redact'
  | 'hold'
  | 'block'
  | 'flag'
  | 'escalate';

export type MessageStatus = 'delivered' | 'redacted' | 'held' | 'blocked';

export interface Message {
  id: string;
  conversationId: string;
  senderRole: 'worker' | 'customer';
  body: string;
  originalBody: string | null;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MessageModeration {
  action: ModerationAction;
  categories: ModerationCategory[];
  blocked: boolean;
  delivered: boolean;
  redacted: boolean;
  reason: string;
  strikeCount: number;
  warning: string | null;
}

export interface SendMessageResult {
  message: Message;
  moderation: MessageModeration;
}

export function getCustomerEmail(): string {
  let email = localStorage.getItem(CUSTOMER_EMAIL_KEY);
  if (!email) {
    email = `guest.${crypto.randomUUID()}@vivost.local`;
    localStorage.setItem(CUSTOMER_EMAIL_KEY, email);
  }
  return email;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const json = await res.json();
      if (json && typeof json.error === 'string') message = json.error;
      else if (json && typeof json.message === 'string') message = json.message;
    } catch {
      // non-JSON error body; keep the status-based message
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function startConversation(
  workerRef: string,
  workerName: string,
): Promise<{ conversationId: string; customerId: string }> {
  const result = await request<{ conversationId: string; customerId: string }>(
    '/messaging/start',
    {
      method: 'POST',
      body: JSON.stringify({
        workerRef,
        workerName,
        customerEmail: getCustomerEmail(),
      }),
    },
  );
  localStorage.setItem(CONVO_KEY_PREFIX + workerRef, result.conversationId);
  return result;
}

export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<SendMessageResult> {
  return request<SendMessageResult>(
    `/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ senderRole: 'customer', body }),
    },
  );
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  return request<Message[]>(`/conversations/${conversationId}/messages`);
}
