import { newId } from "../core";
import type { Clock, UUID } from "../core";
import type { AnalyticsEvent, AnalyticsEventType, Funnel } from "./types";
import type { AnalyticsRepository } from "./analyticsRepository";

export class AnalyticsService {
  constructor(
    private readonly repo: AnalyticsRepository,
    private readonly clock: Clock,
  ) {}

  /**
   * Records a funnel event for a listing at the current clock time. sessionHash,
   * if given, must already be a one-way hash — never a raw session id or PII.
   */
  async record(
    listingId: UUID,
    type: AnalyticsEventType,
    sessionHash?: string | null,
  ): Promise<AnalyticsEvent> {
    const event: AnalyticsEvent = {
      id: newId(),
      listingId,
      type,
      at: this.clock.now(),
      sessionHash: sessionHash ?? null,
    };
    return this.repo.save(event);
  }

  async funnelFor(listingId: UUID): Promise<Funnel> {
    const { view, contact, conversion } = await this.repo.countByType(listingId);
    return {
      views: view,
      contacts: contact,
      conversions: conversion,
      contactRate: view === 0 ? 0 : contact / view,
      conversionRate: contact === 0 ? 0 : conversion / contact,
    };
  }

  /**
   * Listing ids ordered by view count descending, capped at `limit`.
   */
  async topListings(limit: number): Promise<UUID[]> {
    const counts = await this.repo.viewCountsByListing();
    return counts.slice(0, Math.max(0, limit)).map((c) => c.listingId);
  }
}
