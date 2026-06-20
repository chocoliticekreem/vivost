import { InMemoryRepository } from "../core";
import type { UUID } from "../core";
import type { ModerationVerdict } from "./types";
import type { ModerationRepository } from "./moderationRepository";

export class InMemoryModerationRepository
  extends InMemoryRepository<ModerationVerdict>
  implements ModerationRepository
{
  async listByMessage(messageId: UUID): Promise<ModerationVerdict[]> {
    const all = await this.list();
    return all.filter((v) => v.messageId === messageId);
  }

  async listQueue(): Promise<ModerationVerdict[]> {
    const all = await this.list();
    return all
      .filter((v) => v.needsReview && v.reviewStatus === "open")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
