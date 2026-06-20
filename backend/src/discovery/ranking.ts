import type { RankItem } from "./types";

const FEATURED_BONUS = 1000;
const PRIORITY_WEIGHT = 10;
const VERIFIED_BONUS = 50;
const FREE_TIER_PENALTY = 200;

const RECENCY_MAX_BONUS = 100;
const RECENCY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Recency bonus: newest items score up to RECENCY_MAX_BONUS, decaying linearly
 * to 0 over a 30-day window. Items older than the window get 0 (never negative).
 */
function recencyBonus(item: RankItem, now: Date): number {
  const ageMs = now.getTime() - item.createdAt.getTime();
  if (ageMs <= 0) return RECENCY_MAX_BONUS;
  if (ageMs >= RECENCY_WINDOW_MS) return 0;
  return RECENCY_MAX_BONUS * (1 - ageMs / RECENCY_WINDOW_MS);
}

/**
 * Composite ranking score. Higher = ranks higher. Combines: featured boost,
 * priority rank, verification bonus, recency, and a free-tier penalty so paid
 * listings outrank otherwise-equivalent free listings.
 */
export function scoreItem(item: RankItem, now: Date): number {
  let score = 0;
  if (item.isFeatured) score += FEATURED_BONUS;
  score += item.priorityRank * PRIORITY_WEIGHT;
  if (item.verified) score += VERIFIED_BONUS;
  score += recencyBonus(item, now);
  if (item.freeTier) score -= FREE_TIER_PENALTY;
  return score;
}

/**
 * Sort items by descending score (stable: ties keep input order).
 */
export function rankItems(items: RankItem[], now: Date): RankItem[] {
  return items
    .map((item, index) => ({ item, index, score: scoreItem(item, now) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((e) => e.item);
}
