import {
  ConflictError,
  NotFoundError,
  newId,
  normaliseEmail,
} from "../core";
import type { Clock, UUID } from "../core";
import { registerAccountSchema } from "./types";
import type {
  Account,
  AccountRole,
  RegisterAccountInput,
} from "./types";
import type { AccountsRepository } from "./accountsRepository";

export class AccountsService {
  constructor(
    private readonly repo: AccountsRepository,
    private readonly clock: Clock,
  ) {}

  async register(input: RegisterAccountInput): Promise<Account> {
    const { email, role } = registerAccountSchema.parse(input);
    const normalisedEmail = normaliseEmail(email);

    const existing = await this.repo.findByEmail(normalisedEmail);
    if (existing) {
      throw new ConflictError("An account with this email already exists");
    }

    const now = this.clock.now();
    const account: Account = {
      id: newId(),
      email: normalisedEmail,
      role,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    return this.repo.save(account);
  }

  /**
   * Idempotent get-or-create by email. Returns the existing account when one
   * already exists for the (normalised) email, otherwise registers a new one.
   */
  async ensureByEmail(
    email: string,
    role: AccountRole = "advertiser",
  ): Promise<Account> {
    const normalisedEmail = normaliseEmail(email);
    const existing = await this.repo.findByEmail(normalisedEmail);
    if (existing) return existing;
    try {
      return await this.register({ email: normalisedEmail, role });
    } catch (err) {
      // Lost a concurrent create race (e.g. StrictMode double-mount, or two
      // requests at once) — the duplicate-email write failed; return the winner.
      const afterRace = await this.repo.findByEmail(normalisedEmail);
      if (afterRace) return afterRace;
      throw err;
    }
  }

  async getById(id: UUID): Promise<Account> {
    const account = await this.repo.getById(id);
    if (!account) {
      throw new NotFoundError("Account not found");
    }
    return account;
  }

  async suspend(id: UUID): Promise<Account> {
    return this.setStatus(id, "suspended");
  }

  async reactivate(id: UUID): Promise<Account> {
    return this.setStatus(id, "active");
  }

  /**
   * Hard delete (GDPR erasure). In pg this removes the identity root row and
   * cascades to all dependent rows.
   */
  async deleteAccount(id: UUID): Promise<void> {
    const account = await this.repo.getById(id);
    if (!account) {
      throw new NotFoundError("Account not found");
    }
    await this.repo.delete(id);
  }

  private async setStatus(
    id: UUID,
    status: Account["status"],
  ): Promise<Account> {
    const account = await this.getById(id);
    const updated: Account = {
      ...account,
      status,
      updatedAt: this.clock.now(),
    };
    return this.repo.save(updated);
  }
}
