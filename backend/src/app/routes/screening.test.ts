import Fastify from "fastify";
import { describe, it, expect } from "vitest";
import { createInMemoryContainer } from "../container";
import { registerErrorHandler } from "../errors";
import { fixedClock } from "../../core/testing";
import { registerScreening } from "./screening";

function makeApp() {
  const c = createInMemoryContainer({
    clock: fixedClock(new Date("2026-01-01T00:00:00.000Z")),
  });
  const app = Fastify();
  registerErrorHandler(app);
  registerScreening(app, c);
  return app;
}

const ACCOUNT_ID = "11111111-1111-1111-1111-111111111111";
const CLIENT_ID = "22222222-2222-2222-2222-222222222222";

describe("screening routes", () => {
  it("reverse-check returns 0 matches before any report, >=1 after a report", async () => {
    const app = makeApp();

    const before = await app.inject({
      method: "POST",
      url: "/reverse-check",
      payload: { phone: "+44 7700 900000" },
    });
    expect(before.statusCode).toBe(200);
    expect(before.json().matches).toBe(0);
    expect(before.json().reasons).toEqual([]);

    const reported = await app.inject({
      method: "POST",
      url: "/offender-reports",
      payload: {
        phone: "+44 7700 900000",
        reason: "fraud",
        reportedByAccountId: ACCOUNT_ID,
      },
    });
    expect(reported.statusCode).toBe(201);
    expect(reported.json().id).toBeTruthy();

    const after = await app.inject({
      method: "POST",
      url: "/reverse-check",
      payload: { phone: "+44 7700 900000" },
    });
    expect(after.statusCode).toBe(200);
    expect(after.json().matches).toBeGreaterThanOrEqual(1);
    expect(after.json().reasons).toContain("fraud");
  });

  it("screening request -> verify -> GET shows verified", async () => {
    const app = makeApp();

    const requested = await app.inject({
      method: "POST",
      url: `/clients/${CLIENT_ID}/screening/request`,
    });
    expect(requested.statusCode).toBe(201);
    expect(requested.json().verified).toBe(false);

    const verified = await app.inject({
      method: "POST",
      url: `/clients/${CLIENT_ID}/screening/verify`,
    });
    expect(verified.statusCode).toBe(200);
    expect(verified.json().verified).toBe(true);

    const status = await app.inject({
      method: "GET",
      url: `/clients/${CLIENT_ID}/screening`,
    });
    expect(status.statusCode).toBe(200);
    expect(status.json().verified).toBe(true);
  });
});
