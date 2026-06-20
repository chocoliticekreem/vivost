import type { Repository } from "../core";
import type { BadDateReport } from "./types";

export interface BadDateRepository extends Repository<BadDateReport> {
  findByHashes(input: {
    phoneHash?: string | null;
    emailHash?: string | null;
  }): Promise<BadDateReport[]>;
}
