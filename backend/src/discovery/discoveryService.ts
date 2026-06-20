import { rankItems } from "./ranking";
import type { RankItem, SearchInput } from "./types";

/**
 * Pure search over plain RankItem inputs. Filters then sorts. No repository, no
 * database, no other-domain imports — callers supply the candidate items.
 */
export function search(items: RankItem[], input: SearchInput, now: Date): RankItem[] {
  const keyword = input.keyword?.trim().toLowerCase();
  const location = input.location?.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (input.categorySlug && item.categorySlug !== input.categorySlug) return false;
    if (location && !item.location.toLowerCase().includes(location)) return false;
    if (input.maxRate !== undefined && item.hourlyRate > input.maxRate) return false;
    if (keyword) {
      const haystack = `${item.name} ${item.description}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });

  switch (input.sort) {
    case "rate_asc":
      return [...filtered].sort((a, b) => a.hourlyRate - b.hourlyRate);
    case "rate_desc":
      return [...filtered].sort((a, b) => b.hourlyRate - a.hourlyRate);
    case "relevance":
    default:
      return rankItems(filtered, now);
  }
}
