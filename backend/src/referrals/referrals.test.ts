import { describe, expect, it } from "vitest";
import { ConflictError, ValidationError, fixedClock } from "../core";
import { ReferralsService } from "./referralsService";
import {
  InMemoryReferralCodeRepository,
  InMemoryReferralRepository,
} from "./inMemoryReferralRepository";
import { InMemoryRewardLedgerRepository } from "./inMemoryRewardLedgerRepository";

const NOW = new Date("2026-01-01T00:00:00.000Z");

const OWNER = "11111111-1111-1111-1111-111111111111";
const REFERRED = "22222222-2222-2222-2222-222222222222";

function makeService() {
  const codeRepo = new InMemoryReferralCodeRepository();
  const referralRepo = new InMemoryReferralRepository();
  const ledgerRepo = new InMemoryRewardLedgerRepository();
  const service = new ReferralsService(
    codeRepo,
    referralRepo,
    ledgerRepo,
    fixedClock(NOW),
  );
  return { codeRepo, referralRepo, ledgerRepo, service };
}

describe("ReferralsService.createCode", () => {
  it("creates a code owned by the account", async () => {
    const { service } = makeService();
    const code = await service.createCode(OWNER);
    expect(code.ownerAccountId).toBe(OWNER);
    expect(code.code).toBeTruthy();
    expect(code.createdAt).toEqual(NOW);
    expect(code.id).toBeTruthy();
  });
});

describe("ReferralsService.recordSignup", () => {
  it("rejects an unknown code with ValidationError", async () => {
    const { service } = makeService();
    await expect(
      service.recordSignup("NOPECODE", REFERRED),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("stores a pending referral for a valid code", async () => {
    const { service } = makeService();
    const code = await service.createCode(OWNER);
    const referral = await service.recordSignup(code.code, REFERRED);
    expect(referral.status).toBe("pending");
    expect(referral.codeId).toBe(code.id);
    expect(referral.referredAccountId).toBe(REFERRED);
    expect(referral.activatedAt).toBeNull();
  });
});

describe("ReferralsService.activate", () => {
  it("credits both owner and referred account in the ledger", async () => {
    const { service } = makeService();
    const code = await service.createCode(OWNER);
    const referral = await service.recordSignup(code.code, REFERRED);

    const activated = await service.activate(referral.id, 500);
    expect(activated.status).toBe("activated");
    expect(activated.activatedAt).toEqual(NOW);

    expect(await service.balanceFor(OWNER)).toBe(500);
    expect(await service.balanceFor(REFERRED)).toBe(500);
  });

  it("uses distinct reasons for each side", async () => {
    const { service, ledgerRepo } = makeService();
    const code = await service.createCode(OWNER);
    const referral = await service.recordSignup(code.code, REFERRED);
    await service.activate(referral.id, 500);

    const ownerEntries = await ledgerRepo.findByAccount(OWNER);
    const referredEntries = await ledgerRepo.findByAccount(REFERRED);
    expect(ownerEntries.map((e) => e.reason)).toEqual(["referral_reward"]);
    expect(referredEntries.map((e) => e.reason)).toEqual(["referral_welcome"]);
  });

  it("throws ConflictError when activated twice", async () => {
    const { service } = makeService();
    const code = await service.createCode(OWNER);
    const referral = await service.recordSignup(code.code, REFERRED);
    await service.activate(referral.id, 500);

    await expect(service.activate(referral.id, 500)).rejects.toBeInstanceOf(
      ConflictError,
    );
    // No double-credit after the failed second activation.
    expect(await service.balanceFor(OWNER)).toBe(500);
  });
});
