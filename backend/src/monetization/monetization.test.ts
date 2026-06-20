import { describe, it, expect, beforeEach } from "vitest";
import { fixedClock } from "../core/testing";
import { InMemoryPlansRepository } from "./inMemoryPlansRepository";
import { InMemorySubscriptionsRepository } from "./inMemorySubscriptionsRepository";
import { InMemoryPlacementsRepository } from "./inMemoryPlacementsRepository";
import { PlansService } from "./plansService";
import { SubscriptionsService } from "./subscriptionsService";
import { PlacementsService } from "./placementsService";
import { FREE_PLAN_FEATURES } from "./types";

const NOW = new Date("2026-06-20T12:00:00.000Z");

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

describe("PlansService", () => {
  let plansRepo: InMemoryPlansRepository;
  let plans: PlansService;

  beforeEach(async () => {
    plansRepo = new InMemoryPlansRepository();
    plans = new PlansService(plansRepo);
    await plans.seed();
  });

  it("seeds and lists active plans", async () => {
    const active = await plans.listActive();
    expect(active.map((p) => p.key).sort()).toEqual([
      "basic",
      "free",
      "premium",
      "pro",
    ]);
  });

  it("getByKey returns the pro plan", async () => {
    const pro = await plans.getByKey("pro");
    expect(pro.key).toBe("pro");
    expect(pro.features.analytics).toBe(true);
    expect(pro.features.priorityRank).toBe(10);
  });

  it("getByKey throws NotFoundError for a missing key", async () => {
    const empty = new PlansService(new InMemoryPlansRepository());
    await expect(empty.getByKey("pro")).rejects.toMatchObject({
      code: "not_found",
    });
  });
});

describe("SubscriptionsService", () => {
  let plansRepo: InMemoryPlansRepository;
  let subRepo: InMemorySubscriptionsRepository;
  let subs: SubscriptionsService;

  beforeEach(async () => {
    plansRepo = new InMemoryPlansRepository();
    await new PlansService(plansRepo).seed();
    subRepo = new InMemorySubscriptionsRepository();
    subs = new SubscriptionsService(subRepo, plansRepo, fixedClock(NOW));
  });

  it("subscribe to pro sets currentPeriodEnd to now + intervalMonths", async () => {
    const pro = await new PlansService(plansRepo).getByKey("pro");
    const sub = await subs.subscribe("acct-1", "pro");
    expect(sub.status).toBe("active");
    expect(sub.startedAt.getTime()).toBe(NOW.getTime());
    expect(sub.currentPeriodEnd.getTime()).toBe(
      addMonths(NOW, pro.intervalMonths).getTime(),
    );
  });

  it("resolveEntitlements returns pro features for an active pro sub", async () => {
    await subs.subscribe("acct-1", "pro");
    const ent = await subs.resolveEntitlements("acct-1");
    expect(ent.analytics).toBe(true);
    expect(ent.priorityRank).toBe(10);
  });

  it("resolveEntitlements returns free features when there is no sub", async () => {
    const ent = await subs.resolveEntitlements("nobody");
    expect(ent).toEqual(FREE_PLAN_FEATURES);
  });

  it("activeFor returns the active subscription", async () => {
    const created = await subs.subscribe("acct-1", "basic");
    const active = await subs.activeFor("acct-1");
    expect(active?.id).toBe(created.id);
  });

  it("cancel sets cancelAtPeriodEnd true without changing status", async () => {
    const created = await subs.subscribe("acct-1", "basic");
    const cancelled = await subs.cancel(created.id);
    expect(cancelled.cancelAtPeriodEnd).toBe(true);
    expect(cancelled.status).toBe("active");
  });

  it("expireDue moves past-due active subs to expired", async () => {
    const created = await subs.subscribe("acct-1", "basic");
    const afterPeriod = new Date(created.currentPeriodEnd.getTime() + 1000);
    const count = await subs.expireDue(afterPeriod);
    expect(count).toBe(1);
    const stored = await subRepo.getById(created.id);
    expect(stored?.status).toBe("expired");
    expect(await subs.activeFor("acct-1")).toBeUndefined();
  });

  it("expireDue leaves not-yet-due subs active", async () => {
    const created = await subs.subscribe("acct-1", "basic");
    const beforePeriod = new Date(created.currentPeriodEnd.getTime() - 1000);
    const count = await subs.expireDue(beforePeriod);
    expect(count).toBe(0);
    const stored = await subRepo.getById(created.id);
    expect(stored?.status).toBe("active");
  });
});

describe("PlacementsService", () => {
  let repo: InMemoryPlacementsRepository;
  let placements: PlacementsService;

  beforeEach(() => {
    repo = new InMemoryPlacementsRepository();
    placements = new PlacementsService(repo, fixedClock(NOW));
  });

  it("purchase active within window, inactive before start and after end", async () => {
    const p = await placements.purchase("listing-1", "featured", 7);
    expect(p.startsAt.getTime()).toBe(NOW.getTime());

    const within = new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000);
    const before = new Date(NOW.getTime() - 1000);
    const after = new Date(NOW.getTime() + 8 * 24 * 60 * 60 * 1000);

    expect((await placements.activeFor("listing-1", within)).length).toBe(1);
    expect((await placements.activeFor("listing-1", before)).length).toBe(0);
    expect((await placements.activeFor("listing-1", after)).length).toBe(0);
  });

  it("activeFor excludes the exact end instant (half-open window)", async () => {
    const p = await placements.purchase("listing-1", "bump", 1);
    const atEnd = new Date(p.endsAt.getTime());
    expect((await placements.activeFor("listing-1", atEnd)).length).toBe(0);
    const atStart = new Date(p.startsAt.getTime());
    expect((await placements.activeFor("listing-1", atStart)).length).toBe(1);
  });

  it("isFeatured is true for an active featured placement", async () => {
    await placements.purchase("listing-1", "featured", 7);
    const within = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);
    expect(await placements.isFeatured("listing-1", within)).toBe(true);
  });

  it("isFeatured is false for a non-featured kind", async () => {
    await placements.purchase("listing-1", "bump", 7);
    const within = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);
    expect(await placements.isFeatured("listing-1", within)).toBe(false);
  });

  it("activeForCategory and activeForCity filter by slug and window", async () => {
    await placements.purchase("listing-1", "top_category", 7, {
      categorySlug: "escorts",
      citySlug: "london",
    });
    const within = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);
    expect((await placements.activeForCategory("escorts", within)).length).toBe(1);
    expect((await placements.activeForCity("london", within)).length).toBe(1);
    expect((await placements.activeForCategory("massage", within)).length).toBe(0);
  });

  it("purchase rejects non-positive durations", async () => {
    await expect(placements.purchase("listing-1", "bump", 0)).rejects.toMatchObject(
      { code: "validation_error" },
    );
  });
});
