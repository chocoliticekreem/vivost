import type { Repository, UUID } from "../core";
import type { ModerationVerdict } from "./types";

export interface ModerationRepository extends Repository<ModerationVerdict> {
  listByMessage(messageId: UUID): Promise<ModerationVerdict[]>;
  listQueue(): Promise<ModerationVerdict[]>; // needsReview && reviewStatus==='open', newest first
}
