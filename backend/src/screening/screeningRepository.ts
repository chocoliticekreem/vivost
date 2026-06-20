import type { UUID } from "../core";
import type { ClientScreening } from "./types";

/**
 * ClientScreening is keyed by clientId (1:1), so it does not use the generic
 * id-based Repository<T>; it has its own minimal port.
 */
export interface ScreeningRepository {
  getByClientId(clientId: UUID): Promise<ClientScreening | undefined>;
  save(screening: ClientScreening): Promise<ClientScreening>;
}
