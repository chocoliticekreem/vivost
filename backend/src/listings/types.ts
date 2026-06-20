import { z } from "zod";
import type { UUID } from "../core";

export type ListingStatus = "draft" | "active" | "suspended" | "removed";

export interface ListingAttribute {
  label: string;
  value: string;
}

export interface Listing {
  id: UUID;
  ownerAccountId: UUID;
  name: string;
  categorySlug: string;
  location: string;
  area?: string | null;
  hourlyRate: number;
  availability: string;
  imageColor: string;
  photos: string[];
  description: string;
  phone?: string | null;
  age?: number | null;
  gender?: string | null;
  ethnicity?: string | null;
  languages?: string[];
  services?: string[];
  verified: boolean;
  region?: string | null;
  sourceUrl?: string | null;
  attributes: ListingAttribute[];
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const attributeSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const createListingSchema = z.object({
  name: z.string().min(1),
  categorySlug: z.string().min(1),
  location: z.string().min(1),
  area: z.string().nullable().default(null),
  hourlyRate: z.number().nonnegative(),
  availability: z.string().default(""),
  imageColor: z.string().default(""),
  photos: z.array(z.string()).default([]),
  description: z.string().default(""),
  phone: z.string().nullable().default(null),
  age: z.number().int().nullable().default(null),
  gender: z.string().nullable().default(null),
  ethnicity: z.string().nullable().default(null),
  languages: z.array(z.string()).default([]),
  services: z.array(z.string()).default([]),
  verified: z.boolean().default(false),
  region: z.string().nullable().default(null),
  sourceUrl: z.string().nullable().default(null),
  attributes: z.array(attributeSchema).default([]),
});

export type CreateListingInput = z.input<typeof createListingSchema>;

export const updateListingSchema = createListingSchema.partial();

export type UpdateListingInput = z.input<typeof updateListingSchema>;
