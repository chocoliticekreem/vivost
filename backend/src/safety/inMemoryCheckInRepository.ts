import { InMemoryRepository } from "../core";
import type { CheckInSession } from "./types";
import type { CheckInRepository } from "./checkInRepository";

export class InMemoryCheckInRepository
  extends InMemoryRepository<CheckInSession>
  implements CheckInRepository
{
  async listActive(): Promise<CheckInSession[]> {
    const all = await this.list();
    return all.filter((s) => s.status === "active");
  }
}
