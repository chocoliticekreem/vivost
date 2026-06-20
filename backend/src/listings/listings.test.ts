import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError, fixedClock, newId } from "../core";
import { ListingsService } from "./listingsService";
import { InMemoryListingsRepository } from "./inMemoryListingsRepository";
import type { CreateListingInput } from "./types";

const NOW = new Date("2026-01-01T00:00:00.000Z");

function makeService() {
  const repo = new InMemoryListingsRepository();
  const service = new ListingsService(repo, fixedClock(NOW));
  return { repo, service };
}

function baseInput(overrides: Partial<CreateListingInput> = {}): CreateListingInput {
  return {
    name: "Listing",
    categorySlug: "category-a",
    location: "London",
    hourlyRate: 100,
    ...overrides,
  };
}

describe("ListingsService.create", () => {
  it("creates a listing in draft status", async () => {
    const { service } = makeService();
    const owner = newId();
    const listing = await service.create(owner, baseInput());

    expect(listing.status).toBe("draft");
    expect(listing.ownerAccountId).toBe(owner);
    expect(listing.name).toBe("Listing");
    expect(listing.photos).toEqual([]);
    expect(listing.attributes).toEqual([]);
    expect(listing.verified).toBe(false);
    expect(listing.createdAt).toEqual(NOW);
  });
});

describe("ListingsService ownership enforcement", () => {
  it("rejects update from a non-owner with ForbiddenError", async () => {
    const { service } = makeService();
    const owner = newId();
    const listing = await service.create(owner, baseInput());

    await expect(
      service.update(newId(), listing.id, { name: "Hacked" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects publish from a non-owner with ForbiddenError", async () => {
    const { service } = makeService();
    const owner = newId();
    const listing = await service.create(owner, baseInput());

    await expect(service.publish(newId(), listing.id)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("allows the owner to update", async () => {
    const { service } = makeService();
    const owner = newId();
    const listing = await service.create(owner, baseInput());

    const updated = await service.update(owner, listing.id, { name: "New Name" });
    expect(updated.name).toBe("New Name");
    expect(updated.status).toBe("draft");
  });

  it("throws NotFoundError updating a missing listing", async () => {
    const { service } = makeService();
    await expect(
      service.update(newId(), newId(), { name: "x" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("ListingsService status transitions", () => {
  it("publishes a draft listing to active", async () => {
    const { service } = makeService();
    const owner = newId();
    const listing = await service.create(owner, baseInput());

    const published = await service.publish(owner, listing.id);
    expect(published.status).toBe("active");
  });

  it("publishes a suspended listing back to active", async () => {
    const { service } = makeService();
    const owner = newId();
    const listing = await service.create(owner, baseInput());
    await service.publish(owner, listing.id);
    await service.suspend(owner, listing.id);

    const republished = await service.publish(owner, listing.id);
    expect(republished.status).toBe("active");
  });

  it("removes a listing (status -> removed)", async () => {
    const { service } = makeService();
    const owner = newId();
    const listing = await service.create(owner, baseInput());

    const removed = await service.remove(owner, listing.id);
    expect(removed.status).toBe("removed");
  });
});

describe("ListingsService queries", () => {
  it("listActive returns only active listings", async () => {
    const { service } = makeService();
    const owner = newId();
    const a = await service.create(owner, baseInput({ name: "A" }));
    const b = await service.create(owner, baseInput({ name: "B" }));
    await service.create(owner, baseInput({ name: "C" }));

    await service.publish(owner, a.id);
    await service.publish(owner, b.id);

    const active = await service.listActive();
    expect(active.map((l) => l.name).sort()).toEqual(["A", "B"]);
  });

  it("listByOwner filters by owner", async () => {
    const { service } = makeService();
    const owner1 = newId();
    const owner2 = newId();
    await service.create(owner1, baseInput({ name: "Owner1-A" }));
    await service.create(owner1, baseInput({ name: "Owner1-B" }));
    await service.create(owner2, baseInput({ name: "Owner2-A" }));

    const owner1Listings = await service.listByOwner(owner1);
    expect(owner1Listings).toHaveLength(2);
    expect(owner1Listings.every((l) => l.ownerAccountId === owner1)).toBe(true);

    const owner2Listings = await service.listByOwner(owner2);
    expect(owner2Listings).toHaveLength(1);
  });
});
