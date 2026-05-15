import type { MetadataRoute } from "next";
import {
  getPublishedAttractions,
  getPublishedCities,
  getPublishedDestinations,
  getPublishedGuides,
} from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

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

  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    ...cities.map((city) => ({
      url: absoluteUrl(`/${city.slug}`),
      lastModified: lastModified(city.updatedAt, city.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...destinations.map((destination) => ({
      url: absoluteUrl(`/${destination.citySlug}/destinations/${destination.slug}`),
      lastModified: lastModified(destination.updatedAt, destination.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...guides.map((guide) => ({
      url: absoluteUrl(`/${guide.citySlug}/guides/${guide.slug}`),
      lastModified: lastModified(guide.updatedAt, guide.createdAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...attractions.map((attraction) => ({
      url: absoluteUrl(`/${attraction.citySlug}/attractions/${attraction.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
