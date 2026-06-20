import { InMemoryRepository } from "../core";
import type { SubscriptionsRepository } from "./subscriptionsRepository";
import type { Subscription } from "./types";

export class InMemorySubscriptionsRepository
  extends InMemoryRepository<Subscription>
  implements SubscriptionsRepository
{
  async findByAccount(accountId: string): Promise<Subscription[]> {
    const all = await this.list();
    return all.filter((s) => s.accountId === accountId);
  }
}
