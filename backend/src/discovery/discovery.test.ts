import { describe, it, expect } from "vitest";
import { scoreItem, rankItems } from "./ranking";
import { search } from "./discoveryService";
import type { RankItem } from "./types";

const NOW = new Date("2026-06-20T12:00:00.000Z");

function item(overrides: Partial<RankItem> = {}): RankItem {
  return {
    listingId: overrides.listingId ?? "00000000-0000-0000-0000-000000000000",
    categorySlug: "escorts",
    location: "London",
    citySlug: "london",
    name: "Alex",
    description: "Friendly companion",
    hourlyRate: 200,
    createdAt: NOW,
    isFeatured: false,
    priorityRank: 0,
    verified: false,
    freeTier: false,
    ...overrides,
  };
}

describe("ranking", () => {
  it("featured item outranks non-featured", () => {
    const featured = item({ listingId: "a", isFeatured: true });
    const plain = item({ listingId: "b", isFeatured: false });
    const ranked = rankItems([plain, featured], NOW);
    expect(ranked[0]!.listingId).toBe("a");
  });

  it("higher priorityRank outranks lower", () => {
    const high = item({ listingId: "a", priorityRank: 5 });
    const low = item({ listingId: "b", priorityRank: 1 });
    const ranked = rankItems([low, high], NOW);
    expect(ranked[0]!.listingId).toBe("a");
  });

  it("verified breaks ties", () => {
    const verified = item({ listingId: "a", verified: true });
    const unverified = item({ listingId: "b", verified: false });
    expect(scoreItem(verified, NOW)).toBeGreaterThan(scoreItem(unverified, NOW));
    const ranked = rankItems([unverified, verified], NOW);
    expect(ranked[0]!.listingId).toBe("a");
  });

  it("free-tier is penalised vs paid", () => {
    const paid = item({ listingId: "a", freeTier: false });
    const free = item({ listingId: "b", freeTier: true });
    expect(scoreItem(paid, NOW)).toBeGreaterThan(scoreItem(free, NOW));
    const ranked = rankItems([free, paid], NOW);
    expect(ranked[0]!.listingId).toBe("a");
  });
});

describe("search", () => {
  const items = [
    item({ listingId: "a", categorySlug: "escorts", location: "London", hourlyRate: 150, description: "yoga lover" }),
    item({ listingId: "b", categorySlug: "massage", location: "Manchester", hourlyRate: 300, description: "deep tissue" }),
    item({ listingId: "c", categorySlug: "escorts", location: "Greater London", hourlyRate: 250, description: "wine and dine" }),
  ];

  it("filters by category", () => {
    const result = search(items, { categorySlug: "massage" }, NOW);
    expect(result.map((r) => r.listingId)).toEqual(["b"]);
  });

  it("filters by maxRate", () => {
    const result = search(items, { maxRate: 200 }, NOW);
    expect(result.map((r) => r.listingId)).toEqual(["a"]);
  });

  it("matches keyword in description", () => {
    const result = search(items, { keyword: "tissue" }, NOW);
    expect(result.map((r) => r.listingId)).toEqual(["b"]);
  });

  it("location filter is case-insensitive substring", () => {
    const result = search(items, { location: "london" }, NOW);
    expect(result.map((r) => r.listingId).sort()).toEqual(["a", "c"]);
  });

  it("sorts rate_asc by hourlyRate ascending", () => {
    const result = search(items, { sort: "rate_asc" }, NOW);
    expect(result.map((r) => r.hourlyRate)).toEqual([150, 250, 300]);
  });
});
