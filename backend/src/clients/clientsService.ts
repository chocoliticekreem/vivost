import { ConflictError, NotFoundError, newId, normaliseEmail } from "../core";
import type { Clock, UUID } from "../core";
import { registerClientSchema } from "./types";
import type { Client, RegisterClientInput } from "./types";
import type { ClientsRepository } from "./clientsRepository";

export class ClientsService {
  constructor(
    private readonly repo: ClientsRepository,
    private readonly clock: Clock,
  ) {}

  async register(input: RegisterClientInput): Promise<Client> {
    const { email } = registerClientSchema.parse(input);
    const normalisedEmail = normaliseEmail(email);

    const existing = await this.repo.findByEmail(normalisedEmail);
    if (existing) {
      throw new ConflictError("A client with this email already exists");
    }

    const now = this.clock.now();
    const client: Client = {
      id: newId(),
      email: normalisedEmail,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    return this.repo.save(client);
  }

  /**
   * Idempotent get-or-create by email. Returns the existing client when one
   * already exists for the (normalised) email, otherwise registers a new one.
   */
  async ensureByEmail(email: string): Promise<Client> {
    const normalisedEmail = normaliseEmail(email);
    const existing = await this.repo.findByEmail(normalisedEmail);
    if (existing) return existing;
    try {
      return await this.register({ email: normalisedEmail });
    } catch (err) {
      // Lost a concurrent create race (e.g. StrictMode double-mount, or two
      // requests at once) — the duplicate-email write failed; return the winner.
      const afterRace = await this.repo.findByEmail(normalisedEmail);
      if (afterRace) return afterRace;
      throw err;
    }
  }

  async getById(id: UUID): Promise<Client> {
    const client = await this.repo.getById(id);
    if (!client) {
      throw new NotFoundError("Client not found");
    }
    return client;
  }

  async suspend(id: UUID): Promise<Client> {
    const client = await this.getById(id);
    const updated: Client = {
      ...client,
      status: "suspended",
      updatedAt: this.clock.now(),
    };
    return this.repo.save(updated);
  }

  /**
   * Hard delete (GDPR erasure). In pg this removes the identity root row and
   * cascades to all dependent rows.
   */
  async deleteClient(id: UUID): Promise<void> {
    const client = await this.repo.getById(id);
    if (!client) {
      throw new NotFoundError("Client not found");
    }
    await this.repo.delete(id);
  }
}
