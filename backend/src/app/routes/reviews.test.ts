import Fastify from "fastify";
import { describe, it, expect } from "vitest";
import { createInMemoryContainer } from "../container";
import { registerErrorHandler } from "../errors";
import { fixedClock } from "../../core/testing";
import { registerReviews } from "./reviews";

const LISTING_ID = "33333333-3333-3333-3333-333333333333";
const CLIENT_ID = "44444444-4444-4444-4444-444444444444";

function makeApp() {
  const c = createInMemoryContainer({ clock: fixedClock(new Date("2026-01-01T00:00:00.000Z")) });
  const app = Fastify();
  registerErrorHandler(app);
  registerReviews(app, c);
  return app;
}

function reviewPayload(overrides: Record<string, unknown> = {}) {
  return {
    listingId: LISTING_ID,
    clientId: CLIENT_ID,
    rating: 5,
    comment: "Great experience.",
    ...overrides,
  };
}

describe("reviews routes", () => {
  it("POST /reviews with rating 6 returns 400", async () => {
    const app = makeApp();
    const res = await app.inject({
      method: "POST",
      url: "/reviews",
      payload: reviewPayload({ rating: 6 }),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBeTruthy();
  });

  it("POST /reviews with valid rating returns 201", async () => {
    const app = makeApp();
    const res = await app.inject({
      method: "POST",
      url: "/reviews",
      payload: reviewPayload(),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBeTruthy();
    expect(body.rating).toBe(5);
    expect(body.status).toBe("published");
  });

  it("GET /listings/:listingId/reviews returns reviews and correct average", async () => {
    const app = makeApp();
    await app.inject({ method: "POST", url: "/reviews", payload: reviewPayload({ rating: 4 }) });
    await app.inject({ method: "POST", url: "/reviews", payload: reviewPayload({ rating: 2 }) });

    const res = await app.inject({ method: "GET", url: `/listings/${LISTING_ID}/reviews` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.reviews.length).toBe(2);
    expect(body.average).toBe(3);
  });

  it("POST /reviews/:id/remove hides the review from listing", async () => {
    const app = makeApp();
    const created = (
      await app.inject({ method: "POST", url: "/reviews", payload: reviewPayload({ rating: 5 }) })
    ).json();

    const removed = await app.inject({ method: "POST", url: `/reviews/${created.id}/remove` });
    expect(removed.statusCode).toBe(200);
    expect(removed.json().status).toBe("removed");

    const res = await app.inject({ method: "GET", url: `/listings/${LISTING_ID}/reviews` });
    const body = res.json();
    expect(body.reviews.length).toBe(0);
    expect(body.average).toBe(0);
  });
});
