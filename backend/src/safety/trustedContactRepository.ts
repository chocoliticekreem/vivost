import type { Repository } from "../core";
import type { TrustedContact } from "./types";

export interface TrustedContactRepository extends Repository<TrustedContact> {
  listForAccount(accountId: string): Promise<TrustedContact[]>;
}
