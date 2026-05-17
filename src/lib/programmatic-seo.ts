import type { Attraction, City, Destination, Guide } from "@/lib/types";

export type CitySeoPageSlug = "best-places" | "things-to-do" | "travel-guide";
export type CityTopicPageSlug = "best-cafes" | "best-restaurants" | "best-beaches" | "family-attractions";
export type CityProgrammaticPageSlug = CitySeoPageSlug | CityTopicPageSlug;

export type CitySeoPageConfig = {
  slug: CityProgrammaticPageSlug;
  label: string;
  shortLabel: string;
  title: (city: City) => string;
  metadataTitle: (city: City) => string;
  description: (city: City) => string;
  intro: (city: City) => string;
  eyebrow: string;
  pageType?: "seo" | "topic";
  keywords?: string[];
  minimumItems?: number;
};

type CitySeoContentCounts = {
  destinations: number;
  attractions: number;
  guides: number;
};

export type CityProgrammaticContent = {
  destinations: Destination[];
  attractions: Attraction[];
  guides: Guide[];
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

export const cityTopicPages: CitySeoPageConfig[] = [
  {
    slug: "best-cafes",
    label: "Best Cafes",
    shortLabel: "Best cafes",
    eyebrow: "Cafe guide",
    pageType: "topic",
    keywords: ["cafe", "cafes", "café", "coffee", "espresso", "roastery", "bakery", "brunch", "tea"],
    minimumItems: 2,
    title: (city) => `Best Cafes in ${city.name}`,
    metadataTitle: (city) => `Best Cafes in ${city.name} | Top7Spots`,
    description: (city) =>
      `Explore cafes and coffee-friendly travel ideas in ${city.name}, ${city.country}, using existing Top7Spots destinations, attractions, and guides.`,
    intro: (city) =>
      `This cafe-focused page gathers existing Top7Spots content for ${city.name} that mentions cafes, coffee stops, brunch, bakeries, and relaxed neighborhood places. It updates automatically as more admin-managed content is published.`,
  },
  {
    slug: "best-restaurants",
    label: "Best Restaurants",
    shortLabel: "Restaurants",
    eyebrow: "Food and dining",
    pageType: "topic",
    keywords: ["restaurant", "restaurants", "dining", "food", "cuisine", "kitchen", "grill", "seafood", "market", "brunch"],
    minimumItems: 2,
    title: (city) => `Best Restaurants in ${city.name}`,
    metadataTitle: (city) => `Best Restaurants in ${city.name} | Top7Spots`,
    description: (city) =>
      `Find restaurant and dining-related travel ideas in ${city.name}, ${city.country}, from published Top7Spots city content.`,
    intro: (city) =>
      `Use this page to find dining-related Top7Spots content for ${city.name}. It highlights existing destinations, attractions, and guides that reference restaurants, local food areas, markets, and places useful for planning a food-led route.`,
  },
  {
    slug: "best-beaches",
    label: "Best Beaches",
    shortLabel: "Beaches",
    eyebrow: "Beach guide",
    pageType: "topic",
    keywords: ["beach", "beaches", "coast", "coastal", "sea", "bay", "island", "lagoon", "shore", "waterfront", "corniche"],
    minimumItems: 2,
    title: (city) => `Best Beaches in ${city.name}`,
    metadataTitle: (city) => `Best Beaches in ${city.name} | Top7Spots`,
    description: (city) =>
      `Browse beach, coastal, island, and waterfront places connected to ${city.name}, ${city.country}, from Top7Spots content.`,
    intro: (city) =>
      `This beach topic page filters the ${city.name} library for coastal places, waterfront walks, islands, bays, and beach-friendly destination ideas. It stays data-driven and grows as new Top7Spots content is published.`,
  },
  {
    slug: "family-attractions",
    label: "Family Attractions",
    shortLabel: "Family attractions",
    eyebrow: "Family travel",
    pageType: "topic",
    keywords: ["family", "kids", "children", "park", "museum", "garden", "aquarium", "zoo", "fort", "corniche", "beach"],
    minimumItems: 2,
    title: (city) => `Family Attractions in ${city.name}`,
    metadataTitle: (city) => `Family Attractions in ${city.name} | Top7Spots`,
    description: (city) =>
      `Explore family-friendly attractions and destination ideas in ${city.name}, ${city.country}, using existing Top7Spots content.`,
    intro: (city) =>
      `This family travel page brings together existing Top7Spots content for ${city.name} that may suit relaxed sightseeing, parks, museums, waterfront walks, beaches, and other easy-to-plan city stops.`,
  },
];

export const cityProgrammaticPages = [...citySeoPages, ...cityTopicPages];

export function citySeoPath(citySlug: string, pageSlug: CityProgrammaticPageSlug | string) {
  return `/cities/${citySlug}/${pageSlug}`;
}

export function getCitySeoPage(pageSlug: string) {
  return citySeoPages.find((page) => page.slug === pageSlug);
}

export function getCityProgrammaticPage(pageSlug: string) {
  return cityProgrammaticPages.find((page) => page.slug === pageSlug);
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

export function getCityProgrammaticContent(
  page: CitySeoPageConfig,
  content: CityProgrammaticContent,
): CityProgrammaticContent {
  if (page.pageType !== "topic") {
    return content;
  }

  const keywords = page.keywords || [];

  return {
    destinations: content.destinations.filter((item) => matchesKeywords(destinationSearchText(item), keywords)),
    attractions: content.attractions.filter((item) => matchesKeywords(attractionSearchText(item), keywords)),
    guides: content.guides.filter((item) => matchesKeywords(guideSearchText(item), keywords)),
  };
}

export function hasMeaningfulCityProgrammaticContent(page: CitySeoPageConfig, content: CityProgrammaticContent) {
  if (page.pageType !== "topic") {
    return hasMeaningfulCitySeoContent(page.slug, {
      destinations: content.destinations.length,
      attractions: content.attractions.length,
      guides: content.guides.length,
    });
  }

  const minimumItems = page.minimumItems || 2;

  return content.destinations.length + content.attractions.length + content.guides.length >= minimumItems;
}

function matchesKeywords(text: string, keywords: string[]) {
  const normalizedText = text.toLowerCase();

  return keywords.some((keyword) => normalizedText.includes(keyword.toLowerCase()));
}

function destinationSearchText(destination: Destination) {
  return [
    destination.name,
    destination.slug,
    destination.category,
    destination.location,
    destination.region,
    destination.summary,
    destination.description,
    destination.bestSeason,
    destination.howToGo,
    destination.seoTitle,
    destination.seoDescription,
    ...destination.highlights,
    ...destination.practicalInfo,
    ...destination.travelTips,
    ...destination.nearbyAttractions,
  ]
    .filter(Boolean)
    .join(" ");
}

function attractionSearchText(attraction: Attraction) {
  return [
    attraction.name,
    attraction.slug,
    attraction.category,
    attraction.type,
    attraction.description,
    attraction.summary,
    attraction.recommendedTime,
    attraction.seoTitle,
    attraction.seoDescription,
  ]
    .filter(Boolean)
    .join(" ");
}

function guideSearchText(guide: Guide) {
  return [
    guide.title,
    guide.slug,
    guide.excerpt,
    guide.category,
    guide.seoTitle,
    guide.seoDescription,
    ...guide.content,
  ]
    .filter(Boolean)
    .join(" ");
}
