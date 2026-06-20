import { describe, it, expect, beforeEach } from "vitest";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { newId } from "../../core";
import { fixedClock } from "../../core/testing";
import { createInMemoryContainer } from "../container";
import { registerErrorHandler } from "../errors";
import { registerVerification } from "./verification";

const CLOCK = fixedClock(new Date("2024-01-01T00:00:00.000Z"));

function buildHarness(): FastifyInstance {
  const app = Fastify({ logger: false });
  registerErrorHandler(app);
  registerVerification(app, createInMemoryContainer({ clock: CLOCK }));
  return app;
}

describe("verification routes", () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = buildHarness();
  });

  it("POST /verification starts a pending verification (201)", async () => {
    const subjectId = newId();
    const res = await app.inject({
      method: "POST",
      url: "/verification",
      payload: { subjectId, subjectType: "account", method: "photo_id" },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBeTruthy();
    expect(body.subjectId).toBe(subjectId);
    expect(body.status).toBe("pending");
  });

  it("GET /verification/subject/:subjectId returns composed status", async () => {
    const subjectId = newId();
    await app.inject({
      method: "POST",
      url: "/verification",
      payload: { subjectId, subjectType: "account", method: "photo_id" },
    });

    const res = await app.inject({
      method: "GET",
      url: `/verification/subject/${subjectId}`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.isVerified).toBe(false);
    expect(body.status).toBe("pending");
    expect(body.badge).toBeNull();
  });
});
