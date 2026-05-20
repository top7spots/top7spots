import type { Attraction, City, Destination, Guide } from "@/lib/types";

export type CityMaturity = "sparse" | "growing" | "mature" | "flagship";

export type CityContentSet = {
  destinations: Destination[];
  attractions: Attraction[];
  guides: Guide[];
};

export type InterestSignal = {
  slug: string;
  label: string;
  keywords: string[];
  minimumItems?: number;
};

const routeKeywords = [
  "day trip",
  "road trip",
  "route",
  "drive",
  "from",
  "outside",
  "nearby",
  "wadi",
  "desert",
  "mountain",
  "fort",
  "sands",
];

export function getCityMaturity(content: CityContentSet): CityMaturity {
  const destinationCount = getEligibleTopPicks(content.destinations, 12).length;
  const attractionCount = getEligibleAttractions(content.attractions).length;
  const guideCount = getEligibleGuides(content.guides).length;
  const total = destinationCount + attractionCount + guideCount;

  if (destinationCount >= 10 && attractionCount >= 6 && guideCount >= 5 && total >= 24) {
    return "flagship";
  }

  if (destinationCount >= 6 && total >= 14) {
    return "mature";
  }

  if (destinationCount >= 3 || total >= 6) {
    return "growing";
  }

  return "sparse";
}

export function getEligibleTopPicks(destinations: Destination[], limit = 6) {
  return [...destinations]
    .filter(isMeaningfulDestination)
    .sort(sortCuratedItems)
    .slice(0, limit);
}

export function getEligibleGuides(guides: Guide[], limit?: number) {
  const eligibleGuides = [...guides].filter(isMeaningfulGuide).sort(sortCuratedItems);
  return typeof limit === "number" ? eligibleGuides.slice(0, limit) : eligibleGuides;
}

export function getEligibleAttractions(attractions: Attraction[], limit?: number) {
  const eligibleAttractions = [...attractions].filter(isMeaningfulAttraction).sort(sortCuratedItems);
  return typeof limit === "number" ? eligibleAttractions.slice(0, limit) : eligibleAttractions;
}

export function getRouteExtensions(city: City, destinations: Destination[], limit = 4) {
  return [...destinations]
    .filter((destination) => isValidRouteExtension(city, destination))
    .sort(sortCuratedItems)
    .slice(0, limit);
}

export function getMatchingContentForKeywords(content: CityContentSet, keywords: string[]) {
  return {
    destinations: content.destinations.filter(
      (item) => isMeaningfulDestination(item) && matchesKeywords(destinationSearchText(item), keywords),
    ),
    attractions: content.attractions.filter(
      (item) => isMeaningfulAttraction(item) && matchesKeywords(attractionSearchText(item), keywords),
    ),
    guides: content.guides.filter(
      (item) => isMeaningfulGuide(item) && matchesKeywords(guideSearchText(item), keywords),
    ),
  };
}

export function hasMeaningfulInterestContent(content: CityContentSet, signal: InterestSignal) {
  const matchingContent = getMatchingContentForKeywords(content, signal.keywords);
  const total =
    matchingContent.destinations.length + matchingContent.attractions.length + matchingContent.guides.length;

  return total >= (signal.minimumItems || 2);
}

export function hasMeaningfulBroadCityContent(content: CityContentSet, minimumItems = 3) {
  return (
    getEligibleTopPicks(content.destinations, minimumItems).length +
      getEligibleAttractions(content.attractions, minimumItems).length +
      getEligibleGuides(content.guides, minimumItems).length >=
    minimumItems
  );
}

export function isMeaningfulDestination(destination: Destination) {
  return Boolean(
    destination.name &&
      destination.slug &&
      (hasText(destination.summary, 35) ||
        hasText(destination.description, 80) ||
        destination.highlights.length >= 2 ||
        destination.travelTips.length >= 2 ||
        destination.practicalInfo.length >= 2),
  );
}

export function isMeaningfulAttraction(attraction: Attraction) {
  return Boolean(
    attraction.name &&
      attraction.slug &&
      (attraction.category || attraction.type) &&
      (hasText(attraction.summary, 35) || hasText(attraction.description, 80)),
  );
}

export function isMeaningfulGuide(guide: Guide) {
  return Boolean(
    guide.title &&
      guide.slug &&
      (hasText(guide.excerpt, 45) || guide.content.filter((item) => hasText(item, 45)).length >= 2),
  );
}

export function isValidRouteExtension(city: City, destination: Destination) {
  if (!isMeaningfulDestination(destination)) {
    return false;
  }

  const cityName = normalizeText(city.name);
  const destinationCity = normalizeText(destination.city);
  const location = normalizeText(destination.location);
  const region = normalizeText(destination.region);
  const searchText = normalizeText(destinationSearchText(destination));
  const appearsOutsideCity =
    Boolean(destinationCity && destinationCity !== cityName) ||
    Boolean(location && !location.includes(cityName)) ||
    Boolean(region && !region.includes(cityName));

  return appearsOutsideCity && routeKeywords.some((keyword) => searchText.includes(keyword));
}

export function matchesKeywords(text: string, keywords: string[]) {
  const normalizedText = normalizeText(text);
  return keywords.some((keyword) => normalizedText.includes(normalizeText(keyword)));
}

export function destinationSearchText(destination: Destination) {
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

export function attractionSearchText(attraction: Attraction) {
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

export function guideSearchText(guide: Guide) {
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

function sortCuratedItems<T extends { displayOrder?: number; isFeatured?: boolean; name?: string; title?: string }>(
  a: T,
  b: T,
) {
  if (a.isFeatured !== b.isFeatured) {
    return a.isFeatured ? -1 : 1;
  }

  const orderA = typeof a.displayOrder === "number" && Number.isFinite(a.displayOrder) ? a.displayOrder : 999;
  const orderB = typeof b.displayOrder === "number" && Number.isFinite(b.displayOrder) ? b.displayOrder : 999;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  return String(a.name ?? a.title ?? "").localeCompare(String(b.name ?? b.title ?? ""));
}

function hasText(value: string, minimumLength: number) {
  return normalizeText(value).length >= minimumLength;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}
