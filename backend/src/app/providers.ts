import { newId } from "../core";
import type { EventBus, IdVerificationProvider, PaymentProvider } from "../core";

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
