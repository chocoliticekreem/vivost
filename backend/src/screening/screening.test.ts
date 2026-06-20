import { describe, expect, it } from "vitest";
import { ValidationError, normalisePhone, sha256Hasher, fixedClock } from "../core";
import { ScreeningService } from "./screeningService";
import { ReverseCheckerService } from "./reverseCheckerService";
import { InMemoryScreeningRepository } from "./inMemoryScreeningRepository";
import { InMemoryOffenderReportRepository } from "./inMemoryOffenderReportRepository";

const NOW = new Date("2026-01-01T00:00:00.000Z");
const CLIENT_ID = "11111111-1111-1111-1111-111111111111";
const REPORTER_ID = "22222222-2222-2222-2222-222222222222";

describe("ScreeningService", () => {
  function makeService() {
    const repo = new InMemoryScreeningRepository();
    return { repo, service: new ScreeningService(repo, fixedClock(NOW)) };
  }

  it("requests, verifies and reports verified status", async () => {
    const { service } = makeService();

    const requested = await service.requestScreening(CLIENT_ID);
    expect(requested.verified).toBe(false);
    expect(requested.references).toBe(0);
    expect(requested.verifiedAt).toBeNull();

    const verified = await service.markVerified(CLIENT_ID);
    expect(verified.verified).toBe(true);
    expect(verified.verifiedAt).toEqual(NOW);

    const status = await service.getStatus(CLIENT_ID);
    expect(status.verified).toBe(true);
  });

  it("counts added references", async () => {
    const { service } = makeService();
    await service.addReference(CLIENT_ID);
    const status = await service.addReference(CLIENT_ID);
    expect(status.references).toBe(2);
  });
});

describe("ReverseCheckerService", () => {
  function makeService() {
    const repo = new InMemoryOffenderReportRepository();
    return {
      repo,
      service: new ReverseCheckerService(repo, sha256Hasher, fixedClock(NOW)),
    };
  }

  it("matches the same phone reported, even when formatted differently", async () => {
    const { service } = makeService();
    await service.report({
      phone: "07700 900123",
      reason: "no-show, abusive",
      reportedByAccountId: REPORTER_ID,
    });

    const result = await service.check({ phone: "(07700) 900-123" });
    expect(result.matches).toBeGreaterThanOrEqual(1);
    expect(result.reasons).toContain("no-show, abusive");
  });

  it("matches a differently spaced/+ formatted version of the same number", async () => {
    const { service } = makeService();
    await service.report({
      phone: "07700900999",
      reason: "threatening",
      reportedByAccountId: REPORTER_ID,
    });

    const result = await service.check({ phone: "0770 0900 999" });
    expect(result.matches).toBe(1);
    expect(result.reasons).toEqual(["threatening"]);
  });

  it("returns no matches for a different phone", async () => {
    const { service } = makeService();
    await service.report({
      phone: "07700900123",
      reason: "no-show",
      reportedByAccountId: REPORTER_ID,
    });

    const result = await service.check({ phone: "07700900000" });
    expect(result.matches).toBe(0);
    expect(result.reasons).toEqual([]);
  });

  it("rejects a report with neither phone nor email", async () => {
    const { service } = makeService();
    await expect(
      service.report({ reason: "no contact", reportedByAccountId: REPORTER_ID }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("stores the hash, never the raw phone (GDPR minimisation)", async () => {
    const { repo, service } = makeService();
    const rawPhone = "07700900123";
    await service.report({
      phone: rawPhone,
      reason: "abuse",
      reportedByAccountId: REPORTER_ID,
    });

    const all = await repo.list();
    expect(all).toHaveLength(1);
    const stored = all[0]!;
    expect(stored.phoneHash).toBeTruthy();
    expect(stored.phoneHash).not.toBe(rawPhone);
    expect(stored.phoneHash).not.toBe(normalisePhone(rawPhone));
    expect(stored.phoneHash).toBe(sha256Hasher.hash(normalisePhone(rawPhone)));
  });
});
