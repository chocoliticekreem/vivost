import { NotFoundError, newId } from "../core";
import type { Clock, PaymentProvider, UUID } from "../core";
import type { Payment, PaymentKind } from "./types";
import type { PaymentsRepository } from "./paymentsRepository";

export class PaymentsService {
  constructor(
    private readonly repo: PaymentsRepository,
    private readonly provider: PaymentProvider,
    private readonly clock: Clock,
  ) {}

  async createCheckout(
    accountId: UUID,
    kind: PaymentKind,
    amountMinor: number,
    currency: string,
    reference: string,
  ): Promise<{ payment: Payment; url: string }> {
    const { checkoutId, url } = await this.provider.createCheckout({
      amountMinor,
      currency,
      reference,
      kind,
    });
    const now = this.clock.now();
    const payment: Payment = {
      id: newId(),
      accountId,
      kind,
      amountMinor,
      currency,
      reference,
      checkoutId,
      status: "created",
      createdAt: now,
      updatedAt: now,
    };
    const saved = await this.repo.save(payment);
    return { payment: saved, url };
  }

  async settle(checkoutId: string): Promise<Payment> {
    const existing = await this.repo.findByCheckoutId(checkoutId);
    if (!existing) {
      throw new NotFoundError("Payment not found for checkout");
    }
    const result = await this.provider.capture(checkoutId);
    const updated: Payment = {
      ...existing,
      status: result.status === "paid" ? "paid" : "failed",
      updatedAt: this.clock.now(),
    };
    return this.repo.save(updated);
  }

  async refund(paymentId: UUID, amountMinor?: number): Promise<Payment> {
    const existing = await this.repo.getById(paymentId);
    if (!existing) {
      throw new NotFoundError("Payment not found");
    }
    await this.provider.refund(existing.checkoutId, amountMinor);
    const updated: Payment = {
      ...existing,
      status: "refunded",
      updatedAt: this.clock.now(),
    };
    return this.repo.save(updated);
  }

  verifyWebhook(payload: string, signature: string): boolean {
    return this.provider.verifyWebhook(payload, signature);
  }
}
