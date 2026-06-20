import { z } from "zod";
import type { UUID } from "../core";

export type AccountRole = "advertiser" | "admin";
export type AccountStatus = "active" | "suspended" | "deleted";

/**
 * Account holds role/status only. Real-world identity (email) is GDPR-separated:
 * it lives conceptually in the `identity` schema and is referenced by the same
 * UUID. The in-memory repo may also carry `email` for test convenience; the pg
 * adapter keeps it in identity.account, never alongside activity data.
 */
export interface Account {
  id: UUID;
  email?: string | null;
  role: AccountRole;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const registerAccountSchema = z.object({
  email: z.string().email(),
  role: z.enum(["advertiser", "admin"]).default("advertiser"),
});

export type RegisterAccountInput = z.input<typeof registerAccountSchema>;
