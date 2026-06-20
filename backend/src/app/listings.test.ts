import { describe, it, expect, beforeEach } from "vitest";
import { fixedClock, newId } from "../core";
import { createInMemoryContainer } from "./container";
import { buildServer } from "./server";
import type { FastifyInstance } from "fastify";

const CLOCK = fixedClock(new Date("2024-01-01T00:00:00.000Z"));

function makeListingBody(ownerAccountId: string) {
  return {
    ownerAccountId,
    name: "Test Listing",
    categorySlug: "escorts",
    location: "London",
    hourlyRate: 150,
  };
}

describe("app HTTP layer (listings reference route)", () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = buildServer(createInMemoryContainer({ clock: CLOCK }));
  });

  it("GET /health returns ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });

  it("POST /listings creates a draft listing (201)", async () => {
    const owner = newId();
    const res = await app.inject({
      method: "POST",
      url: "/listings",
      payload: makeListingBody(owner),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBeTruthy();
    expect(body.ownerAccountId).toBe(owner);
    expect(body.status).toBe("draft");
    expect(body.name).toBe("Test Listing");
  });

  it("GET /listings/:id returns a created listing", async () => {
    const owner = newId();
    const created = (
      await app.inject({ method: "POST", url: "/listings", payload: makeListingBody(owner) })
    ).json();

    const res = await app.inject({ method: "GET", url: `/listings/${created.id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(created.id);
  });

  it("GET /listings/:id with unknown id returns 404 with error code", async () => {
    const res = await app.inject({ method: "GET", url: `/listings/${newId()}` });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("not_found");
  });

  it("POST /listings/:id/publish flips status to active", async () => {
    const owner = newId();
    const created = (
      await app.inject({ method: "POST", url: "/listings", payload: makeListingBody(owner) })
    ).json();

    const res = await app.inject({
      method: "POST",
      url: `/listings/${created.id}/publish`,
      payload: { actorAccountId: owner },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("active");
  });

  it("PATCH /listings/:id by a non-owner returns 403", async () => {
    const owner = newId();
    const created = (
      await app.inject({ method: "POST", url: "/listings", payload: makeListingBody(owner) })
    ).json();

    const res = await app.inject({
      method: "PATCH",
      url: `/listings/${created.id}`,
      payload: { actorAccountId: newId(), patch: { name: "Hijacked" } },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("forbidden");
  });
});
