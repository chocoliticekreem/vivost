import { randomUUID } from "node:crypto";

export type UUID = string;

export function newId(): UUID {
  return randomUUID();
}
