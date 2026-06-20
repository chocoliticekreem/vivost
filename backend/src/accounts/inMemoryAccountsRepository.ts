import { InMemoryRepository, normaliseEmail } from "../core";
import type { Account } from "./types";
import type { AccountsRepository } from "./accountsRepository";

export class InMemoryAccountsRepository
  extends InMemoryRepository<Account>
  implements AccountsRepository
{
  async findByEmail(email: string): Promise<Account | undefined> {
    const target = normaliseEmail(email);
    const all = await this.list();
    return all.find(
      (a) => a.email != null && normaliseEmail(a.email) === target,
    );
  }
}
