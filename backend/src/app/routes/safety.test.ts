import Fastify from "fastify";
import { describe, it, expect } from "vitest";
import { createInMemoryContainer } from "../container";
import { registerErrorHandler } from "../errors";
import { fixedClock } from "../../core/testing";
import { registerSafety } from "./safety";

function makeApp() {
  const c = createInMemoryContainer({
    clock: fixedClock(new Date("2026-01-01T00:00:00.000Z")),
  });
  const app = Fastify();
  registerErrorHandler(app);
  registerSafety(app, c);
  return app;
}

const ACCOUNT_ID = "11111111-1111-1111-1111-111111111111";
const TRUSTED_CONTACT_ID = "33333333-3333-3333-3333-333333333333";

describe("safety routes", () => {
  it("bad-date report -> list", async () => {
    const app = makeApp();

    const reported = await app.inject({
      method: "POST",
      url: "/safety/bad-date-reports",
      payload: {
        reporterAccountId: ACCOUNT_ID,
        phone: "+44 7700 900111",
        description: "no-show, abusive",
        severity: "high",
      },
    });
    expect(reported.statusCode).toBe(201);
    expect(reported.json().id).toBeTruthy();

    const list = await app.inject({
      method: "GET",
      url: "/safety/bad-date-reports",
    });
    expect(list.statusCode).toBe(200);
    const body = list.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(1);
    expect(body[0].severity).toBe("high");
  });

  it("check-in start -> panic", async () => {
    const app = makeApp();

    const started = await app.inject({
      method: "POST",
      url: "/safety/check-ins",
      payload: {
        accountId: ACCOUNT_ID,
        trustedContactId: TRUSTED_CONTACT_ID,
        durationMinutes: 60,
      },
    });
    expect(started.statusCode).toBe(201);
    const session = started.json();
    expect(session.id).toBeTruthy();
    expect(session.status).toBe("active");

    const panic = await app.inject({
      method: "POST",
      url: `/safety/check-ins/${session.id}/panic`,
    });
    expect(panic.statusCode).toBe(200);
    expect(panic.json().status).toBe("panic");
  });
});
