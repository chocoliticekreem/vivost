import { describe, it, expect } from "vitest";
import { NotFoundError } from "../core";
import { InMemoryGeoRepository } from "./inMemoryGeoRepository";
import { GeoService } from "./geoService";
import { categoryCitySlug, seoPath, generateSeoPages } from "./seo";
import type { City } from "./types";

function makeService(): GeoService {
  return new GeoService(new InMemoryGeoRepository());
}

describe("GeoService", () => {
  it("seeds the UK cities and lists them", async () => {
    const svc = makeService();
    const seeded = await svc.seed();
    const slugs = seeded.map((c) => c.slug).sort();
    expect(slugs).toEqual(
      ["birmingham", "bristol", "edinburgh", "glasgow", "leeds", "liverpool", "london", "manchester"],
    );
    const listed = await svc.listCities();
    expect(listed).toHaveLength(8);
  });

  it("seed is idempotent by slug", async () => {
    const svc = makeService();
    await svc.seed();
    await svc.seed();
    expect(await svc.listCities()).toHaveLength(8);
  });

  it("getBySlug returns the city", async () => {
    const svc = makeService();
    await svc.seed();
    const london = await svc.getBySlug("london");
    expect(london.name).toBe("London");
    expect(london.region).toBe("Greater London");
  });

  it("getBySlug throws NotFoundError when missing", async () => {
    const svc = makeService();
    await svc.seed();
    await expect(svc.getBySlug("atlantis")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("seo", () => {
  it("categoryCitySlug joins with -in-", () => {
    expect(categoryCitySlug("escorts", "london")).toBe("escorts-in-london");
  });

  it("seoPath builds /category/city", () => {
    expect(seoPath("escorts", "london")).toBe("/escorts/london");
  });

  it("generateSeoPages covers every category x city combination", () => {
    const cities: City[] = [
      { id: "1", slug: "london", name: "London", region: "Greater London" },
      { id: "2", slug: "manchester", name: "Manchester", region: "North West" },
    ];
    const categories = ["escorts", "massage", "companionship"];
    const pages = generateSeoPages(categories, cities);
    expect(pages).toHaveLength(categories.length * cities.length);
    const sample = pages.find((p) => p.path === "/escorts/london");
    expect(sample?.title).toBe("Escorts in London | Vivost");
    expect(sample?.h1).toBe("Escorts in London");
  });
});
