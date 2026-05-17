import type { City } from "@/lib/types";

export type CitySeoPageSlug = "best-places" | "things-to-do" | "travel-guide";

export type CitySeoPageConfig = {
  slug: CitySeoPageSlug;
  label: string;
  shortLabel: string;
  title: (city: City) => string;
  metadataTitle: (city: City) => string;
  description: (city: City) => string;
  intro: (city: City) => string;
  eyebrow: string;
};

type CitySeoContentCounts = {
  destinations: number;
  attractions: number;
  guides: number;
};

export const citySeoPages: CitySeoPageConfig[] = [
  {
    slug: "best-places",
    label: "Best Places to Visit",
    shortLabel: "Best places",
    eyebrow: "Best places to visit",
    title: (city) => `Best Places to Visit in ${city.name}`,
    metadataTitle: (city) => `Best Places to Visit in ${city.name} | Top7Spots`,
    description: (city) =>
      `Explore the best places to visit in ${city.name}, ${city.country}, including curated destinations, attractions, guides, and city travel ideas from Top7Spots.`,
    intro: (city) =>
      `Use this page as a focused starting point for the best places to visit in ${city.name}. It brings together existing Top7Spots destinations, attractions, and guides so travelers can compare highlights, practical notes, and nearby ideas without leaving the city hub.`,
  },
  {
    slug: "things-to-do",
    label: "Things to Do",
    shortLabel: "Things to do",
    eyebrow: "Things to do",
    title: (city) => `Things to Do in ${city.name}`,
    metadataTitle: (city) => `Things to Do in ${city.name} | Top7Spots`,
    description: (city) =>
      `Find things to do in ${city.name}, ${city.country}, from attractions and destination ideas to travel guides and local planning notes.`,
    intro: (city) =>
      `This things-to-do guide is generated from published Top7Spots content for ${city.name}. Browse attractions, destination ideas, and guides that can help shape a simple route, weekend plan, or first-time city itinerary.`,
  },
  {
    slug: "travel-guide",
    label: "Travel Guide",
    shortLabel: "Travel guide",
    eyebrow: "Travel guide",
    title: (city) => `${city.name} Travel Guide`,
    metadataTitle: (city) => `${city.name} Travel Guide | Top7Spots`,
    description: (city) =>
      `Plan a ${city.name} travel guide with curated places to visit, things to do, attractions, destination pages, and practical Top7Spots guide links.`,
    intro: (city) =>
      `The ${city.name} travel guide connects the city's published destinations, attractions, and planning articles into one scalable SEO page. It is designed to grow automatically as new admin-managed content is published.`,
  },
];

export function citySeoPath(citySlug: string, pageSlug: CitySeoPageSlug | string) {
  return `/cities/${citySlug}/${pageSlug}`;
}

export function getCitySeoPage(pageSlug: string) {
  return citySeoPages.find((page) => page.slug === pageSlug);
}

export function hasMeaningfulCitySeoContent(pageSlug: string, counts: CitySeoContentCounts) {
  if (pageSlug === "best-places") {
    return counts.destinations > 0 || counts.attractions > 0;
  }

  if (pageSlug === "things-to-do") {
    return counts.attractions > 0 || counts.destinations > 0;
  }

  if (pageSlug === "travel-guide") {
    return counts.guides > 0 || counts.destinations > 0 || counts.attractions > 0;
  }

  return false;
}
