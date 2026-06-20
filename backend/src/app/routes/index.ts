import type { FastifyInstance } from "fastify";
import type { Container } from "../container";
import { registerHealth } from "./health";
import { registerListings } from "./listings";
import { registerAccounts } from "./accounts";
import { registerClients } from "./clients";
import { registerCatalog } from "./catalog";
import { registerMonetization } from "./monetization";
import { registerVerification } from "./verification";
import { registerPayments } from "./payments";
import { registerScreening } from "./screening";
import { registerSafety } from "./safety";
import { registerEnquiries } from "./enquiries";
import { registerReviews } from "./reviews";
import { registerAnalytics } from "./analytics";
import { registerReferrals } from "./referrals";
import { registerMessaging } from "./messaging";
import { registerModeration } from "./moderation";

export const allRegistrars: Array<(app: FastifyInstance, c: Container) => void> = [
  registerHealth,
  registerListings,
  registerAccounts,
  registerClients,
  registerCatalog,
  registerMonetization,
  registerVerification,
  registerPayments,
  registerScreening,
  registerSafety,
  registerEnquiries,
  registerReviews,
  registerAnalytics,
  registerReferrals,
  registerMessaging,
  registerModeration,
];
