import { InMemoryRepository } from "../core";
import type { UUID } from "../core";
import type { Listing } from "./types";
import type { ListingsRepository } from "./listingsRepository";

export class InMemoryListingsRepository
  extends InMemoryRepository<Listing>
  implements ListingsRepository
{
  async listByOwner(ownerAccountId: UUID): Promise<Listing[]> {
    const all = await this.list();
    return all.filter((l) => l.ownerAccountId === ownerAccountId);
  }

  async listActive(): Promise<Listing[]> {
    const all = await this.list();
    return all.filter((l) => l.status === "active");
  }
}
