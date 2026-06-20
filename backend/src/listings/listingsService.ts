import { ForbiddenError, NotFoundError, newId } from "../core";
import type { Clock, UUID } from "../core";
import { createListingSchema, updateListingSchema } from "./types";
import type {
  CreateListingInput,
  Listing,
  ListingStatus,
  UpdateListingInput,
} from "./types";
import type { ListingsRepository } from "./listingsRepository";

export class ListingsService {
  constructor(
    private readonly repo: ListingsRepository,
    private readonly clock: Clock,
  ) {}

  async create(ownerAccountId: UUID, input: CreateListingInput): Promise<Listing> {
    const data = createListingSchema.parse(input);
    const now = this.clock.now();
    const listing: Listing = {
      id: newId(),
      ownerAccountId,
      ...data,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    return this.repo.save(listing);
  }

  async update(
    actorAccountId: UUID,
    listingId: UUID,
    patch: UpdateListingInput,
  ): Promise<Listing> {
    const listing = await this.requireOwned(actorAccountId, listingId);
    const data = updateListingSchema.parse(patch);
    const updated: Listing = {
      ...listing,
      ...data,
      id: listing.id,
      ownerAccountId: listing.ownerAccountId,
      status: listing.status,
      createdAt: listing.createdAt,
      updatedAt: this.clock.now(),
    };
    return this.repo.save(updated);
  }

  async publish(actorAccountId: UUID, listingId: UUID): Promise<Listing> {
    const listing = await this.requireOwned(actorAccountId, listingId);
    if (listing.status !== "draft" && listing.status !== "suspended") {
      throw new ForbiddenError(
        `Cannot publish a listing in status '${listing.status}'`,
      );
    }
    return this.setStatus(listing, "active");
  }

  async suspend(actorAccountId: UUID, listingId: UUID): Promise<Listing> {
    const listing = await this.requireOwned(actorAccountId, listingId);
    return this.setStatus(listing, "suspended");
  }

  async remove(actorAccountId: UUID, listingId: UUID): Promise<Listing> {
    const listing = await this.requireOwned(actorAccountId, listingId);
    return this.setStatus(listing, "removed");
  }

  async getById(listingId: UUID): Promise<Listing> {
    const listing = await this.repo.getById(listingId);
    if (!listing) {
      throw new NotFoundError("Listing not found");
    }
    return listing;
  }

  async listByOwner(ownerAccountId: UUID): Promise<Listing[]> {
    return this.repo.listByOwner(ownerAccountId);
  }

  async listActive(): Promise<Listing[]> {
    return this.repo.listActive();
  }

  private async requireOwned(actorAccountId: UUID, listingId: UUID): Promise<Listing> {
    const listing = await this.repo.getById(listingId);
    if (!listing) {
      throw new NotFoundError("Listing not found");
    }
    if (listing.ownerAccountId !== actorAccountId) {
      throw new ForbiddenError("You do not own this listing");
    }
    return listing;
  }

  private async setStatus(listing: Listing, status: ListingStatus): Promise<Listing> {
    const updated: Listing = {
      ...listing,
      status,
      updatedAt: this.clock.now(),
    };
    return this.repo.save(updated);
  }
}
