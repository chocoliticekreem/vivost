import { InMemoryRepository, normaliseEmail } from "../core";
import type { Client } from "./types";
import type { ClientsRepository } from "./clientsRepository";

export class InMemoryClientsRepository
  extends InMemoryRepository<Client>
  implements ClientsRepository
{
  async findByEmail(email: string): Promise<Client | undefined> {
    const target = normaliseEmail(email);
    const all = await this.list();
    return all.find(
      (c) => c.email != null && normaliseEmail(c.email) === target,
    );
  }
}
