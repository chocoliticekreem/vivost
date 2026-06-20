import type { Repository, UUID } from "../core";
import type { VerificationRecord } from "./types";

export interface VerificationRepository extends Repository<VerificationRecord> {
  findBySubject(subjectId: UUID): Promise<VerificationRecord[]>;
}
