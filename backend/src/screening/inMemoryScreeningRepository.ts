import type { UUID } from "../core";
import type { ClientScreening } from "./types";
import type { ScreeningRepository } from "./screeningRepository";

export class InMemoryScreeningRepository implements ScreeningRepository {
  private readonly store = new Map<UUID, ClientScreening>();

  async getByClientId(clientId: UUID): Promise<ClientScreening | undefined> {
    const found = this.store.get(clientId);
    return found === undefined ? undefined : structuredClone(found);
  }

  async save(screening: ClientScreening): Promise<ClientScreening> {
    const copy = structuredClone(screening);
    this.store.set(copy.clientId, copy);
    return structuredClone(copy);
  }
}
