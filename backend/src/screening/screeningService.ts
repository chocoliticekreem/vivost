import type { Clock, UUID } from "../core";
import type { ClientScreening } from "./types";
import type { ScreeningRepository } from "./screeningRepository";

/**
 * Manages the screening/verification status advertisers see before accepting a
 * booking. Keyed by clientId (1:1). clientId is an opaque UUID reference into
 * the clients domain.
 */
export class ScreeningService {
  constructor(
    private readonly repo: ScreeningRepository,
    private readonly clock: Clock,
  ) {}

  /** Creates the screening record for a client if it does not exist yet. */
  async requestScreening(clientId: UUID): Promise<ClientScreening> {
    const existing = await this.repo.getByClientId(clientId);
    if (existing) return existing;

    const screening: ClientScreening = {
      clientId,
      verified: false,
      references: 0,
      verifiedAt: null,
      updatedAt: this.clock.now(),
    };
    return this.repo.save(screening);
  }

  async addReference(clientId: UUID): Promise<ClientScreening> {
    const screening = await this.requestScreening(clientId);
    const updated: ClientScreening = {
      ...screening,
      references: screening.references + 1,
      updatedAt: this.clock.now(),
    };
    return this.repo.save(updated);
  }

  async markVerified(clientId: UUID): Promise<ClientScreening> {
    const screening = await this.requestScreening(clientId);
    const now = this.clock.now();
    const updated: ClientScreening = {
      ...screening,
      verified: true,
      verifiedAt: now,
      updatedAt: now,
    };
    return this.repo.save(updated);
  }

  /** The screening status an advertiser sees before accepting a booking. */
  async getStatus(clientId: UUID): Promise<ClientScreening> {
    return this.requestScreening(clientId);
  }
}
