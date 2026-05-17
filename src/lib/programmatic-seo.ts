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
      `Discover the best places to visit in ${city.name}, ${city.country}, from signature sights and local favorites to scenic stops worth adding to your trip.`,
    intro: (city) =>
      `Start with the places that give ${city.name} its character: memorable viewpoints, atmospheric neighborhoods, cultural stops, and easy-to-love local highlights. Compare the city's standout ideas before opening a deeper destination or guide page.`,
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
      `Whether you are planning a first visit, a relaxed weekend, or a few open hours between stops, ${city.name} has plenty to shape a memorable route. Browse sights, local areas, scenic places, and practical guide ideas.`,
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
      `${city.name} rewards travelers who leave room for both landmarks and slower local moments. This guide brings together the city's most useful travel ideas, from standout places to visit to simple route inspiration for a smoother trip.`,
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
      `Discover the best cafes in ${city.name}, ${city.country}, from stylish coffee stops and cozy brunch places to relaxed corners for a slower city break.`,
    intro: (city) =>
      `A good cafe can turn a city walk into a proper pause. Explore coffee-friendly corners of ${city.name}, from easy brunch ideas and bakery stops to relaxed neighborhoods where the day can slow down for a while.`,
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
      `Find restaurants and dining-friendly places in ${city.name}, ${city.country}, with city food areas, local flavors, markets, and relaxed meal stops.`,
    intro: (city) =>
      `Food is one of the easiest ways to understand ${city.name}. Use this guide to find dining areas, market stops, seafood spots, local flavors, and places that make sense around a day of sightseeing.`,
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
      `Explore the best beaches and waterfront places near ${city.name}, ${city.country}, from coastal walks and bays to scenic places by the water.`,
    intro: (city) =>
      `${city.name} is at its best when the route opens toward the water. Browse beaches, bays, corniche walks, islands, and coastal places that bring a softer pace to the city.`,
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
      `Explore family-friendly attractions in ${city.name}, ${city.country}, including easy sightseeing stops, parks, museums, beaches, and relaxed city ideas.`,
    intro: (city) =>
      `For a family trip, the best stops are often simple, flexible, and easy to enjoy at your own pace. Explore relaxed attractions around ${city.name}, from waterfront walks and museums to open-air places that work well between bigger plans.`,
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
