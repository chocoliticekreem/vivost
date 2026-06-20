import { describe, expect, it } from "vitest";
import { newId } from "../core";
import { fakePaymentProvider, fixedClock } from "../core/testing";
import { InMemoryPaymentsRepository } from "./inMemoryPaymentsRepository";
import { PaymentsService } from "./paymentsService";

const clock = fixedClock(new Date("2026-01-01T00:00:00.000Z"));

function makeService() {
  const repo = new InMemoryPaymentsRepository();
  const service = new PaymentsService(repo, fakePaymentProvider(), clock);
  return { repo, service };
}

describe("PaymentsService", () => {
  it("createCheckout stores a 'created' payment and returns a url", async () => {
    const { repo, service } = makeService();
    const accountId = newId();

    const { payment, url } = await service.createCheckout(
      accountId,
      "subscription",
      999,
      "GBP",
      "sub-jan",
    );

    expect(payment.status).toBe("created");
    expect(payment.accountId).toBe(accountId);
    expect(payment.amountMinor).toBe(999);
    expect(payment.currency).toBe("GBP");
    expect(payment.checkoutId).toMatch(/^checkout_/);
    expect(url).toContain(payment.checkoutId);

    const stored = await repo.getById(payment.id);
    expect(stored?.status).toBe("created");
  });

  it("settle with a clean reference -> 'paid'", async () => {
    const { service } = makeService();

    const { payment } = await service.createCheckout(
      newId(),
      "boost",
      500,
      "GBP",
      "boost-clean",
    );
    const settled = await service.settle(payment.checkoutId);

    expect(settled.status).toBe("paid");
  });

  it("settle with a reference containing 'fail' -> 'failed'", async () => {
    const { service } = makeService();

    const { payment } = await service.createCheckout(
      newId(),
      "boost",
      500,
      "GBP",
      "boost-fail",
    );
    const settled = await service.settle(payment.checkoutId);

    expect(settled.status).toBe("failed");
  });

  it("refund -> 'refunded'", async () => {
    const { service } = makeService();

    const { payment } = await service.createCheckout(
      newId(),
      "deposit",
      5000,
      "GBP",
      "deposit-1",
    );
    await service.settle(payment.checkoutId);
    const refunded = await service.refund(payment.id);

    expect(refunded.status).toBe("refunded");
  });
});
