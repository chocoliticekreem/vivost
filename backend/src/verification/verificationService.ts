import { NotFoundError, newId } from "../core";
import type { Clock, IdVerificationProvider, UUID } from "../core";
import type {
  VerificationBadge,
  VerificationMethod,
  VerificationRecord,
  VerificationStatus,
  VerificationSubjectType,
} from "./types";
import type { VerificationRepository } from "./verificationRepository";

export class VerificationService {
  constructor(
    private readonly repo: VerificationRepository,
    private readonly idProvider: IdVerificationProvider,
    private readonly clock: Clock,
  ) {}

  async startVerification(
    subjectId: UUID,
    subjectType: VerificationSubjectType,
    method: VerificationMethod,
  ): Promise<VerificationRecord> {
    const { checkId } = await this.idProvider.startCheck({ subjectId, method });
    const record: VerificationRecord = {
      id: newId(),
      subjectId,
      subjectType,
      method,
      checkId,
      status: "pending",
      checkedAt: null,
      createdAt: this.clock.now(),
    };
    return this.repo.save(record);
  }

  async refreshResult(recordId: UUID): Promise<VerificationRecord> {
    const existing = await this.repo.getById(recordId);
    if (!existing) {
      throw new NotFoundError("Verification record not found");
    }
    const result = await this.idProvider.getResult(existing.checkId);
    const updated: VerificationRecord = {
      ...existing,
      status: result.status,
      checkedAt: result.checkedAt,
    };
    return this.repo.save(updated);
  }

  async isVerified(subjectId: UUID): Promise<boolean> {
    const records = await this.repo.findBySubject(subjectId);
    return records.some((r) => r.status === "pass");
  }

  async latestStatus(subjectId: UUID): Promise<VerificationStatus | null> {
    const records = await this.repo.findBySubject(subjectId);
    if (records.length === 0) return null;
    const latest = records.reduce((a, b) =>
      b.createdAt.getTime() >= a.createdAt.getTime() ? b : a,
    );
    return latest.status;
  }

  async badgeFor(subjectId: UUID): Promise<VerificationBadge> {
    return (await this.isVerified(subjectId)) ? "id_verified" : null;
  }
}
