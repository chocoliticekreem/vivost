import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError, fixedClock } from "../core";
import { ReviewsService } from "./reviewsService";
import { InMemoryReviewsRepository } from "./inMemoryReviewsRepository";

const NOW = new Date("2026-01-01T00:00:00.000Z");
const LISTING = "11111111-1111-1111-1111-111111111111";
const CLIENT = "22222222-2222-2222-2222-222222222222";

function makeService() {
  const repo = new InMemoryReviewsRepository();
  const service = new ReviewsService(repo, fixedClock(NOW));
  return { repo, service };
}

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    listingId: LISTING,
    clientId: CLIENT,
    rating: 5,
    comment: "Great experience.",
    ...overrides,
  };
}

describe("ReviewsService.submit", () => {
  it("rejects rating 0", async () => {
    const { service } = makeService();
    await expect(
      service.submit(validInput({ rating: 0 })),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects rating 6", async () => {
    const { service } = makeService();
    await expect(
      service.submit(validInput({ rating: 6 })),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("publishes a valid review", async () => {
    const { service } = makeService();
    const review = await service.submit(validInput({ rating: 4 }));
    expect(review.status).toBe("published");
    expect(review.rating).toBe(4);
    expect(review.createdAt).toEqual(NOW);
  });
});

describe("ReviewsService.averageRating", () => {
  it("returns 0 when there are no reviews", async () => {
    const { service } = makeService();
    expect(await service.averageRating(LISTING)).toBe(0);
  });

  it("computes the mean of published reviews", async () => {
    const { service } = makeService();
    await service.submit(validInput({ rating: 2 }));
    await service.submit(validInput({ rating: 4 }));
    expect(await service.averageRating(LISTING)).toBe(3);
  });

  it("excludes removed reviews from the average", async () => {
    const { service } = makeService();
    await service.submit(validInput({ rating: 2 }));
    const removable = await service.submit(validInput({ rating: 4 }));
    await service.moderateRemove(removable.id);
    expect(await service.averageRating(LISTING)).toBe(2);
  });
});

describe("ReviewsService.moderateRemove", () => {
  it("hides a removed review from listForListing", async () => {
    const { service } = makeService();
    const review = await service.submit(validInput());
    await service.moderateRemove(review.id);
    const listed = await service.listForListing(LISTING);
    expect(listed).toHaveLength(0);
  });

  it("throws NotFoundError on a missing review", async () => {
    const { service } = makeService();
    await expect(
      service.moderateRemove("00000000-0000-0000-0000-000000000000"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
