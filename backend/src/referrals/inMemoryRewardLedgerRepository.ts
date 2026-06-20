import { InMemoryRepository } from "../core";
import type { RewardLedgerEntry } from "./types";
import type { RewardLedgerRepository } from "./rewardLedgerRepository";

export class InMemoryRewardLedgerRepository
  extends InMemoryRepository<RewardLedgerEntry>
  implements RewardLedgerRepository
{
  async findByAccount(accountId: string): Promise<RewardLedgerEntry[]> {
    const all = await this.list();
    return all.filter((e) => e.accountId === accountId);
  }
}
