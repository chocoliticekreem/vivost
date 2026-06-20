import { z } from "zod";
import type { UUID } from "../core";

export type ClientStatus = "active" | "suspended" | "deleted";

/**
 * Client is a customer/booker account. Role/status only. Real-world identity
 * (email) is GDPR-separated: it lives conceptually in the `identity` schema and
 * is referenced by the same UUID. The in-memory repo may also carry `email` for
 * test convenience; the pg adapter keeps it in identity.client, never alongside
 * activity data.
 */
export interface Client {
  id: UUID;
  email?: string | null;
  status: ClientStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const registerClientSchema = z.object({
  email: z.string().email(),
});

export type RegisterClientInput = z.input<typeof registerClientSchema>;
