import { InMemoryRepository } from "../core";
import type { PlansRepository } from "./plansRepository";
import type { Plan, PlanKey } from "./types";

export class InMemoryPlansRepository
  extends InMemoryRepository<Plan>
  implements PlansRepository
{
  async getByKey(key: PlanKey): Promise<Plan | undefined> {
    const all = await this.list();
    return all.find((p) => p.key === key);
  }

  async listActive(): Promise<Plan[]> {
    const all = await this.list();
    return all.filter((p) => p.active);
  }
}
