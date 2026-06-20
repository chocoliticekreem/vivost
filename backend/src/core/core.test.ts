import { describe, expect, it } from "vitest";
import { sha256Hasher, normalisePhone, normaliseEmail } from "./hasher";
import { InMemoryRepository } from "./repository";
import { newId } from "./ids";
import { fakePaymentProvider } from "./testing";
import type { UUID } from "./ids";

describe("sha256Hasher", () => {
  it("is deterministic for the same input", () => {
    expect(sha256Hasher.hash("hello")).toBe(sha256Hasher.hash("hello"));
  });

  it("produces a known sha256 hex digest", () => {
    expect(sha256Hasher.hash("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("differs for different inputs", () => {
    expect(sha256Hasher.hash("a")).not.toBe(sha256Hasher.hash("b"));
  });
});

describe("normalisePhone", () => {
  it("strips spaces, dashes, parentheses and leading +", () => {
    expect(normalisePhone("+44 (0)20 7946-0958")).toBe("4402079460958");
  });

  it("collapses formatting to digits only", () => {
    expect(normalisePhone("+1 (555) 123-4567")).toBe("15551234567");
  });

  it("normalises differently-formatted equal numbers to the same value", () => {
    expect(normalisePhone("+1 555 123 4567")).toBe(normalisePhone("1-555-123-4567"));
  });
});

describe("normaliseEmail", () => {
  it("lowercases and trims", () => {
    expect(normaliseEmail("  USER@Example.COM ")).toBe("user@example.com");
  });
});

interface Widget {
  id: UUID;
  name: string;
  tags: string[];
}

describe("InMemoryRepository", () => {
  it("supports CRUD", async () => {
    const repo = new InMemoryRepository<Widget>();
    const id = newId();
    await repo.save({ id, name: "first", tags: ["a"] });

    const fetched = await repo.getById(id);
    expect(fetched?.name).toBe("first");

    await repo.save({ id, name: "updated", tags: ["a", "b"] });
    expect((await repo.getById(id))?.name).toBe("updated");

    expect(await repo.list()).toHaveLength(1);

    await repo.delete(id);
    expect(await repo.getById(id)).toBeUndefined();
    expect(await repo.list()).toHaveLength(0);
  });

  it("isolates stored state from caller mutation (copy-isolation)", async () => {
    const repo = new InMemoryRepository<Widget>();
    const id = newId();
    const input: Widget = { id, name: "orig", tags: ["a"] };
    await repo.save(input);

    input.name = "mutated-after-save";
    input.tags.push("leaked");

    const stored = await repo.getById(id);
    expect(stored?.name).toBe("orig");
    expect(stored?.tags).toEqual(["a"]);

    stored!.tags.push("mutate-the-copy");
    const again = await repo.getById(id);
    expect(again?.tags).toEqual(["a"]);
  });
});

describe("fakePaymentProvider", () => {
  it("captures as paid by default", async () => {
    const provider = fakePaymentProvider();
    const { checkoutId } = await provider.createCheckout({
      amountMinor: 1000,
      currency: "GBP",
      reference: "sub-123",
      kind: "subscription",
    });
    expect(await provider.capture(checkoutId)).toEqual({ status: "paid" });
  });

  it('captures as failed when the reference includes "fail"', async () => {
    const provider = fakePaymentProvider();
    const { checkoutId } = await provider.createCheckout({
      amountMinor: 1000,
      currency: "GBP",
      reference: "boost-fail-1",
      kind: "boost",
    });
    expect(await provider.capture(checkoutId)).toEqual({ status: "failed" });
  });
});
