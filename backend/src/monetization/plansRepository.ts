import type { Repository } from "../core";
import type { Plan, PlanKey } from "./types";

export interface PlansRepository extends Repository<Plan> {
  getByKey(key: PlanKey): Promise<Plan | undefined>;
  listActive(): Promise<Plan[]>;
}
