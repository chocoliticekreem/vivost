import Fastify from "fastify";
import { describe, it, expect } from "vitest";
import { createInMemoryContainer } from "../container";
import { registerErrorHandler } from "../errors";
import { fixedClock } from "../../core/testing";
import { registerReferrals } from "./referrals";

function makeApp() {
  const c = createInMemoryContainer({ clock: fixedClock(new Date("2026-01-01T00:00:00.000Z")) });
  const app = Fastify();
  registerErrorHandler(app);
  registerReferrals(app, c);
  return app;
}

const OWNER = "22222222-2222-2222-2222-222222222222";
const REFERRED = "33333333-3333-3333-3333-333333333333";

describe("referrals routes", () => {
  it("createCode -> recordSignup -> activate credits both owner and referred", async () => {
    const app = makeApp();

    const codeRes = await app.inject({
      method: "POST",
      url: "/referrals/codes",
      payload: { ownerAccountId: OWNER },
    });
    expect(codeRes.statusCode).toBe(201);
    const code = codeRes.json().code;
    expect(code).toBeTruthy();

    const signupRes = await app.inject({
      method: "POST",
      url: "/referrals/signups",
      payload: { code, referredAccountId: REFERRED },
    });
    expect(signupRes.statusCode).toBe(201);
    const referralId = signupRes.json().id;
    expect(signupRes.json().status).toBe("pending");

    const activateRes = await app.inject({
      method: "POST",
      url: `/referrals/${referralId}/activate`,
      payload: { rewardMinor: 500 },
    });
    expect(activateRes.statusCode).toBe(200);
    expect(activateRes.json().status).toBe("activated");

    const ownerBalance = await app.inject({
      method: "GET",
      url: `/accounts/${OWNER}/referrals/balance`,
    });
    expect(ownerBalance.statusCode).toBe(200);
    expect(ownerBalance.json().balanceMinor).toBe(500);

    const referredBalance = await app.inject({
      method: "GET",
      url: `/accounts/${REFERRED}/referrals/balance`,
    });
    expect(referredBalance.statusCode).toBe(200);
    expect(referredBalance.json().balanceMinor).toBe(500);
  });

  it("activate twice -> 409", async () => {
    const app = makeApp();
    const code = (
      await app.inject({
        method: "POST",
        url: "/referrals/codes",
        payload: { ownerAccountId: OWNER },
      })
    ).json().code;
    const referralId = (
      await app.inject({
        method: "POST",
        url: "/referrals/signups",
        payload: { code, referredAccountId: REFERRED },
      })
    ).json().id;

    const first = await app.inject({
      method: "POST",
      url: `/referrals/${referralId}/activate`,
      payload: { rewardMinor: 500 },
    });
    expect(first.statusCode).toBe(200);

    const second = await app.inject({
      method: "POST",
      url: `/referrals/${referralId}/activate`,
      payload: { rewardMinor: 500 },
    });
    expect(second.statusCode).toBe(409);
    expect(second.json().error.code).toBeTruthy();
  });

  it("recordSignup with unknown code -> 400", async () => {
    const app = makeApp();
    const res = await app.inject({
      method: "POST",
      url: "/referrals/signups",
      payload: { code: "NOPECODE", referredAccountId: REFERRED },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBeTruthy();
  });
});
