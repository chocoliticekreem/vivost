import Fastify from "fastify";
import { describe, it, expect } from "vitest";
import { createInMemoryContainer } from "../container";
import { registerErrorHandler } from "../errors";
import { fixedClock } from "../../core/testing";
import { registerAccounts } from "./accounts";

function makeApp() {
  const c = createInMemoryContainer({ clock: fixedClock(new Date("2026-01-01T00:00:00.000Z")) });
  const app = Fastify();
  registerErrorHandler(app);
  registerAccounts(app, c);
  return app;
}

describe("accounts routes", () => {
  it("POST /accounts creates an account (201)", async () => {
    const app = makeApp();
    const res = await app.inject({
      method: "POST",
      url: "/accounts",
      payload: { email: "advertiser@example.com", role: "advertiser" },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBeTruthy();
    expect(body.email).toBe("advertiser@example.com");
    expect(body.role).toBe("advertiser");
    expect(body.status).toBe("active");
  });

  it("GET /accounts/:id returns the account", async () => {
    const app = makeApp();
    const created = (
      await app.inject({
        method: "POST",
        url: "/accounts",
        payload: { email: "get@example.com", role: "advertiser" },
      })
    ).json();

    const res = await app.inject({ method: "GET", url: `/accounts/${created.id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(created.id);
  });

  it("GET unknown id returns 404 with error code", async () => {
    const app = makeApp();
    const res = await app.inject({
      method: "GET",
      url: "/accounts/00000000-0000-0000-0000-000000000000",
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBeTruthy();
  });

  it("POST /accounts/:id/suspend then reactivate transitions status", async () => {
    const app = makeApp();
    const created = (
      await app.inject({
        method: "POST",
        url: "/accounts",
        payload: { email: "suspend@example.com", role: "advertiser" },
      })
    ).json();

    const suspended = await app.inject({
      method: "POST",
      url: `/accounts/${created.id}/suspend`,
    });
    expect(suspended.statusCode).toBe(200);
    expect(suspended.json().status).toBe("suspended");

    const reactivated = await app.inject({
      method: "POST",
      url: `/accounts/${created.id}/reactivate`,
    });
    expect(reactivated.statusCode).toBe(200);
    expect(reactivated.json().status).toBe("active");
  });

  it("DELETE /accounts/:id returns 204 then GET returns 404", async () => {
    const app = makeApp();
    const created = (
      await app.inject({
        method: "POST",
        url: "/accounts",
        payload: { email: "delete@example.com", role: "advertiser" },
      })
    ).json();

    const del = await app.inject({ method: "DELETE", url: `/accounts/${created.id}` });
    expect(del.statusCode).toBe(204);

    const after = await app.inject({ method: "GET", url: `/accounts/${created.id}` });
    expect(after.statusCode).toBe(404);
    expect(after.json().error.code).toBeTruthy();
  });
});
