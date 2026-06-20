import Fastify from "fastify";
import { describe, it, expect } from "vitest";
import { createInMemoryContainer } from "../container";
import { registerErrorHandler } from "../errors";
import { fixedClock } from "../../core/testing";
import { registerCatalog } from "./catalog";

function makeApp() {
  const c = createInMemoryContainer({ clock: fixedClock(new Date("2026-01-01T00:00:00.000Z")) });
  const app = Fastify();
  registerErrorHandler(app);
  registerCatalog(app, c);
  return { app, c };
}

async function createActiveListing(
  c: ReturnType<typeof createInMemoryContainer>,
  ownerAccountId: string,
  name: string,
) {
  const listing = await c.listingsService.create(ownerAccountId, {
    name,
    categorySlug: "escorts",
    location: "London",
    hourlyRate: 150,
    description: `${name} description`,
  });
  await c.listingsService.publish(ownerAccountId, listing.id);
  return listing;
}

describe("catalog routes", () => {
  it("GET /cities returns seeded UK cities", async () => {
    const { app } = makeApp();
    const res = await app.inject({ method: "GET", url: "/cities" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    const slugs = body.map((city: { slug: string }) => city.slug);
    expect(slugs).toContain("london");
    expect(slugs).toContain("manchester");
  });

  it("GET /cities/:slug returns a single city", async () => {
    const { app } = makeApp();
    const res = await app.inject({ method: "GET", url: "/cities/london" });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("London");
  });

  it("GET /categories returns the 4 standard categories", async () => {
    const { app } = makeApp();
    const res = await app.inject({ method: "GET", url: "/categories" });
    expect(res.statusCode).toBe(200);
    const slugs = res.json().map((cat: { slug: string }) => cat.slug);
    expect(slugs).toEqual(["escorts", "massage", "companionship", "virtual"]);
  });

  it("GET /seo-pages generates category x city pages", async () => {
    const { app } = makeApp();
    const res = await app.inject({ method: "GET", url: "/seo-pages" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.length).toBeGreaterThan(0);
    const londonEscorts = body.find(
      (p: { path: string }) => p.path === "/escorts/london",
    );
    expect(londonEscorts).toBeTruthy();
    expect(londonEscorts.categorySlug).toBe("escorts");
  });

  it("GET /search returns active listings", async () => {
    const { app, c } = makeApp();
    const owner = "44444444-4444-4444-4444-444444444444";
    await createActiveListing(c, owner, "Alice");

    const res = await app.inject({ method: "GET", url: "/search" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Alice");
  });

  it("GET /search ranks a featured listing first", async () => {
    const { app, c } = makeApp();
    const ownerA = "55555555-5555-5555-5555-555555555555";
    const ownerB = "66666666-6666-6666-6666-666666666666";

    await createActiveListing(c, ownerA, "Plain");
    const featured = await createActiveListing(c, ownerB, "Featured");
    await c.placementsService.purchase(featured.id, "featured", 7);

    const res = await app.inject({ method: "GET", url: "/search" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(2);
    expect(body[0].name).toBe("Featured");
  });
});
