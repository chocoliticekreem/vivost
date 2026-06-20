import { newId, ValidationError } from "../core";
import type { Clock, UUID } from "../core";
import type { PlacementsRepository } from "./placementsRepository";
import type { Placement, PlacementKind } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isActiveAt(placement: Placement, now: Date): boolean {
  const t = now.getTime();
  return placement.startsAt.getTime() <= t && t < placement.endsAt.getTime();
}

export class PlacementsService {
  constructor(
    private readonly repo: PlacementsRepository,
    private readonly clock: Clock,
  ) {}

  async purchase(
    listingId: UUID,
    kind: PlacementKind,
    durationDays: number,
    opts?: { citySlug?: string | null; categorySlug?: string | null },
  ): Promise<Placement> {
    if (durationDays <= 0) {
      throw new ValidationError("durationDays must be positive");
    }
    const now = this.clock.now();
    const placement: Placement = {
      id: newId(),
      listingId,
      kind,
      startsAt: now,
      endsAt: new Date(now.getTime() + durationDays * MS_PER_DAY),
      citySlug: opts?.citySlug ?? null,
      categorySlug: opts?.categorySlug ?? null,
    };
    return this.repo.save(placement);
  }

  async activeFor(listingId: UUID, now: Date): Promise<Placement[]> {
    const all = await this.repo.findByListing(listingId);
    return all.filter((p) => isActiveAt(p, now));
  }

  async isFeatured(listingId: UUID, now: Date): Promise<boolean> {
    const active = await this.activeFor(listingId, now);
    return active.some((p) => p.kind === "featured");
  }

  async activeForCategory(categorySlug: string, now: Date): Promise<Placement[]> {
    const all = await this.repo.findByCategory(categorySlug);
    return all.filter((p) => isActiveAt(p, now));
  }

  async activeForCity(citySlug: string, now: Date): Promise<Placement[]> {
    const all = await this.repo.findByCity(citySlug);
    return all.filter((p) => isActiveAt(p, now));
  }
}
