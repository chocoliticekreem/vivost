import type { Repository } from "../core";
import type { CheckInSession } from "./types";

export interface CheckInRepository extends Repository<CheckInSession> {
  listActive(): Promise<CheckInSession[]>;
}
