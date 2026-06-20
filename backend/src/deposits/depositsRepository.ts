import type { Repository, UUID } from "../core";
import type { Deposit } from "./types";

export interface DepositsRepository extends Repository<Deposit> {
  findByEnquiry(enquiryId: UUID): Promise<Deposit[]>;
}
