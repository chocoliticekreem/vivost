import type { Repository } from "../core";
import type { OffenderReport } from "./types";

export interface OffenderReportRepository extends Repository<OffenderReport> {
  /** Returns all reports whose phoneHash or emailHash matches one of the given hashes. */
  findByHashes(hashes: string[]): Promise<OffenderReport[]>;
}
