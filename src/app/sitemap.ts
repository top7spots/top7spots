import type { MetadataRoute } from "next";
import {
  getPublishedAttractions,
  getPublishedCities,
  getPublishedDestinations,
  getPublishedGuides,
} from "@/lib/data";
import { buildCountryHubs, countryPath } from "@/lib/country-hubs";
import { slugify } from "@/lib/format";
import {
  cityProgrammaticPages,
  citySeoPath,
  getCityProgrammaticContent,
  hasMeaningfulCityProgrammaticContent,
} from "@/lib/programmatic-seo";
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
  const cityContent = new Map(
    cities.map((city) => {
      const citySlug = slugify(city.slug);

      return [
        citySlug,
        {
          destinations: destinations.filter((destination) => slugify(destination.citySlug) === citySlug),
          attractions: attractions.filter((attraction) => slugify(attraction.citySlug) === citySlug),
          guides: guides.filter((guide) => slugify(guide.citySlug) === citySlug),
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
    ...cities
      .filter((city) => {
        const content = cityContent.get(slugify(city.slug));
        return content ? content.guides.length > 0 : false;
      })
      .map((city) => ({
        url: absoluteUrl(`/${slugify(city.slug)}/guides`),
        lastModified: lastModified(city.updatedAt, city.createdAt),
        changeFrequency: "weekly" as const,
        priority: 0.74,
      })),
    ...cities.flatMap((city) => {
      const citySlug = slugify(city.slug);
      const content = cityContent.get(citySlug) || { destinations: [], attractions: [], guides: [] };

      return cityProgrammaticPages
        .filter((page) =>
          hasMeaningfulCityProgrammaticContent(page, getCityProgrammaticContent(page, content)),
        )
        .map((page) => ({
          url: absoluteUrl(citySeoPath(citySlug, page.slug)),
          lastModified: lastModified(city.updatedAt, city.createdAt),
          changeFrequency: "weekly" as const,
          priority: page.pageType === "topic" ? 0.68 : page.slug === "travel-guide" ? 0.82 : 0.84,
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
