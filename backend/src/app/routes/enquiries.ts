import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { submitEnquirySchema } from "../../enquiries";
import { holdDepositSchema } from "../../deposits";
import type { Container } from "../container";

const idParam = z.object({ id: z.string().uuid() });
const listingIdParam = z.object({ listingId: z.string().uuid() });

export function registerEnquiries(app: FastifyInstance, c: Container): void {
  app.post("/enquiries", async (req, reply) => {
    const input = submitEnquirySchema.parse(req.body);
    const enquiry = await c.enquiriesService.submit(input);
    void reply.status(201);
    return enquiry;
  });

  app.post("/enquiries/:id/accept", async (req) => {
    const { id } = idParam.parse(req.params);
    return c.enquiriesService.accept(id);
  });

  app.post("/enquiries/:id/decline", async (req) => {
    const { id } = idParam.parse(req.params);
    return c.enquiriesService.decline(id);
  });

  app.get("/listings/:listingId/enquiries", async (req) => {
    const { listingId } = listingIdParam.parse(req.params);
    return c.enquiriesService.listForListing(listingId);
  });

  app.post("/deposits", async (req, reply) => {
    const input = holdDepositSchema.parse(req.body);
    const deposit = await c.depositsService.hold(input);
    void reply.status(201);
    return deposit;
  });

  app.post("/deposits/:id/release", async (req) => {
    const { id } = idParam.parse(req.params);
    return c.depositsService.release(id);
  });

  app.post("/deposits/:id/forfeit", async (req) => {
    const { id } = idParam.parse(req.params);
    return c.depositsService.forfeit(id);
  });
}
