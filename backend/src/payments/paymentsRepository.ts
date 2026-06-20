import type { Repository } from "../core";
import type { Payment } from "./types";

export interface PaymentsRepository extends Repository<Payment> {
  findByCheckoutId(checkoutId: string): Promise<Payment | undefined>;
}
