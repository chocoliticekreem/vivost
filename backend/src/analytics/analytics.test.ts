import { describe, expect, it } from "vitest";
import { fixedClock } from "../core";
import { AnalyticsService } from "./analyticsService";
import { InMemoryAnalyticsRepository } from "./inMemoryAnalyticsRepository";

const NOW = new Date("2026-01-01T00:00:00.000Z");

function makeService() {
  const repo = new InMemoryAnalyticsRepository();
  const service = new AnalyticsService(repo, fixedClock(NOW));
  return { repo, service };
}

const L1 = "11111111-1111-1111-1111-111111111111";
const L2 = "22222222-2222-2222-2222-222222222222";

describe("AnalyticsService.record", () => {
  it("stores an event at the clock time with no PII default", async () => {
    const { service } = makeService();
    const event = await service.record(L1, "view");
    expect(event.listingId).toBe(L1);
    expect(event.type).toBe("view");
    expect(event.at).toEqual(NOW);
    expect(event.sessionHash).toBeNull();
    expect(event.id).toBeTruthy();
  });

  it("keeps a provided session hash", async () => {
    const { service } = makeService();
    const event = await service.record(L1, "view", "abc123hash");
    expect(event.sessionHash).toBe("abc123hash");
  });
});

describe("AnalyticsService.funnelFor", () => {
  it("computes counts and rates correctly", async () => {
    const { service } = makeService();
    for (let i = 0; i < 10; i++) await service.record(L1, "view");
    for (let i = 0; i < 2; i++) await service.record(L1, "contact");
    await service.record(L1, "conversion");

    const funnel = await service.funnelFor(L1);
    expect(funnel.views).toBe(10);
    expect(funnel.contacts).toBe(2);
    expect(funnel.conversions).toBe(1);
    expect(funnel.contactRate).toBe(0.2);
    expect(funnel.conversionRate).toBe(0.5);
  });

  it("returns zero rates when denominators are zero", async () => {
    const { service } = makeService();
    const funnel = await service.funnelFor(L1);
    expect(funnel.views).toBe(0);
    expect(funnel.contactRate).toBe(0);
    expect(funnel.conversionRate).toBe(0);
  });

  it("isolates counts per listing", async () => {
    const { service } = makeService();
    await service.record(L1, "view");
    await service.record(L2, "view");
    await service.record(L2, "view");
    expect((await service.funnelFor(L1)).views).toBe(1);
    expect((await service.funnelFor(L2)).views).toBe(2);
  });
});

describe("AnalyticsService.topListings", () => {
  it("orders listing ids by view count descending", async () => {
    const { service } = makeService();
    await service.record(L1, "view");
    await service.record(L2, "view");
    await service.record(L2, "view");
    await service.record(L2, "view");

    const top = await service.topListings(10);
    expect(top).toEqual([L2, L1]);
  });

  it("respects the limit", async () => {
    const { service } = makeService();
    await service.record(L1, "view");
    await service.record(L2, "view");
    await service.record(L2, "view");

    const top = await service.topListings(1);
    expect(top).toEqual([L2]);
  });
});
