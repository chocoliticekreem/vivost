import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { Container } from "../container";

const idParam = z.object({ id: z.string().uuid() });
const accountIdParam = z.object({ accountId: z.string().uuid() });

const createCodeBody = z.object({ ownerAccountId: z.string().uuid() });
const signupBody = z.object({
  code: z.string(),
  referredAccountId: z.string().uuid(),
});
const activateBody = z.object({ rewardMinor: z.number().int() });

export function registerReferrals(app: FastifyInstance, c: Container): void {
  app.post("/referrals/codes", async (req, reply) => {
    const { ownerAccountId } = createCodeBody.parse(req.body);
    const code = await c.referralsService.createCode(ownerAccountId);
    void reply.status(201);
    return code;
  });

  app.post("/referrals/signups", async (req, reply) => {
    const { code, referredAccountId } = signupBody.parse(req.body);
    const referral = await c.referralsService.recordSignup(code, referredAccountId);
    void reply.status(201);
    return referral;
  });

  app.post("/referrals/:id/activate", async (req) => {
    const { id } = idParam.parse(req.params);
    const { rewardMinor } = activateBody.parse(req.body);
    return c.referralsService.activate(id, rewardMinor);
  });

  app.get("/accounts/:accountId/referrals/balance", async (req) => {
    const { accountId } = accountIdParam.parse(req.params);
    const balance = await c.referralsService.balanceFor(accountId);
    return { accountId, balanceMinor: balance };
  });
}
