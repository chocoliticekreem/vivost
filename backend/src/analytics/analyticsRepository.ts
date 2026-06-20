import type { Repository } from "../core";
import type { AnalyticsEvent, AnalyticsEventType } from "./types";

export interface AnalyticsRepository extends Repository<AnalyticsEvent> {
  countByType(listingId: string): Promise<Record<AnalyticsEventType, number>>;
  viewCountsByListing(): Promise<{ listingId: string; views: number }[]>;
}
