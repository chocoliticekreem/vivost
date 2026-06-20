import type { Repository } from "../core";
import type { Subscription } from "./types";

export interface SubscriptionsRepository extends Repository<Subscription> {
  findByAccount(accountId: string): Promise<Subscription[]>;
}
