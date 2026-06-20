import { InMemoryRepository } from "../core";
import type { UUID } from "../core";
import type { Deposit } from "./types";
import type { DepositsRepository } from "./depositsRepository";

export class InMemoryDepositsRepository
  extends InMemoryRepository<Deposit>
  implements DepositsRepository
{
  async findByEnquiry(enquiryId: UUID): Promise<Deposit[]> {
    const all = await this.list();
    return all
      .filter((d) => d.enquiryId === enquiryId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}
