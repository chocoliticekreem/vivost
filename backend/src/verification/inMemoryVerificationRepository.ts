import { InMemoryRepository } from "../core";
import type { UUID } from "../core";
import type { VerificationRecord } from "./types";
import type { VerificationRepository } from "./verificationRepository";

export class InMemoryVerificationRepository
  extends InMemoryRepository<VerificationRecord>
  implements VerificationRepository
{
  async findBySubject(subjectId: UUID): Promise<VerificationRecord[]> {
    const all = await this.list();
    return all.filter((r) => r.subjectId === subjectId);
  }
}
