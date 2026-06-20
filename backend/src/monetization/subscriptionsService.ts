import { newId, NotFoundError } from "../core";
import type { Clock, UUID } from "../core";
import type { PlansRepository } from "./plansRepository";
import type { SubscriptionsRepository } from "./subscriptionsRepository";
import { PlansService } from "./plansService";
import type { PlanFeatures, PlanKey, Subscription } from "./types";
import { FREE_PLAN_FEATURES } from "./types";

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

export class SubscriptionsService {
  private readonly plansService: PlansService;

  constructor(
    private readonly subRepo: SubscriptionsRepository,
    private readonly plansRepo: PlansRepository,
    private readonly clock: Clock,
  ) {
    this.plansService = new PlansService(plansRepo);
  }

  async subscribe(accountId: UUID, planKey: PlanKey): Promise<Subscription> {
    const plan = await this.plansService.getByKey(planKey);
    const now = this.clock.now();
    const sub: Subscription = {
      id: newId(),
      accountId,
      planId: plan.id,
      status: "active",
      startedAt: now,
      currentPeriodEnd: addMonths(now, plan.intervalMonths),
      cancelAtPeriodEnd: false,
    };
    return this.subRepo.save(sub);
  }

  async cancel(subId: UUID): Promise<Subscription> {
    const sub = await this.subRepo.getById(subId);
    if (!sub) throw new NotFoundError(`Subscription not found: ${subId}`);
    sub.cancelAtPeriodEnd = true;
    return this.subRepo.save(sub);
  }

  async expireDue(now: Date): Promise<number> {
    const all = await this.subRepo.list();
    let expired = 0;
    for (const sub of all) {
      if (sub.status === "active" && sub.currentPeriodEnd.getTime() <= now.getTime()) {
        sub.status = "expired";
        await this.subRepo.save(sub);
        expired += 1;
      }
    }
    return expired;
  }

  async activeFor(accountId: UUID): Promise<Subscription | undefined> {
    const subs = await this.subRepo.findByAccount(accountId);
    return subs.find((s) => s.status === "active");
  }

  async resolveEntitlements(accountId: UUID): Promise<PlanFeatures> {
    const active = await this.activeFor(accountId);
    if (!active) return FREE_PLAN_FEATURES;
    const plan = await this.plansRepo.getById(active.planId);
    return plan ? plan.features : FREE_PLAN_FEATURES;
  }
}
