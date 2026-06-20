import type { UUID } from "../core";

/**
 * Plain ranking input. Discovery is a pure domain: it never imports listings or
 * monetization. Callers project their data into RankItem and pass it in, so
 * discovery has no cross-domain dependencies and needs no database for tests.
 */
export interface RankItem {
  listingId: UUID;
  categorySlug: string;
  location: string;
  citySlug?: string | null;
  name: string;
  description: string;
  hourlyRate: number;
  createdAt: Date;
  isFeatured: boolean;
  priorityRank: number;
  verified: boolean;
  freeTier: boolean;
}

export interface SearchInput {
  keyword?: string;
  categorySlug?: string;
  location?: string;
  maxRate?: number;
  sort?: "rate_asc" | "rate_desc" | "relevance";
}
