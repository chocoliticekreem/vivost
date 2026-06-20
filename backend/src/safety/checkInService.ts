import {
  newId,
  NotFoundError,
  ValidationError,
  type Clock,
  type EventBus,
  type Hasher,
  type UUID,
} from "../core";
import type { CheckInSession, TrustedContact } from "./types";
import type { CheckInRepository } from "./checkInRepository";
import type { TrustedContactRepository } from "./trustedContactRepository";

export class TrustedContactService {
  constructor(
    private readonly repo: TrustedContactRepository,
    private readonly hasher: Hasher,
    private readonly clock: Clock,
  ) {}

  async add(input: {
    accountId: UUID;
    name: string;
    contact: string;
  }): Promise<TrustedContact> {
    if (input.contact.trim() === "") {
      throw new ValidationError("contact is required");
    }
    const contact: TrustedContact = {
      id: newId(),
      accountId: input.accountId,
      name: input.name,
      contactHash: this.hasher.hash(input.contact.trim().toLowerCase()),
      createdAt: this.clock.now(),
    };
    return this.repo.save(contact);
  }
}

export class CheckInService {
  constructor(
    private readonly sessionRepo: CheckInRepository,
    private readonly clock: Clock,
    private readonly eventBus: EventBus,
  ) {}

  async start(input: {
    accountId: UUID;
    trustedContactId: UUID;
    durationMinutes: number;
  }): Promise<CheckInSession> {
    if (
      !Number.isFinite(input.durationMinutes) ||
      input.durationMinutes <= 0
    ) {
      throw new ValidationError("durationMinutes must be a positive number");
    }
    const now = this.clock.now();
    const expectedEndAt = new Date(
      now.getTime() + input.durationMinutes * 60_000,
    );
    const session: CheckInSession = {
      id: newId(),
      accountId: input.accountId,
      trustedContactId: input.trustedContactId,
      startedAt: now,
      expectedEndAt,
      status: "active",
      createdAt: now,
    };
    return this.sessionRepo.save(session);
  }

  async markSafe(sessionId: UUID): Promise<CheckInSession> {
    const session = await this.requireSession(sessionId);
    session.status = "safe";
    return this.sessionRepo.save(session);
  }

  async triggerPanic(sessionId: UUID): Promise<CheckInSession> {
    const session = await this.requireSession(sessionId);
    session.status = "panic";
    const saved = await this.sessionRepo.save(session);
    await this.eventBus.publish({
      type: "safety.panic",
      payload: { sessionId: saved.id, accountId: saved.accountId },
    });
    return saved;
  }

  /**
   * Mark any active session whose expectedEndAt has passed as overdue and
   * publish a safety.overdue event for each.
   */
  async evaluateOverdue(now: Date): Promise<CheckInSession[]> {
    const active = await this.sessionRepo.listActive();
    const overdue: CheckInSession[] = [];
    for (const session of active) {
      if (session.expectedEndAt.getTime() < now.getTime()) {
        session.status = "overdue";
        const saved = await this.sessionRepo.save(session);
        await this.eventBus.publish({
          type: "safety.overdue",
          payload: { sessionId: saved.id, accountId: saved.accountId },
        });
        overdue.push(saved);
      }
    }
    return overdue;
  }

  private async requireSession(sessionId: UUID): Promise<CheckInSession> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw new NotFoundError("Check-in session not found");
    }
    return session;
  }
}
