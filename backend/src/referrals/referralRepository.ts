import type { Repository } from "../core";
import type { Referral, ReferralCode } from "./types";

export interface ReferralCodeRepository extends Repository<ReferralCode> {
  findByCode(code: string): Promise<ReferralCode | undefined>;
}

export interface ReferralRepository extends Repository<Referral> {
  findByCodeId(codeId: string): Promise<Referral[]>;
}
