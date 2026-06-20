import type { UUID } from "../core";

/**
 * A UK city used for location filtering and programmatic SEO. Holds no personal
 * data — purely geographic reference data.
 */
export interface City {
  id: UUID;
  slug: string;
  name: string;
  region: string;
  lat?: number | null;
  lng?: number | null;
}

/**
 * A generated programmatic-SEO landing page describing a category x city
 * combination (e.g. "Escorts in London"). Pure derived content; no personal data.
 */
export interface SeoPage {
  path: string;
  title: string;
  h1: string;
  metaDescription: string;
  categorySlug: string;
  citySlug: string;
}

/**
 * Seed list of real UK cities. Slugs are lowercased city names. Kept in sync
 * with migrations/0040_geo.sql.
 */
export const UK_CITY_SEED: ReadonlyArray<Omit<City, "id">> = [
  { slug: "london", name: "London", region: "Greater London", lat: 51.5074, lng: -0.1278 },
  { slug: "manchester", name: "Manchester", region: "North West", lat: 53.4808, lng: -2.2426 },
  { slug: "birmingham", name: "Birmingham", region: "West Midlands", lat: 52.4862, lng: -1.8904 },
  { slug: "leeds", name: "Leeds", region: "Yorkshire", lat: 53.8008, lng: -1.5491 },
  { slug: "bristol", name: "Bristol", region: "South West", lat: 51.4545, lng: -2.5879 },
  { slug: "glasgow", name: "Glasgow", region: "Scotland", lat: 55.8642, lng: -4.2518 },
  { slug: "liverpool", name: "Liverpool", region: "North West", lat: 53.4084, lng: -2.9916 },
  { slug: "edinburgh", name: "Edinburgh", region: "Scotland", lat: 55.9533, lng: -3.1883 },
];
