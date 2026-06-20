import { ConflictError, NotFoundError, ValidationError, newId } from "../core";
import type { Clock, UUID } from "../core";
import type { Referral, ReferralCode } from "./types";
import type {
  ReferralCodeRepository,
  ReferralRepository,
} from "./referralRepository";
import type { RewardLedgerRepository } from "./rewardLedgerRepository";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    const idx = Math.floor(Math.random() * CODE_ALPHABET.length);
    code += CODE_ALPHABET[idx];
  }
  return code;
}

export class ReferralsService {
  constructor(
    private readonly codeRepo: ReferralCodeRepository,
    private readonly referralRepo: ReferralRepository,
    private readonly ledgerRepo: RewardLedgerRepository,
    private readonly clock: Clock,
  ) {}

  async createCode(ownerAccountId: UUID): Promise<ReferralCode> {
    let code = generateCode();
    while (await this.codeRepo.findByCode(code)) {
      code = generateCode();
    }
    const referralCode: ReferralCode = {
      id: newId(),
      ownerAccountId,
      code,
      createdAt: this.clock.now(),
    };
    return this.codeRepo.save(referralCode);
  }

  /**
   * Records a signup attributed to a code. Unknown code -> ValidationError.
   * The referral starts 'pending'; the reward is only granted on activate().
   */
  async recordSignup(code: string, referredAccountId: UUID): Promise<Referral> {
    const referralCode = await this.codeRepo.findByCode(code);
    if (!referralCode) {
      throw new ValidationError("Unknown referral code");
    }
    const referral: Referral = {
      id: newId(),
      codeId: referralCode.id,
      referredAccountId,
      status: "pending",
      createdAt: this.clock.now(),
      activatedAt: null,
    };
    return this.referralRepo.save(referral);
  }

  /**
   * Activation gate: marks a pending referral as activated and credits BOTH
   * sides of the reward in the ledger (code owner + referred account).
   * Re-activating an already-activated referral -> ConflictError.
   */
  async activate(referralId: UUID, rewardMinor: number): Promise<Referral> {
    const referral = await this.referralRepo.getById(referralId);
    if (!referral) {
      throw new NotFoundError("Referral not found");
    }
    if (referral.status === "activated") {
      throw new ConflictError("Referral already activated");
    }

    const code = await this.codeRepo.getById(referral.codeId);
    if (!code) {
      throw new NotFoundError("Referral code not found");
    }

    const now = this.clock.now();
    const activated: Referral = {
      ...referral,
      status: "activated",
      activatedAt: now,
    };
    await this.referralRepo.save(activated);

    await this.ledgerRepo.save({
      id: newId(),
      accountId: code.ownerAccountId,
      amountMinor: rewardMinor,
      reason: "referral_reward",
      createdAt: now,
    });
    await this.ledgerRepo.save({
      id: newId(),
      accountId: referral.referredAccountId,
      amountMinor: rewardMinor,
      reason: "referral_welcome",
      createdAt: now,
    });

    return activated;
  }

  async balanceFor(accountId: UUID): Promise<number> {
    const entries = await this.ledgerRepo.findByAccount(accountId);
    return entries.reduce((sum, e) => sum + e.amountMinor, 0);
  }
}
