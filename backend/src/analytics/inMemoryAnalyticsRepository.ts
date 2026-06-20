import { InMemoryRepository } from "../core";
import type { AnalyticsEvent, AnalyticsEventType } from "./types";
import type { AnalyticsRepository } from "./analyticsRepository";

export class InMemoryAnalyticsRepository
  extends InMemoryRepository<AnalyticsEvent>
  implements AnalyticsRepository
{
  async countByType(
    listingId: string,
  ): Promise<Record<AnalyticsEventType, number>> {
    const all = await this.list();
    const counts: Record<AnalyticsEventType, number> = {
      view: 0,
      contact: 0,
      conversion: 0,
    };
    for (const event of all) {
      if (event.listingId === listingId) counts[event.type] += 1;
    }
    return counts;
  }

  async viewCountsByListing(): Promise<{ listingId: string; views: number }[]> {
    const all = await this.list();
    const byListing = new Map<string, number>();
    for (const event of all) {
      if (event.type !== "view") continue;
      byListing.set(event.listingId, (byListing.get(event.listingId) ?? 0) + 1);
    }
    return Array.from(byListing.entries())
      .map(([listingId, views]) => ({ listingId, views }))
      .sort((a, b) => b.views - a.views);
  }
}
