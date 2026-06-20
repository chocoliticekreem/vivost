import Fastify from "fastify";
import { describe, it, expect } from "vitest";
import { createInMemoryContainer } from "../container";
import { registerErrorHandler } from "../errors";
import { fixedClock } from "../../core/testing";
import { registerEnquiries } from "./enquiries";

const LISTING_ID = "11111111-1111-1111-1111-111111111111";
const CLIENT_ID = "22222222-2222-2222-2222-222222222222";

function makeApp() {
  const c = createInMemoryContainer({ clock: fixedClock(new Date("2026-01-01T00:00:00.000Z")) });
  const app = Fastify();
  registerErrorHandler(app);
  registerEnquiries(app, c);
  return app;
}

function enquiryPayload(overrides: Record<string, unknown> = {}) {
  return {
    listingId: LISTING_ID,
    clientId: CLIENT_ID,
    name: "Alex",
    preferredTime: "Friday 8pm",
    confirmedReadServices: true,
    references: null,
    message: "Hello, I'd like to enquire.",
    ...overrides,
  };
}

describe("enquiries routes", () => {
  it("POST /enquiries with confirmedReadServices=false returns 400", async () => {
    const app = makeApp();
    const res = await app.inject({
      method: "POST",
      url: "/enquiries",
      payload: enquiryPayload({ confirmedReadServices: false }),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBeTruthy();
  });

  it("POST /enquiries with confirmedReadServices=true returns 201", async () => {
    const app = makeApp();
    const res = await app.inject({
      method: "POST",
      url: "/enquiries",
      payload: enquiryPayload(),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBeTruthy();
    expect(body.status).toBe("pending");
    expect(body.confirmedReadServices).toBe(true);
  });

  it("POST /enquiries/:id/accept transitions to accepted", async () => {
    const app = makeApp();
    const created = (
      await app.inject({ method: "POST", url: "/enquiries", payload: enquiryPayload() })
    ).json();

    const res = await app.inject({ method: "POST", url: `/enquiries/${created.id}/accept` });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("accepted");
  });

  it("POST /enquiries/:id/decline transitions to declined", async () => {
    const app = makeApp();
    const created = (
      await app.inject({ method: "POST", url: "/enquiries", payload: enquiryPayload() })
    ).json();

    const res = await app.inject({ method: "POST", url: `/enquiries/${created.id}/decline` });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("declined");
  });

  it("GET /listings/:listingId/enquiries lists submitted enquiries", async () => {
    const app = makeApp();
    await app.inject({ method: "POST", url: "/enquiries", payload: enquiryPayload() });

    const res = await app.inject({ method: "GET", url: `/listings/${LISTING_ID}/enquiries` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(1);
    expect(body[0].listingId).toBe(LISTING_ID);
  });

  it("POST /deposits holds a deposit (201) and release transitions to released", async () => {
    const app = makeApp();
    const enquiry = (
      await app.inject({ method: "POST", url: "/enquiries", payload: enquiryPayload() })
    ).json();

    const held = await app.inject({
      method: "POST",
      url: "/deposits",
      payload: { enquiryId: enquiry.id, amountMinor: 5000, currency: "GBP" },
    });
    expect(held.statusCode).toBe(201);
    const deposit = held.json();
    expect(deposit.id).toBeTruthy();
    expect(deposit.status).toBe("held");
    expect(deposit.amountMinor).toBe(5000);

    const released = await app.inject({
      method: "POST",
      url: `/deposits/${deposit.id}/release`,
    });
    expect(released.statusCode).toBe(200);
    expect(released.json().status).toBe("released");
  });

  it("POST /deposits/:id/forfeit transitions to forfeited", async () => {
    const app = makeApp();
    const enquiry = (
      await app.inject({ method: "POST", url: "/enquiries", payload: enquiryPayload() })
    ).json();
    const deposit = (
      await app.inject({
        method: "POST",
        url: "/deposits",
        payload: { enquiryId: enquiry.id, amountMinor: 5000, currency: "GBP" },
      })
    ).json();

    const res = await app.inject({ method: "POST", url: `/deposits/${deposit.id}/forfeit` });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("forfeited");
  });
});
