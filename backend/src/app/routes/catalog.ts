import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { Container } from "../container";
import { search } from "../../discovery";
import type { RankItem } from "../../discovery";
import { generateSeoPages } from "../../geo";

const CATEGORY_SLUGS = ["escorts", "massage", "companionship", "virtual"];

const CATEGORIES = [
  { slug: "escorts", name: "Escorts" },
  { slug: "massage", name: "Massage" },
  { slug: "companionship", name: "Companionship" },
  { slug: "virtual", name: "Virtual" },
];

const searchQuery = z.object({
  keyword: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  maxRate: z.coerce.number().optional(),
  sort: z.enum(["rate_asc", "rate_desc", "relevance"]).optional(),
});

const slugParam = z.object({ slug: z.string() });

export function registerCatalog(app: FastifyInstance, c: Container): void {
  app.get("/search", async (req) => {
    const q = searchQuery.parse(req.query);
    const now = c.clock.now();
    const listings = await c.listingsService.listActive();

    const items: RankItem[] = await Promise.all(
      listings.map(async (listing) => {
        const isFeatured = await c.placementsService.isFeatured(listing.id, now);
        const entitlements = await c.subscriptionsService.resolveEntitlements(
          listing.ownerAccountId,
        );
        const activeSub = await c.subscriptionsService.activeFor(listing.ownerAccountId);
        return {
          listingId: listing.id,
          categorySlug: listing.categorySlug,
          location: listing.location,
          name: listing.name,
          description: listing.description,
          hourlyRate: listing.hourlyRate,
          createdAt: listing.createdAt,
          isFeatured,
          priorityRank: entitlements.priorityRank,
          verified: listing.verified,
          freeTier: activeSub === undefined,
        };
      }),
    );

    const ranked = search(
      items,
      {
        keyword: q.keyword,
        categorySlug: q.category,
        location: q.location,
        maxRate: q.maxRate,
        sort: q.sort,
      },
      now,
    );

    const byId = new Map(listings.map((l) => [l.id, l]));
    return ranked.map((item) => byId.get(item.listingId)).filter((l) => l !== undefined);
  });

  app.get("/cities", async () => {
    return c.geoService.listCities();
  });

  app.get("/cities/:slug", async (req) => {
    const { slug } = slugParam.parse(req.params);
    return c.geoService.getBySlug(slug);
  });

  app.get("/seo-pages", async () => {
    const cities = await c.geoService.listCities();
    return generateSeoPages(CATEGORY_SLUGS, cities);
  });

  app.get("/categories", async () => {
    return CATEGORIES;
  });
}
