import { InMemoryRepository } from "../core";
import type { Payment } from "./types";
import type { PaymentsRepository } from "./paymentsRepository";

export class InMemoryPaymentsRepository
  extends InMemoryRepository<Payment>
  implements PaymentsRepository
{
  async findByCheckoutId(checkoutId: string): Promise<Payment | undefined> {
    const all = await this.list();
    return all.find((p) => p.checkoutId === checkoutId);
  }
}
