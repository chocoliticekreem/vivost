import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError, fixedClock } from "../core";
import { EnquiriesService } from "./enquiriesService";
import { InMemoryEnquiriesRepository } from "./inMemoryEnquiriesRepository";

const NOW = new Date("2026-01-01T00:00:00.000Z");
const LISTING_A = "11111111-1111-1111-1111-111111111111";
const LISTING_B = "22222222-2222-2222-2222-222222222222";

function makeService() {
  const repo = new InMemoryEnquiriesRepository();
  const service = new EnquiriesService(repo, fixedClock(NOW));
  return { repo, service };
}

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    listingId: LISTING_A,
    name: "Alex",
    preferredTime: "Friday evening",
    confirmedReadServices: true,
    message: "Would like to enquire about availability.",
    ...overrides,
  };
}

describe("EnquiriesService.submit", () => {
  it("rejects when confirmedReadServices is false", async () => {
    const { service } = makeService();
    await expect(
      service.submit(validInput({ confirmedReadServices: false })),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("stores a pending enquiry when confirmed", async () => {
    const { service } = makeService();
    const enquiry = await service.submit(validInput());
    expect(enquiry.status).toBe("pending");
    expect(enquiry.confirmedReadServices).toBe(true);
    expect(enquiry.clientId).toBeNull();
    expect(enquiry.createdAt).toEqual(NOW);
    expect(enquiry.updatedAt).toEqual(NOW);
    expect(enquiry.id).toBeTruthy();
  });
});

describe("EnquiriesService transitions", () => {
  it("accepts a pending enquiry", async () => {
    const { service } = makeService();
    const created = await service.submit(validInput());
    const accepted = await service.accept(created.id);
    expect(accepted.status).toBe("accepted");
  });

  it("declines a pending enquiry", async () => {
    const { service } = makeService();
    const created = await service.submit(validInput());
    const declined = await service.decline(created.id);
    expect(declined.status).toBe("declined");
  });

  it("throws NotFoundError on a missing enquiry", async () => {
    const { service } = makeService();
    await expect(
      service.accept("00000000-0000-0000-0000-000000000000"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("EnquiriesService.listForListing", () => {
  it("filters enquiries by listing", async () => {
    const { service } = makeService();
    await service.submit(validInput({ listingId: LISTING_A }));
    await service.submit(validInput({ listingId: LISTING_A }));
    await service.submit(validInput({ listingId: LISTING_B }));

    const forA = await service.listForListing(LISTING_A);
    const forB = await service.listForListing(LISTING_B);
    expect(forA).toHaveLength(2);
    expect(forB).toHaveLength(1);
    expect(forA.every((e) => e.listingId === LISTING_A)).toBe(true);
  });
});
