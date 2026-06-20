import { describe, expect, it } from "vitest";
import { newId, sha256Hasher, ValidationError } from "../core";
import { fixedClock, inMemoryEventBus } from "../core/testing";
import { InMemoryBadDateRepository } from "./inMemoryBadDateRepository";
import { InMemoryReverseReviewRepository } from "./inMemoryReverseReviewRepository";
import { InMemoryCheckInRepository } from "./inMemoryCheckInRepository";
import { BadDateService } from "./badDateService";
import { ReverseReviewService } from "./reverseReviewService";
import { CheckInService } from "./checkInService";

const NOW = new Date("2026-06-20T12:00:00.000Z");

describe("BadDateService", () => {
  it("hashes the client contact (stored hash != raw)", async () => {
    const repo = new InMemoryBadDateRepository();
    const service = new BadDateService(repo, sha256Hasher, fixedClock(NOW));

    const report = await service.report({
      reporterAccountId: newId(),
      phone: "+44 7700 900123",
      description: "no-show, abusive",
      severity: "high",
    });

    expect(report.clientPhoneHash).toBeTruthy();
    expect(report.clientPhoneHash).not.toBe("+44 7700 900123");
    expect(report.clientPhoneHash).not.toContain("7700");
    expect(report.createdAt).toEqual(NOW);
  });

  it("search matches by phone", async () => {
    const repo = new InMemoryBadDateRepository();
    const service = new BadDateService(repo, sha256Hasher, fixedClock(NOW));

    await service.report({
      reporterAccountId: newId(),
      phone: "07700900123",
      description: "bad",
      severity: "medium",
    });

    // Same number, different formatting — normalisation must make it match.
    const matched = await service.search({ phone: "07700 900123" });
    expect(matched.length).toBe(1);

    // A different number must not match.
    const unmatched = await service.search({ phone: "07000000000" });
    expect(unmatched.length).toBe(0);
  });

  it("rejects a report with no contact", async () => {
    const repo = new InMemoryBadDateRepository();
    const service = new BadDateService(repo, sha256Hasher, fixedClock(NOW));

    await expect(
      service.report({
        reporterAccountId: newId(),
        description: "no contact given",
        severity: "low",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("listForVerifiedProvider returns all reports", async () => {
    const repo = new InMemoryBadDateRepository();
    const service = new BadDateService(repo, sha256Hasher, fixedClock(NOW));
    await service.report({
      reporterAccountId: newId(),
      email: "x@example.com",
      description: "a",
      severity: "low",
    });
    const all = await service.listForVerifiedProvider();
    expect(all.length).toBe(1);
  });
});

describe("ReverseReviewService", () => {
  it("adds reviews and computes averageRating", async () => {
    const repo = new InMemoryReverseReviewRepository();
    const service = new ReverseReviewService(repo, sha256Hasher, fixedClock(NOW));
    const contact = "client@example.com";

    await service.add({
      reviewerAccountId: newId(),
      clientContact: contact,
      rating: 4,
      comment: "fine",
    });
    await service.add({
      reviewerAccountId: newId(),
      clientContact: contact,
      rating: 2,
      comment: "late",
    });

    const reviews = await service.forClient({ contact });
    expect(reviews.length).toBe(2);
    expect(reviews[0]?.clientContactHash).not.toBe(contact);

    const avg = await service.averageRating({ contact });
    expect(avg).toBe(3);
  });

  it("rejects rating of 6", async () => {
    const repo = new InMemoryReverseReviewRepository();
    const service = new ReverseReviewService(repo, sha256Hasher, fixedClock(NOW));

    await expect(
      service.add({
        reviewerAccountId: newId(),
        clientContact: "c@example.com",
        rating: 6,
        comment: "out of range",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("CheckInService", () => {
  it("start sets expectedEndAt = now + duration", async () => {
    const repo = new InMemoryCheckInRepository();
    const bus = inMemoryEventBus();
    const service = new CheckInService(repo, fixedClock(NOW), bus);

    const session = await service.start({
      accountId: newId(),
      trustedContactId: newId(),
      durationMinutes: 90,
    });

    expect(session.status).toBe("active");
    expect(session.startedAt).toEqual(NOW);
    expect(session.expectedEndAt.getTime()).toBe(NOW.getTime() + 90 * 60_000);
  });

  it("markSafe sets status to safe", async () => {
    const repo = new InMemoryCheckInRepository();
    const bus = inMemoryEventBus();
    const service = new CheckInService(repo, fixedClock(NOW), bus);

    const session = await service.start({
      accountId: newId(),
      trustedContactId: newId(),
      durationMinutes: 30,
    });
    const safe = await service.markSafe(session.id);
    expect(safe.status).toBe("safe");
  });

  it("evaluateOverdue marks overdue and publishes safety.overdue", async () => {
    const repo = new InMemoryCheckInRepository();
    const bus = inMemoryEventBus();
    const service = new CheckInService(repo, fixedClock(NOW), bus);

    const events: unknown[] = [];
    bus.subscribe("safety.overdue", (payload) => events.push(payload));

    const session = await service.start({
      accountId: newId(),
      trustedContactId: newId(),
      durationMinutes: 60,
    });

    const later = new Date(NOW.getTime() + 61 * 60_000);
    const overdue = await service.evaluateOverdue(later);

    expect(overdue.length).toBe(1);
    expect(overdue[0]?.status).toBe("overdue");
    expect(events.length).toBe(1);
    expect(events[0]).toMatchObject({
      sessionId: session.id,
      accountId: session.accountId,
    });
  });

  it("evaluateOverdue ignores sessions that are not past expectedEndAt", async () => {
    const repo = new InMemoryCheckInRepository();
    const bus = inMemoryEventBus();
    const service = new CheckInService(repo, fixedClock(NOW), bus);

    await service.start({
      accountId: newId(),
      trustedContactId: newId(),
      durationMinutes: 60,
    });

    const stillEarly = new Date(NOW.getTime() + 10 * 60_000);
    const overdue = await service.evaluateOverdue(stillEarly);
    expect(overdue.length).toBe(0);
  });

  it("triggerPanic publishes safety.panic", async () => {
    const repo = new InMemoryCheckInRepository();
    const bus = inMemoryEventBus();
    const service = new CheckInService(repo, fixedClock(NOW), bus);

    const events: unknown[] = [];
    bus.subscribe("safety.panic", (payload) => events.push(payload));

    const session = await service.start({
      accountId: newId(),
      trustedContactId: newId(),
      durationMinutes: 60,
    });
    const panicked = await service.triggerPanic(session.id);

    expect(panicked.status).toBe("panic");
    expect(events.length).toBe(1);
    expect(events[0]).toMatchObject({
      sessionId: session.id,
      accountId: session.accountId,
    });
  });
});
