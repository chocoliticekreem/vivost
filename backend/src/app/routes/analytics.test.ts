import Fastify from "fastify";
import { describe, it, expect } from "vitest";
import { createInMemoryContainer } from "../container";
import { registerErrorHandler } from "../errors";
import { fixedClock } from "../../core/testing";
import { registerAnalytics } from "./analytics";

function makeApp() {
  const c = createInMemoryContainer({ clock: fixedClock(new Date("2026-01-01T00:00:00.000Z")) });
  const app = Fastify();
  registerErrorHandler(app);
  registerAnalytics(app, c);
  return app;
}

const LISTING = "11111111-1111-1111-1111-111111111111";

async function record(app: ReturnType<typeof makeApp>, type: string) {
  return app.inject({
    method: "POST",
    url: "/analytics/events",
    payload: { listingId: LISTING, type },
  });
}

describe("analytics routes", () => {
  it("POST /analytics/events records an event (201)", async () => {
    const app = makeApp();
    const res = await record(app, "view");
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBeTruthy();
    expect(body.listingId).toBe(LISTING);
    expect(body.type).toBe("view");
  });

  it("GET funnel reflects recorded views/contacts/conversions with rates", async () => {
    const app = makeApp();
    await record(app, "view");
    await record(app, "view");
    await record(app, "view");
    await record(app, "view");
    await record(app, "contact");
    await record(app, "contact");
    await record(app, "conversion");

    const res = await app.inject({ method: "GET", url: `/listings/${LISTING}/analytics` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.views).toBe(4);
    expect(body.contacts).toBe(2);
    expect(body.conversions).toBe(1);
    expect(body.contactRate).toBe(0.5);
    expect(body.conversionRate).toBe(0.5);
  });

  it("GET /analytics/top returns listing ids ordered by views", async () => {
    const app = makeApp();
    await record(app, "view");
    const res = await app.inject({ method: "GET", url: "/analytics/top?limit=5" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toContain(LISTING);
  });
});
