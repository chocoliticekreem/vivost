import { describe, expect, it } from "vitest";
import { NotFoundError } from "../core";
import { fakePaymentProvider, fixedClock } from "../core/testing";
import { DepositsService } from "./depositsService";
import { InMemoryDepositsRepository } from "./inMemoryDepositsRepository";

const NOW = new Date("2026-01-01T00:00:00.000Z");
const ENQUIRY = "11111111-1111-1111-1111-111111111111";

function makeService() {
  const repo = new InMemoryDepositsRepository();
  const service = new DepositsService(
    repo,
    fakePaymentProvider(),
    fixedClock(NOW),
  );
  return { repo, service };
}

function validInput(overrides: Record<string, unknown> = {}) {
  return { enquiryId: ENQUIRY, amountMinor: 5000, currency: "GBP", ...overrides };
}

describe("DepositsService.hold", () => {
  it("places a hold and records it as held with a holdId", async () => {
    const { service } = makeService();
    const deposit = await service.hold(validInput());
    expect(deposit.status).toBe("held");
    expect(deposit.holdId).toBeTruthy();
    expect(deposit.amountMinor).toBe(5000);
    expect(deposit.currency).toBe("GBP");
    expect(deposit.createdAt).toEqual(NOW);
  });
});

describe("DepositsService.release", () => {
  it("releases a held deposit", async () => {
    const { service } = makeService();
    const held = await service.hold(validInput());
    const released = await service.release(held.id);
    expect(released.status).toBe("released");
  });

  it("throws NotFoundError releasing a missing deposit", async () => {
    const { service } = makeService();
    await expect(
      service.release("00000000-0000-0000-0000-000000000000"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("DepositsService.forfeit", () => {
  it("forfeits a held deposit", async () => {
    const { service } = makeService();
    const held = await service.hold(validInput());
    const forfeited = await service.forfeit(held.id);
    expect(forfeited.status).toBe("forfeited");
  });
});
