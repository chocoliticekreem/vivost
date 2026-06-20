import { newId } from "../core";
import type {
  EventBus,
  IdVerificationProvider,
  ModerationAction,
  ModerationCategory,
  ModerationProvider,
  PaymentProvider,
} from "../core";

/**
 * Placeholder PaymentProvider for production wiring. Returns deterministic ids
 * and always reports captures as "paid". Not a real processor.
 *
 * TODO: replace with CCBill/Segpay before launch.
 */
export function placeholderPaymentProvider(): PaymentProvider {
  return {
    async createCheckout(input) {
      const checkoutId = `placeholder_checkout_${newId()}`;
      return { checkoutId, url: `https://placeholder.invalid/checkout/${input.reference}` };
    },
    async capture(_checkoutId) {
      return { status: "paid" };
    },
    async refund(_checkoutId, _amountMinor) {
      return { status: "refunded" };
    },
    async holdDeposit(_input) {
      return { holdId: `placeholder_hold_${newId()}` };
    },
    async releaseDeposit(_holdId) {
      return { status: "released" };
    },
    verifyWebhook(_payload, _signature) {
      return false;
    },
  };
}

/**
 * Placeholder IdVerificationProvider for production wiring. startCheck returns a
 * deterministic id; getResult always reports "pending". Never returns artefacts.
 *
 * TODO: replace with a real age/identity verification provider before launch.
 */
export function placeholderIdVerificationProvider(): IdVerificationProvider {
  return {
    async startCheck(_input) {
      return { checkId: `placeholder_check_${newId()}` };
    },
    async getResult(_checkId) {
      return { status: "pending", method: "placeholder", checkedAt: null };
    },
  };
}

/**
 * Simple synchronous in-process EventBus for production wiring until a real
 * message broker lands. Mirrors core/testing/inMemoryEventBus.
 */
export function inProcessEventBus(): EventBus {
  const handlers = new Map<string, ((payload: unknown) => void)[]>();
  return {
    async publish(event) {
      const list = handlers.get(event.type) ?? [];
      for (const handler of list) handler(event.payload);
    },
    subscribe(type, handler) {
      const list = handlers.get(type) ?? [];
      list.push(handler);
      handlers.set(type, list);
    },
  };
}

const ALLOW_VERDICT = {
  flagged: false,
  categories: [] as ModerationCategory[],
  score: 0,
  action: "allow" as ModerationAction,
  reason: "",
};

/**
 * Placeholder ModerationProvider for production wiring. Always allows. Tier-1
 * has already gated synchronously, so an inert Tier-2 is a safe default.
 *
 * TODO: replace with openaiModerationProvider once OPENAI_API_KEY is set.
 */
export function placeholderModerationProvider(): ModerationProvider {
  return {
    async analyze(_input) {
      return { ...ALLOW_VERDICT };
    },
  };
}

const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";
const MODERATION_SYSTEM_PROMPT =
  "You are a trust-and-safety classifier for an adult-services marketplace chat. " +
  "Detect financial_scam, off_platform, harassment, safety_legal. Respond ONLY with a JSON " +
  'object {"flagged":boolean,"categories":string[],"score":number,"action":string,"reason":string} ' +
  "where action is one of allow, redact, hold, block, flag, escalate.";

/**
 * Real Tier-2 ModerationProvider backed by the OpenAI Chat Completions API in
 * JSON mode. Fails open (returns the allow verdict) on any error — Tier-1 has
 * already gated the message synchronously, so a failed async pass must never
 * block delivery. Model is overridable via OPENAI_MODEL.
 */
export function openaiModerationProvider(apiKey: string, model: string): ModerationProvider {
  return {
    async analyze(input) {
      try {
        const transcript = input.context
          .map((m) => `${m.senderRole}: ${m.body}`)
          .join("\n");
        const userContent =
          `focus categories: ${input.focus.join(", ")}\n\n` +
          `conversation so far:\n${transcript}\n\n` +
          `message to classify:\n${input.body}`;

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model,
            max_tokens: 400,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: MODERATION_SYSTEM_PROMPT },
              { role: "user", content: userContent },
            ],
          }),
        });
        if (!res.ok) return { ...ALLOW_VERDICT };

        const json = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const text = json.choices?.[0]?.message?.content;
        if (!text) return { ...ALLOW_VERDICT };

        const parsed = JSON.parse(text) as {
          flagged?: boolean;
          categories?: ModerationCategory[];
          score?: number;
          action?: ModerationAction;
          reason?: string;
        };
        return {
          flagged: Boolean(parsed.flagged),
          categories: Array.isArray(parsed.categories) ? parsed.categories : [],
          score: typeof parsed.score === "number" ? parsed.score : 0,
          action: parsed.action ?? "allow",
          reason: typeof parsed.reason === "string" ? parsed.reason : "",
        };
      } catch {
        return { ...ALLOW_VERDICT };
      }
    },
  };
}

/**
 * Production ModerationProvider: the real OpenAI pass when an API key is
 * configured, otherwise the inert placeholder.
 */
export function productionModerationProvider(): ModerationProvider {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return placeholderModerationProvider();
  const model = process.env.OPENAI_MODEL ?? OPENAI_DEFAULT_MODEL;
  return openaiModerationProvider(key, model);
}
