import { NotFoundError, newId } from "../core";
import type { Clock, PaymentProvider, UUID } from "../core";
import { holdDepositSchema } from "./types";
import type { Deposit, HoldDepositInput } from "./types";
import type { DepositsRepository } from "./depositsRepository";

export class DepositsService {
  constructor(
    private readonly repo: DepositsRepository,
    private readonly provider: PaymentProvider,
    private readonly clock: Clock,
  ) {}

  /**
   * Places a hold via the PaymentProvider port and records it as 'held'. The
   * provider returns only an opaque holdId — no card data is stored.
   */
  async hold(input: HoldDepositInput): Promise<Deposit> {
    const data = holdDepositSchema.parse(input);
    const { holdId } = await this.provider.holdDeposit({
      amountMinor: data.amountMinor,
      currency: data.currency,
      reference: `deposit:${data.enquiryId}`,
    });

    const now = this.clock.now();
    const deposit: Deposit = {
      id: newId(),
      enquiryId: data.enquiryId,
      amountMinor: data.amountMinor,
      currency: data.currency,
      holdId,
      status: "held",
      createdAt: now,
      updatedAt: now,
    };
    return this.repo.save(deposit);
  }

  async release(depositId: UUID): Promise<Deposit> {
    const deposit = await this.requireDeposit(depositId);
    await this.provider.releaseDeposit(deposit.holdId);
    return this.repo.save({
      ...deposit,
      status: "released",
      updatedAt: this.clock.now(),
    });
  }

  async forfeit(depositId: UUID): Promise<Deposit> {
    const deposit = await this.requireDeposit(depositId);
    return this.repo.save({
      ...deposit,
      status: "forfeited",
      updatedAt: this.clock.now(),
    });
  }

  private async requireDeposit(depositId: UUID): Promise<Deposit> {
    const deposit = await this.repo.getById(depositId);
    if (!deposit) {
      throw new NotFoundError("Deposit not found");
    }
    return deposit;
  }
}
