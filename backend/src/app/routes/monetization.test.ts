import Fastify from "fastify";
import { describe, it, expect } from "vitest";
import { createInMemoryContainer } from "../container";
import { registerErrorHandler } from "../errors";
import { fixedClock } from "../../core/testing";
import { registerMonetization } from "./monetization";

function makeApp() {
  const c = createInMemoryContainer({ clock: fixedClock(new Date("2026-01-01T00:00:00.000Z")) });
  const app = Fastify();
  registerErrorHandler(app);
  registerMonetization(app, c);
  return app;
}

describe("monetization routes", () => {
  it("GET /plans returns the seeded plans", async () => {
    const app = makeApp();
    const res = await app.inject({ method: "GET", url: "/plans" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    const keys = body.map((p: { key: string }) => p.key).sort();
    expect(keys).toEqual(["basic", "free", "premium", "pro"]);
  });

  it("POST /subscriptions then GET entitlements reflects the plan", async () => {
    const app = makeApp();
    const accountId = "11111111-1111-1111-1111-111111111111";

    const sub = await app.inject({
      method: "POST",
      url: "/subscriptions",
      payload: { accountId, planKey: "pro" },
    });
    expect(sub.statusCode).toBe(201);
    expect(sub.json().status).toBe("active");

    const ent = await app.inject({
      method: "GET",
      url: `/accounts/${accountId}/entitlements`,
    });
    expect(ent.statusCode).toBe(200);
    const features = ent.json();
    expect(features.priorityRank).toBe(10);
    expect(features.analytics).toBe(true);
  });

  it("POST /subscriptions/:id/cancel sets cancelAtPeriodEnd", async () => {
    const app = makeApp();
    const sub = (
      await app.inject({
        method: "POST",
        url: "/subscriptions",
        payload: { accountId: "22222222-2222-2222-2222-222222222222", planKey: "basic" },
      })
    ).json();

    const cancelled = await app.inject({
      method: "POST",
      url: `/subscriptions/${sub.id}/cancel`,
    });
    expect(cancelled.statusCode).toBe(200);
    expect(cancelled.json().cancelAtPeriodEnd).toBe(true);
  });

  it("POST /placements then GET listing placements returns it", async () => {
    const app = makeApp();
    const listingId = "33333333-3333-3333-3333-333333333333";

    const placement = await app.inject({
      method: "POST",
      url: "/placements",
      payload: { listingId, kind: "featured", durationDays: 7 },
    });
    expect(placement.statusCode).toBe(201);
    expect(placement.json().kind).toBe("featured");

    const active = await app.inject({
      method: "GET",
      url: `/listings/${listingId}/placements`,
    });
    expect(active.statusCode).toBe(200);
    const body = active.json();
    expect(body).toHaveLength(1);
    expect(body[0].listingId).toBe(listingId);
  });
});
