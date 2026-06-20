import type { Repository, UUID } from "../core";
import type { Account } from "./types";

export interface AccountsRepository extends Repository<Account> {
  findByEmail(email: string): Promise<Account | undefined>;
}
