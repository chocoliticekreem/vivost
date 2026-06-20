import { NotFoundError, newId } from "../core";
import type { PlansRepository } from "./plansRepository";
import type { Plan, PlanKey } from "./types";
import { SEED_PLANS } from "./types";

export class PlansService {
  constructor(private readonly repo: PlansRepository) {}

  async listActive(): Promise<Plan[]> {
    return this.repo.listActive();
  }

  async getByKey(key: PlanKey): Promise<Plan> {
    const plan = await this.repo.getByKey(key);
    if (!plan) throw new NotFoundError(`Plan not found: ${key}`);
    return plan;
  }

  /**
   * Populate the repository with the canonical SEED_PLANS. Used by tests and
   * in-memory bootstrapping. Idempotent only insofar as it always inserts a new
   * row per plan; callers should seed an empty repo.
   */
  async seed(): Promise<Plan[]> {
    const created: Plan[] = [];
    for (const seed of SEED_PLANS) {
      const plan: Plan = { id: newId(), ...seed };
      created.push(await this.repo.save(plan));
    }
    return created;
  }
}
