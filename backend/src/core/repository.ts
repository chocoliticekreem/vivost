import type { UUID } from "./ids";

export interface Repository<T extends { id: UUID }> {
  getById(id: UUID): Promise<T | undefined>;
  list(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: UUID): Promise<void>;
}

/**
 * In-memory repository backed by a Map. Stores and returns deep copies
 * (structuredClone) so callers can never mutate the stored state by holding
 * a reference. Domain agents subclass or compose this for unit tests.
 */
export class InMemoryRepository<T extends { id: UUID }> implements Repository<T> {
  protected readonly store = new Map<UUID, T>();

  async getById(id: UUID): Promise<T | undefined> {
    const found = this.store.get(id);
    return found === undefined ? undefined : structuredClone(found);
  }

  async list(): Promise<T[]> {
    return Array.from(this.store.values()).map((e) => structuredClone(e));
  }

  async save(entity: T): Promise<T> {
    const copy = structuredClone(entity);
    this.store.set(copy.id, copy);
    return structuredClone(copy);
  }

  async delete(id: UUID): Promise<void> {
    this.store.delete(id);
  }
}
