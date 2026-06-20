import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError, fixedClock } from "../core";
import { AccountsService } from "./accountsService";
import { InMemoryAccountsRepository } from "./inMemoryAccountsRepository";

const NOW = new Date("2026-01-01T00:00:00.000Z");

function makeService() {
  const repo = new InMemoryAccountsRepository();
  const service = new AccountsService(repo, fixedClock(NOW));
  return { repo, service };
}

describe("AccountsService.register", () => {
  it("creates an active advertiser by default", async () => {
    const { service } = makeService();
    const account = await service.register({ email: "Alice@Example.com" });

    expect(account.role).toBe("advertiser");
    expect(account.status).toBe("active");
    expect(account.email).toBe("alice@example.com");
    expect(account.id).toBeTruthy();
    expect(account.createdAt).toEqual(NOW);
    expect(account.updatedAt).toEqual(NOW);
  });

  it("can register an admin", async () => {
    const { service } = makeService();
    const account = await service.register({ email: "admin@example.com", role: "admin" });
    expect(account.role).toBe("admin");
  });

  it("rejects a duplicate email", async () => {
    const { service } = makeService();
    await service.register({ email: "dup@example.com" });
    await expect(service.register({ email: "DUP@example.com" })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });
});

describe("AccountsService.getById", () => {
  it("throws NotFoundError when missing", async () => {
    const { service } = makeService();
    await expect(service.getById("00000000-0000-0000-0000-000000000000")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("returns the account when present", async () => {
    const { service } = makeService();
    const created = await service.register({ email: "found@example.com" });
    const fetched = await service.getById(created.id);
    expect(fetched.id).toBe(created.id);
  });
});

describe("AccountsService status transitions", () => {
  it("suspends and reactivates an account", async () => {
    const { service } = makeService();
    const created = await service.register({ email: "tx@example.com" });

    const suspended = await service.suspend(created.id);
    expect(suspended.status).toBe("suspended");

    const reactivated = await service.reactivate(created.id);
    expect(reactivated.status).toBe("active");
  });

  it("throws NotFoundError suspending a missing account", async () => {
    const { service } = makeService();
    await expect(service.suspend("00000000-0000-0000-0000-000000000000")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("AccountsService.deleteAccount", () => {
  it("hard-deletes the account so getById afterwards throws NotFoundError", async () => {
    const { service } = makeService();
    const created = await service.register({ email: "erase@example.com" });

    await service.deleteAccount(created.id);

    await expect(service.getById(created.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws NotFoundError deleting a missing account", async () => {
    const { service } = makeService();
    await expect(
      service.deleteAccount("00000000-0000-0000-0000-000000000000"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
