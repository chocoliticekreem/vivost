import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError, fixedClock } from "../core";
import { ClientsService } from "./clientsService";
import { InMemoryClientsRepository } from "./inMemoryClientsRepository";

const NOW = new Date("2026-01-01T00:00:00.000Z");

function makeService() {
  const repo = new InMemoryClientsRepository();
  const service = new ClientsService(repo, fixedClock(NOW));
  return { repo, service };
}

describe("ClientsService.register", () => {
  it("creates an active client and normalises email", async () => {
    const { service } = makeService();
    const client = await service.register({ email: "Booker@Example.com" });

    expect(client.status).toBe("active");
    expect(client.email).toBe("booker@example.com");
    expect(client.id).toBeTruthy();
    expect(client.createdAt).toEqual(NOW);
    expect(client.updatedAt).toEqual(NOW);
  });

  it("rejects a duplicate email", async () => {
    const { service } = makeService();
    await service.register({ email: "dup@example.com" });
    await expect(
      service.register({ email: "DUP@example.com" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("ClientsService.getById", () => {
  it("throws NotFoundError when missing", async () => {
    const { service } = makeService();
    await expect(
      service.getById("00000000-0000-0000-0000-000000000000"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns the client when present", async () => {
    const { service } = makeService();
    const created = await service.register({ email: "found@example.com" });
    const fetched = await service.getById(created.id);
    expect(fetched.id).toBe(created.id);
  });
});

describe("ClientsService.suspend", () => {
  it("suspends a client", async () => {
    const { service } = makeService();
    const created = await service.register({ email: "tx@example.com" });
    const suspended = await service.suspend(created.id);
    expect(suspended.status).toBe("suspended");
  });

  it("throws NotFoundError suspending a missing client", async () => {
    const { service } = makeService();
    await expect(
      service.suspend("00000000-0000-0000-0000-000000000000"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("ClientsService.deleteClient", () => {
  it("hard-deletes so getById afterwards throws NotFoundError", async () => {
    const { service } = makeService();
    const created = await service.register({ email: "erase@example.com" });
    await service.deleteClient(created.id);
    await expect(service.getById(created.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("throws NotFoundError deleting a missing client", async () => {
    const { service } = makeService();
    await expect(
      service.deleteClient("00000000-0000-0000-0000-000000000000"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
