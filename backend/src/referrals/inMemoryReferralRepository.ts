import { InMemoryRepository } from "../core";
import type { Referral, ReferralCode } from "./types";
import type {
  ReferralCodeRepository,
  ReferralRepository,
} from "./referralRepository";

export class InMemoryReferralCodeRepository
  extends InMemoryRepository<ReferralCode>
  implements ReferralCodeRepository
{
  async findByCode(code: string): Promise<ReferralCode | undefined> {
    const all = await this.list();
    return all.find((c) => c.code === code);
  }
}

export class InMemoryReferralRepository
  extends InMemoryRepository<Referral>
  implements ReferralRepository
{
  async findByCodeId(codeId: string): Promise<Referral[]> {
    const all = await this.list();
    return all.filter((r) => r.codeId === codeId);
  }
}
