import { describe, it, expect, beforeEach } from "vitest";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { newId } from "../../core";
import { fixedClock } from "../../core/testing";
import { createInMemoryContainer } from "../container";
import { registerErrorHandler } from "../errors";
import { registerPayments } from "./payments";

const CLOCK = fixedClock(new Date("2024-01-01T00:00:00.000Z"));

function buildHarness(): FastifyInstance {
  const app = Fastify({ logger: false });
  registerErrorHandler(app);
  registerPayments(app, createInMemoryContainer({ clock: CLOCK }));
  return app;
}

function checkoutBody(reference: string) {
  return {
    accountId: newId(),
    kind: "subscription",
    amountMinor: 9900,
    currency: "GBP",
    reference,
  };
}

describe("payments routes", () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = buildHarness();
  });

  it("POST /payments/checkout creates a payment (201, created)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/payments/checkout",
      payload: checkoutBody("sub-clean"),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.url).toBeTruthy();
    expect(body.payment.id).toBeTruthy();
    expect(body.payment.status).toBe("created");
  });

  it("POST /payments/settle on a clean reference marks paid", async () => {
    const { payment } = (
      await app.inject({
        method: "POST",
        url: "/payments/checkout",
        payload: checkoutBody("sub-clean"),
      })
    ).json();

    const res = await app.inject({
      method: "POST",
      url: "/payments/settle",
      payload: { checkoutId: payment.checkoutId },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("paid");
  });

  it("POST /payments/settle on a 'fail' reference marks failed", async () => {
    const { payment } = (
      await app.inject({
        method: "POST",
        url: "/payments/checkout",
        payload: checkoutBody("sub-should-fail"),
      })
    ).json();

    const res = await app.inject({
      method: "POST",
      url: "/payments/settle",
      payload: { checkoutId: payment.checkoutId },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("failed");
  });

  it("POST /payments/:id/refund marks refunded", async () => {
    const { payment } = (
      await app.inject({
        method: "POST",
        url: "/payments/checkout",
        payload: checkoutBody("sub-clean"),
      })
    ).json();

    const res = await app.inject({
      method: "POST",
      url: `/payments/${payment.id}/refund`,
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("refunded");
  });
});
