import { InMemoryRepository } from "../core";
import type { OffenderReport } from "./types";
import type { OffenderReportRepository } from "./offenderReportRepository";

export class InMemoryOffenderReportRepository
  extends InMemoryRepository<OffenderReport>
  implements OffenderReportRepository
{
  async findByHashes(hashes: string[]): Promise<OffenderReport[]> {
    const set = new Set(hashes);
    const all = await this.list();
    return all.filter(
      (r) =>
        (r.phoneHash != null && set.has(r.phoneHash)) ||
        (r.emailHash != null && set.has(r.emailHash)),
    );
  }
}
