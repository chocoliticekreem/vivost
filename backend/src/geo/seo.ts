import type { City, SeoPage } from "./types";

/**
 * Pure programmatic-SEO helpers. No I/O, no personal data.
 */

export function categoryCitySlug(categorySlug: string, citySlug: string): string {
  return `${categorySlug}-in-${citySlug}`;
}

export function seoPath(categorySlug: string, citySlug: string): string {
  return `/${categorySlug}/${citySlug}`;
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .filter((p) => p.length > 0)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

/**
 * Generate one SEO landing page per category x city combination.
 * Title format: "Escorts in London | Vivost".
 */
export function generateSeoPages(categorySlugs: string[], cities: City[]): SeoPage[] {
  const pages: SeoPage[] = [];
  for (const categorySlug of categorySlugs) {
    const category = titleCase(categorySlug);
    for (const city of cities) {
      pages.push({
        path: seoPath(categorySlug, city.slug),
        title: `${category} in ${city.name} | Vivost`,
        h1: `${category} in ${city.name}`,
        metaDescription: `Browse verified ${category.toLowerCase()} in ${city.name}, ${city.region}, on Vivost.`,
        categorySlug,
        citySlug: city.slug,
      });
    }
  }
  return pages;
}
