import type { EventBus, IdVerificationProvider, PaymentProvider } from "../ports";
import { fixedClock } from "../clock";

export { fixedClock };

let paymentCounter = 0;

/**
 * Deterministic fake PaymentProvider for tests. Capture returns "paid" unless
 * the original reference contains the substring "fail". No network calls.
 */
export function fakePaymentProvider(): PaymentProvider {
  const references = new Map<string, string>();
  return {
    async createCheckout(input) {
      const checkoutId = `checkout_${++paymentCounter}`;
      references.set(checkoutId, input.reference);
      return { checkoutId, url: `https://fake.test/checkout/${checkoutId}` };
    },
    async capture(checkoutId) {
      const reference = references.get(checkoutId) ?? "";
      return { status: reference.includes("fail") ? "failed" : "paid" };
    },
    async refund(_checkoutId, _amountMinor) {
      return { status: "refunded" };
    },
    async holdDeposit(_input) {
      return { holdId: `hold_${++paymentCounter}` };
    },
    async releaseDeposit(_holdId) {
      return { status: "released" };
    },
    verifyWebhook(_payload, signature) {
      return signature === "valid";
    },
  };
}

let checkCounter = 0;

/**
 * Configurable fake IdVerificationProvider. Defaults to "pass". Pass
 * { outcome: "fail" | "pending" } to control results. Never returns artefacts.
 */
export function fakeIdVerificationProvider(
  config: { outcome?: "pass" | "fail" | "pending"; checkedAt?: Date | null } = {},
): IdVerificationProvider {
  const outcome = config.outcome ?? "pass";
  const checks = new Map<string, string>();
  return {
    async startCheck(input) {
      const checkId = `check_${++checkCounter}`;
      checks.set(checkId, input.method);
      return { checkId };
    },
    async getResult(checkId) {
      const method = checks.get(checkId) ?? "unknown";
      const checkedAt =
        config.checkedAt !== undefined
          ? config.checkedAt
          : outcome === "pending"
            ? null
            : new Date(0);
      return { status: outcome, method, checkedAt };
    },
  };
}

/**
 * Simple synchronous in-memory EventBus for tests.
 */
export function inMemoryEventBus(): EventBus {
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
