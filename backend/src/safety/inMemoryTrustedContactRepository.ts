import { InMemoryRepository } from "../core";
import type { TrustedContact } from "./types";
import type { TrustedContactRepository } from "./trustedContactRepository";

export class InMemoryTrustedContactRepository
  extends InMemoryRepository<TrustedContact>
  implements TrustedContactRepository
{
  async listForAccount(accountId: string): Promise<TrustedContact[]> {
    const all = await this.list();
    return all.filter((c) => c.accountId === accountId);
  }
}
