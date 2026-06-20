import { describe, expect, it } from "vitest";
import { newId } from "../core";
import { fakeIdVerificationProvider, fixedClock } from "../core/testing";
import { InMemoryVerificationRepository } from "./inMemoryVerificationRepository";
import { VerificationService } from "./verificationService";

const clock = fixedClock(new Date("2026-01-01T00:00:00.000Z"));

describe("VerificationService", () => {
  it("startVerification stores a pending record with the provider checkId", async () => {
    const repo = new InMemoryVerificationRepository();
    const service = new VerificationService(repo, fakeIdVerificationProvider(), clock);
    const subjectId = newId();

    const record = await service.startVerification(subjectId, "account", "photo_id");

    expect(record.status).toBe("pending");
    expect(record.checkId).toMatch(/^check_/);
    expect(record.checkedAt).toBeNull();
    expect(record.subjectId).toBe(subjectId);
    expect(record.subjectType).toBe("account");
    expect(record.method).toBe("photo_id");

    const stored = await repo.getById(record.id);
    expect(stored?.status).toBe("pending");
  });

  it("refreshResult with a passing provider -> pass, checkedAt set, verified, id_verified badge", async () => {
    const repo = new InMemoryVerificationRepository();
    const service = new VerificationService(
      repo,
      fakeIdVerificationProvider({ outcome: "pass" }),
      clock,
    );
    const subjectId = newId();

    const started = await service.startVerification(subjectId, "account", "photo_id");
    const refreshed = await service.refreshResult(started.id);

    expect(refreshed.status).toBe("pass");
    expect(refreshed.checkedAt).not.toBeNull();
    expect(await service.isVerified(subjectId)).toBe(true);
    expect(await service.latestStatus(subjectId)).toBe("pass");
    expect(await service.badgeFor(subjectId)).toBe("id_verified");
  });

  it("refreshResult with a failing provider -> not verified, null badge", async () => {
    const repo = new InMemoryVerificationRepository();
    const service = new VerificationService(
      repo,
      fakeIdVerificationProvider({ outcome: "fail" }),
      clock,
    );
    const subjectId = newId();

    const started = await service.startVerification(subjectId, "listing", "facial_age_estimation");
    const refreshed = await service.refreshResult(started.id);

    expect(refreshed.status).toBe("fail");
    expect(await service.isVerified(subjectId)).toBe(false);
    expect(await service.badgeFor(subjectId)).toBeNull();
  });

  it("refreshResult throws NotFoundError for an unknown record", async () => {
    const repo = new InMemoryVerificationRepository();
    const service = new VerificationService(repo, fakeIdVerificationProvider(), clock);

    await expect(service.refreshResult(newId())).rejects.toThrow("Verification record not found");
  });
});
