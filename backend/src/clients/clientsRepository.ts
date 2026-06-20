import type { Repository } from "../core";
import type { Client } from "./types";

export interface ClientsRepository extends Repository<Client> {
  findByEmail(email: string): Promise<Client | undefined>;
}
