import { ValidationError, newId, normaliseEmail, normalisePhone } from "../core";
import type { Clock, Hasher, UUID } from "../core";
import { checkOffenderSchema, reportOffenderSchema } from "./types";
import type {
  CheckOffenderInput,
  CheckResult,
  OffenderReport,
  ReportOffenderInput,
} from "./types";
import type { OffenderReportRepository } from "./offenderReportRepository";

/**
 * Reported-offender reverse-checker. GDPR-critical: contact details are
 * normalised then hashed BEFORE storing. Raw phone/email values are NEVER
 * stored or returned.
 */
export class ReverseCheckerService {
  constructor(
    private readonly repo: OffenderReportRepository,
    private readonly hasher: Hasher,
    private readonly clock: Clock,
  ) {}

  async report(input: ReportOffenderInput): Promise<OffenderReport> {
    const { phone, email, reason, reportedByAccountId } =
      reportOffenderSchema.parse(input);

    const phoneHash = phone != null ? this.hashPhone(phone) : null;
    const emailHash = email != null ? this.hashEmail(email) : null;

    if (phoneHash == null && emailHash == null) {
      throw new ValidationError(
        "A report must include at least one of phone or email",
      );
    }

    const report: OffenderReport = {
      id: newId(),
      phoneHash,
      emailHash,
      reason,
      reportedByAccountId,
      createdAt: this.clock.now(),
    };
    return this.repo.save(report);
  }

  async check(input: CheckOffenderInput): Promise<CheckResult> {
    const { phone, email } = checkOffenderSchema.parse(input);

    const hashes: string[] = [];
    if (phone != null) hashes.push(this.hashPhone(phone));
    if (email != null) hashes.push(this.hashEmail(email));

    if (hashes.length === 0) {
      throw new ValidationError(
        "A check must include at least one of phone or email",
      );
    }

    const matched = await this.repo.findByHashes(hashes);
    return {
      matches: matched.length,
      reasons: matched.map((r) => r.reason),
    };
  }

  private hashPhone(phone: string): string {
    return this.hasher.hash(normalisePhone(phone));
  }

  private hashEmail(email: string): string {
    return this.hasher.hash(normaliseEmail(email));
  }
}
