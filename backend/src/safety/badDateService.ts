import {
  newId,
  normaliseEmail,
  normalisePhone,
  ValidationError,
  type Clock,
  type Hasher,
  type UUID,
} from "../core";
import type { BadDateReport, Severity } from "./types";
import { severitySchema } from "./types";
import type { BadDateRepository } from "./badDateRepository";

export class BadDateService {
  constructor(
    private readonly repo: BadDateRepository,
    private readonly hasher: Hasher,
    private readonly clock: Clock,
  ) {}

  async report(input: {
    reporterAccountId: UUID;
    phone?: string;
    email?: string;
    description: string;
    severity: Severity;
  }): Promise<BadDateReport> {
    const severity = severitySchema.parse(input.severity);

    const phoneHash =
      input.phone != null && input.phone.trim() !== ""
        ? this.hasher.hash(normalisePhone(input.phone))
        : null;
    const emailHash =
      input.email != null && input.email.trim() !== ""
        ? this.hasher.hash(normaliseEmail(input.email))
        : null;

    if (phoneHash == null && emailHash == null) {
      throw new ValidationError(
        "A bad-date report requires at least one client contact (phone or email)",
      );
    }

    const report: BadDateReport = {
      id: newId(),
      reporterAccountId: input.reporterAccountId,
      clientPhoneHash: phoneHash,
      clientEmailHash: emailHash,
      description: input.description,
      severity,
      createdAt: this.clock.now(),
    };
    return this.repo.save(report);
  }

  /**
   * All reports. These are visible ONLY to verified advertisers — the
   * verification gate is enforced at the API layer; the method name makes that
   * intent explicit.
   */
  async listForVerifiedProvider(): Promise<BadDateReport[]> {
    return this.repo.list();
  }

  async search(input: {
    phone?: string;
    email?: string;
  }): Promise<BadDateReport[]> {
    const phoneHash =
      input.phone != null && input.phone.trim() !== ""
        ? this.hasher.hash(normalisePhone(input.phone))
        : null;
    const emailHash =
      input.email != null && input.email.trim() !== ""
        ? this.hasher.hash(normaliseEmail(input.email))
        : null;

    if (phoneHash == null && emailHash == null) {
      throw new ValidationError("search requires a phone or email");
    }

    return this.repo.findByHashes({ phoneHash, emailHash });
  }
}
