import type { Repository } from "../core";
import type { RewardLedgerEntry } from "./types";

export interface RewardLedgerRepository extends Repository<RewardLedgerEntry> {
  findByAccount(accountId: string): Promise<RewardLedgerEntry[]>;
}
