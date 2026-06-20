import { InMemoryRepository } from "../core";
import type { BadDateReport } from "./types";
import type { BadDateRepository } from "./badDateRepository";

export class InMemoryBadDateRepository
  extends InMemoryRepository<BadDateReport>
  implements BadDateRepository
{
  async findByHashes(input: {
    phoneHash?: string | null;
    emailHash?: string | null;
  }): Promise<BadDateReport[]> {
    const { phoneHash, emailHash } = input;
    const all = await this.list();
    return all.filter(
      (r) =>
        (phoneHash != null && r.clientPhoneHash === phoneHash) ||
        (emailHash != null && r.clientEmailHash === emailHash),
    );
  }
}
