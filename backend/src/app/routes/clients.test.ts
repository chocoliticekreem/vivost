import Fastify from "fastify";
import { describe, it, expect } from "vitest";
import { createInMemoryContainer } from "../container";
import { registerErrorHandler } from "../errors";
import { fixedClock } from "../../core/testing";
import { registerClients } from "./clients";

function makeApp() {
  const c = createInMemoryContainer({ clock: fixedClock(new Date("2026-01-01T00:00:00.000Z")) });
  const app = Fastify();
  registerErrorHandler(app);
  registerClients(app, c);
  return app;
}

describe("clients routes", () => {
  it("POST /clients creates a client (201)", async () => {
    const app = makeApp();
    const res = await app.inject({
      method: "POST",
      url: "/clients",
      payload: { email: "booker@example.com" },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBeTruthy();
    expect(body.email).toBe("booker@example.com");
    expect(body.status).toBe("active");
  });

  it("GET /clients/:id returns the client", async () => {
    const app = makeApp();
    const created = (
      await app.inject({
        method: "POST",
        url: "/clients",
        payload: { email: "get@example.com" },
      })
    ).json();

    const res = await app.inject({ method: "GET", url: `/clients/${created.id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(created.id);
  });

  it("GET unknown id returns 404 with error code", async () => {
    const app = makeApp();
    const res = await app.inject({
      method: "GET",
      url: "/clients/00000000-0000-0000-0000-000000000000",
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBeTruthy();
  });

  it("POST /clients/:id/suspend transitions status", async () => {
    const app = makeApp();
    const created = (
      await app.inject({
        method: "POST",
        url: "/clients",
        payload: { email: "suspend@example.com" },
      })
    ).json();

    const suspended = await app.inject({
      method: "POST",
      url: `/clients/${created.id}/suspend`,
    });
    expect(suspended.statusCode).toBe(200);
    expect(suspended.json().status).toBe("suspended");
  });

  it("DELETE /clients/:id returns 204 then GET returns 404", async () => {
    const app = makeApp();
    const created = (
      await app.inject({
        method: "POST",
        url: "/clients",
        payload: { email: "delete@example.com" },
      })
    ).json();

    const del = await app.inject({ method: "DELETE", url: `/clients/${created.id}` });
    expect(del.statusCode).toBe(204);

    const after = await app.inject({ method: "GET", url: `/clients/${created.id}` });
    expect(after.statusCode).toBe(404);
    expect(after.json().error.code).toBeTruthy();
  });
});
