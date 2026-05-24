import { NextResponse } from "next/server";
import {
  getPublishedAttractions,
  getPublishedCities,
  getPublishedDestinations,
  getPublishedGuides,
} from "@/lib/data";
import { getCanonicalDestinationPath } from "@/lib/city-intelligence";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchResult = {
  id: string;
  title: string;
  type: "City" | "Destination" | "Guide" | "Attraction";
  href: string;
  context: string;
  description: string;
};

type SearchCandidate = SearchResult & {
  searchable: Array<string | undefined>;
  score?: number;
};

const resultLimit = 10;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const normalizedQuery = normalize(query);
  const [cities, destinations, guides, attractions] = await Promise.all([
    getPublishedCities(),
    getPublishedDestinations(),
    getPublishedGuides(),
    getPublishedAttractions(),
  ]);

  const cityBySlug = new Map(cities.map((city) => [city.slug, city]));
  const results: SearchResult[] = ([
    ...cities.map((city) => ({
      id: `city-${city.id}`,
      title: city.name,
      type: "City" as const,
      href: `/${city.slug}`,
      context: [city.country, city.region].filter(Boolean).join(" · "),
      description: city.shortDescription || city.seoDescription || city.longDescription,
      searchable: [
        "city",
        city.name,
        city.slug,
        city.country,
        city.region,
        city.shortDescription,
        city.longDescription,
        city.seoTitle,
        city.seoDescription,
        city.seoKeywords.join(" "),
      ],
    })),
    ...destinations.map((destination) => {
      const city = destination.citySlug ? cityBySlug.get(destination.citySlug) : undefined;

      return {
        id: `destination-${destination.id}`,
        title: destination.name,
        type: "Destination" as const,
        href: getCanonicalDestinationPath(destination, city),
        context: [destination.city || city?.name, city?.country || destination.region].filter(Boolean).join(" · "),
        description: destination.summary || destination.seoDescription || destination.description,
        searchable: [
          "destination",
          "spot",
          destination.name,
          destination.slug,
          destination.city,
          destination.citySlug,
          destination.category,
          destination.location,
          destination.region,
          destination.summary,
          destination.description,
          destination.seoTitle,
          destination.seoDescription,
        ],
      };
    }),
    ...guides.map((guide) => {
      const city = guide.targetType === "city" && guide.citySlug ? cityBySlug.get(guide.citySlug) : undefined;

      return {
        id: `guide-${guide.id}`,
        title: guide.title,
        type: "Guide" as const,
        href:
          guide.targetType === "city" && guide.citySlug
            ? `/${guide.citySlug}/guides/${guide.slug}`
            : `/guides/${guide.slug}`,
        context: [city?.name, city?.country, guide.category].filter(Boolean).join(" · "),
        description: guide.excerpt || guide.seoDescription || guide.content[0],
        searchable: [
          "guide",
          "travel guide",
          guide.title,
          guide.slug,
          guide.citySlug,
          city?.name,
          city?.country,
          guide.category,
          guide.excerpt,
          guide.content.join(" "),
          guide.seoTitle,
          guide.seoDescription,
        ],
      };
    }),
    ...attractions
      .filter((attraction) => attraction.citySlug)
      .map((attraction) => {
        const city = cityBySlug.get(attraction.citySlug);

        return {
          id: `attraction-${attraction.id}`,
          title: attraction.name,
          type: "Attraction" as const,
          href: `/${attraction.citySlug}/attractions/${attraction.slug}`,
          context: [attraction.city || city?.name, city?.country, attraction.category].filter(Boolean).join(" · "),
          description: attraction.summary || attraction.seoDescription || attraction.description,
          searchable: [
            "attraction",
            attraction.name,
            attraction.slug,
            attraction.city,
            attraction.citySlug,
            city?.country,
            attraction.category,
            attraction.type,
            attraction.summary,
            attraction.description,
            attraction.seoTitle,
            attraction.seoDescription,
          ],
        };
      }),
  ] satisfies SearchCandidate[])
    .map((result) => ({ ...result, score: scoreSearchResult(normalizedQuery, result.searchable) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, resultLimit)
    .map(({ searchable, score, ...result }) => {
      void searchable;
      void score;
      return result;
    });

  return NextResponse.json(
    { results },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function scoreSearchResult(query: string, fields: Array<string | undefined>) {
  let score = 0;

  for (const field of fields) {
    const normalizedField = normalize(field || "");

    if (!normalizedField) {
      continue;
    }

    if (normalizedField === query) {
      score += 100;
    } else if (normalizedField.startsWith(query)) {
      score += 60;
    } else if (normalizedField.includes(query)) {
      score += 20;
    }
  }

  return score;
}
