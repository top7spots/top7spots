import type { MetadataRoute } from "next";
import {
  getPublishedAttractions,
  getPublishedCities,
  getPublishedDestinations,
  getPublishedGuides,
} from "@/lib/data";
import { buildCountryHubs, countryPath } from "@/lib/country-hubs";
import { slugify } from "@/lib/format";
import { citySeoPages, citySeoPath, hasMeaningfulCitySeoContent } from "@/lib/programmatic-seo";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function lastModified(...dates: Array<string | undefined>) {
  const date = dates.find(Boolean);
  return date ? new Date(date) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cities, destinations, guides, attractions] = await Promise.all([
    getPublishedCities(),
    getPublishedDestinations(),
    getPublishedGuides(),
    getPublishedAttractions(),
  ]);
  const countries = buildCountryHubs({ cities, destinations, guides, attractions });
  const cityContentCounts = new Map<string, { destinations: number; attractions: number; guides: number }>(
    cities.map((city) => {
      const citySlug = slugify(city.slug);

      return [
        citySlug,
        {
          destinations: destinations.filter((destination) => slugify(destination.citySlug) === citySlug).length,
          attractions: attractions.filter((attraction) => slugify(attraction.citySlug) === citySlug).length,
          guides: guides.filter((guide) => slugify(guide.citySlug) === citySlug).length,
        },
      ];
    }),
  );

  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/destinations"),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/guides"),
      changeFrequency: "daily",
      priority: 0.85,
    },
    ...cities.map((city) => ({
      url: absoluteUrl(`/${slugify(city.slug)}`),
      lastModified: lastModified(city.updatedAt, city.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...cities.flatMap((city) => {
      const citySlug = slugify(city.slug);
      const counts = cityContentCounts.get(citySlug) || { destinations: 0, attractions: 0, guides: 0 };

      return citySeoPages
        .filter((page) => hasMeaningfulCitySeoContent(page.slug, counts))
        .map((page) => ({
          url: absoluteUrl(citySeoPath(citySlug, page.slug)),
          lastModified: lastModified(city.updatedAt, city.createdAt),
          changeFrequency: "weekly" as const,
          priority: page.slug === "travel-guide" ? 0.82 : 0.84,
        }));
    }),
    ...countries.map((country) => ({
      url: absoluteUrl(countryPath(country.slug)),
      lastModified: lastModified(country.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.86,
    })),
    ...destinations.map((destination) => ({
      url: absoluteUrl(
        destination.citySlug
          ? `/${slugify(destination.citySlug)}/destinations/${slugify(destination.slug)}`
          : `/destinations/${slugify(destination.slug)}`,
      ),
      lastModified: lastModified(destination.updatedAt, destination.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...guides.map((guide) => ({
      url: absoluteUrl(
        guide.citySlug ? `/${slugify(guide.citySlug)}/guides/${slugify(guide.slug)}` : `/guides/${slugify(guide.slug)}`,
      ),
      lastModified: lastModified(guide.updatedAt, guide.createdAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...attractions
      .filter((attraction) => attraction.citySlug)
      .map((attraction) => ({
        url: absoluteUrl(`/${slugify(attraction.citySlug)}/attractions/${slugify(attraction.slug)}`),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
  ];
}
