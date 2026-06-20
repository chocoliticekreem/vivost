import { z } from "zod";
import type { UUID } from "../core";

export const planKeySchema = z.enum(["free", "basic", "pro", "premium"]);
export type PlanKey = z.infer<typeof planKeySchema>;

export const planFeaturesSchema = z.object({
  maxListings: z.number().int().nonnegative(),
  maxPhotos: z.number().int().nonnegative(),
  analytics: z.boolean(),
  verifiedBadgeIncluded: z.boolean(),
  priorityRank: z.number().int().nonnegative(),
});
export type PlanFeatures = z.infer<typeof planFeaturesSchema>;

export const planSchema = z.object({
  id: z.string(),
  key: planKeySchema,
  name: z.string(),
  priceMinor: z.number().int().nonnegative(),
  currency: z.string(),
  intervalMonths: z.number().int().positive(),
  features: planFeaturesSchema,
  active: z.boolean(),
});
export type Plan = z.infer<typeof planSchema>;

export const subscriptionStatusSchema = z.enum(["active", "cancelled", "expired"]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const subscriptionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  planId: z.string(),
  status: subscriptionStatusSchema,
  startedAt: z.date(),
  currentPeriodEnd: z.date(),
  cancelAtPeriodEnd: z.boolean(),
});
export type Subscription = z.infer<typeof subscriptionSchema>;

export const placementKindSchema = z.enum(["featured", "bump", "top_category"]);
export type PlacementKind = z.infer<typeof placementKindSchema>;

export const placementSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  kind: placementKindSchema,
  startsAt: z.date(),
  endsAt: z.date(),
  citySlug: z.string().nullable(),
  categorySlug: z.string().nullable(),
});
export type Placement = z.infer<typeof placementSchema>;

/**
 * Canonical seed plans. The same values are reflected in 0020_plans.sql.
 * priceMinor is in pence (GBP). intervalMonths is the billing period.
 */
export const SEED_PLANS: ReadonlyArray<Omit<Plan, "id">> = [
  {
    key: "free",
    name: "Free",
    priceMinor: 0,
    currency: "GBP",
    intervalMonths: 1,
    features: {
      maxListings: 1,
      maxPhotos: 3,
      analytics: false,
      verifiedBadgeIncluded: false,
      priorityRank: 0,
    },
    active: true,
  },
  {
    key: "basic",
    name: "Basic",
    priceMinor: 1499,
    currency: "GBP",
    intervalMonths: 1,
    features: {
      maxListings: 3,
      maxPhotos: 10,
      analytics: false,
      verifiedBadgeIncluded: false,
      priorityRank: 5,
    },
    active: true,
  },
  {
    key: "pro",
    name: "Pro",
    priceMinor: 3900,
    currency: "GBP",
    intervalMonths: 1,
    features: {
      maxListings: 10,
      maxPhotos: 30,
      analytics: true,
      verifiedBadgeIncluded: false,
      priorityRank: 10,
    },
    active: true,
  },
  {
    key: "premium",
    name: "Premium",
    priceMinor: 11900,
    currency: "GBP",
    intervalMonths: 1,
    features: {
      maxListings: 25,
      maxPhotos: 60,
      analytics: true,
      verifiedBadgeIncluded: true,
      priorityRank: 20,
    },
    active: true,
  },
];

export const FREE_PLAN_FEATURES: PlanFeatures = {
  maxListings: 1,
  maxPhotos: 3,
  analytics: false,
  verifiedBadgeIncluded: false,
  priorityRank: 0,
};

export type { UUID };
