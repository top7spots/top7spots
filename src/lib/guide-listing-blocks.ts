import { getCanonicalDestinationPath } from "@/lib/city-intelligence";
import { countryPath } from "@/lib/country-hubs";
import { slugify } from "@/lib/format";
import { getGuideHref } from "@/lib/guide-routes";
import type {
  City,
  Destination,
  Guide,
  GuideListingBlock,
  GuideListingBlockCustomItem,
  GuideListingBlockType,
  Restaurant,
  Attraction,
} from "@/lib/types";

const guideListingBlockTypes: GuideListingBlockType[] = [
  "destinations",
  "cities",
  "countries",
  "guides",
  "restaurants",
  "activities",
  "custom",
];

export type ResolvedGuideListingBlockItem = {
  key: string;
  href: string;
  title: string;
  description?: string;
  image?: string;
  badge?: string;
};

export type ResolvedGuideListingBlock = {
  id: string;
  title: string;
  type: GuideListingBlockType;
  items: ResolvedGuideListingBlockItem[];
};

type ResolveGuideListingBlockItemsInput = {
  block: GuideListingBlock;
  cities: City[];
  destinations: Destination[];
  guides: Guide[];
  restaurants?: Restaurant[];
  attractions?: Attraction[];
  currentGuideId?: string;
};

export function normalizeGuideListingBlocks(value: unknown): GuideListingBlock[] {
  const parsedValue = typeof value === "string" ? parseJson(value) : value;

  if (!Array.isArray(parsedValue)) {
    return [];
  }

  return parsedValue
    .filter(isRecord)
    .map((block, index) => normalizeGuideListingBlock(block, index))
    .filter((block): block is GuideListingBlock => Boolean(block));
}

export function resolveGuideListingBlocks(input: {
  blocks: GuideListingBlock[];
  cities: City[];
  destinations: Destination[];
  guides: Guide[];
  restaurants?: Restaurant[];
  attractions?: Attraction[];
  currentGuideId?: string;
}) {
  return input.blocks
    .map((block) => ({
      id: block.id,
      title: block.title,
      type: block.type,
      items: resolveGuideListingBlockItems({
        block,
        cities: input.cities,
        destinations: input.destinations,
        guides: input.guides,
        restaurants: input.restaurants,
        attractions: input.attractions,
        currentGuideId: input.currentGuideId,
      }),
    }))
    .filter((block) => block.title && block.items.length > 0);
}

export function resolveGuideListingBlockItems({
  block,
  cities,
  destinations,
  guides,
  restaurants = [],
  attractions = [],
  currentGuideId,
}: ResolveGuideListingBlockItemsInput): ResolvedGuideListingBlockItem[] {
  if (block.type === "custom") {
    return uniqueByKey(
      (block.customItems || [])
        .map((item, index) => resolveCustomItem(item, block.id, index))
        .filter((item): item is ResolvedGuideListingBlockItem => Boolean(item)),
    );
  }

  const itemIds = block.itemIds || [];

  if (block.type === "destinations") {
    return uniqueByKey(
      itemIds
        .map((id) => destinations.find((destination) => matchesEntityId(destination, id)))
        .filter((destination): destination is Destination => Boolean(destination))
        .map((destination) => ({
          key: `destination-${destination.id}`,
          href: getListingBlockHref("destinations", destination),
          title: destination.name,
          description: destination.summary || destination.location || destination.city,
          image: destination.image,
          badge: destination.category || "Destination",
        })),
    );
  }

  if (block.type === "cities") {
    return uniqueByKey(
      itemIds
        .map((id) => cities.find((city) => matchesEntityId(city, id)))
        .filter((city): city is City => Boolean(city))
        .map((city) => ({
          key: `city-${city.id}`,
          href: getListingBlockHref("cities", city),
          title: city.name,
          description: city.shortDescription || city.region || city.country,
          image: city.cardImage || city.featuredImage || city.heroImage,
          badge: city.country || "City",
        })),
    );
  }

  if (block.type === "countries") {
    const countryBySlug = new Map<string, ResolvedGuideListingBlockItem>();

    for (const id of itemIds) {
      const countryCity = cities.find((city) => slugify(city.country) === slugify(id));

      if (!countryCity) {
        continue;
      }

      const countrySlug = slugify(countryCity.country);
      countryBySlug.set(countrySlug, {
        key: `country-${countrySlug}`,
        href: getListingBlockHref("countries", countrySlug),
        title: countryCity.country,
        description: `Explore cities, destinations, and travel guides across ${countryCity.country}.`,
        image: countryCity.featuredImage || countryCity.heroImage || countryCity.cardImage,
        badge: "Country",
      });
    }

    return Array.from(countryBySlug.values());
  }

  if (block.type === "guides") {
    return uniqueByKey(
      itemIds
        .map((id) => guides.find((guide) => matchesEntityId(guide, id)))
        .filter((guide): guide is Guide => Boolean(guide))
        .filter((guide) => guide.id !== currentGuideId)
        .map((guide) => ({
          key: `guide-${guide.id}`,
          href: getListingBlockHref("guides", guide),
          title: guide.title,
          description: guide.excerpt || guide.seoDescription,
          image: guide.coverImage || guide.image,
          badge: guide.category || "Guide",
        })),
    );
  }

  if (block.type === "restaurants") {
    return uniqueByKey(
      itemIds
        .map((id) => restaurants.find((restaurant) => matchesEntityId(restaurant, id)))
        .filter((restaurant): restaurant is Restaurant => Boolean(restaurant))
        .map((restaurant) => ({
          key: `restaurant-${restaurant.id}`,
          href: getListingBlockHref("restaurants", restaurant),
          title: restaurant.name,
          description: restaurant.shortDescription || restaurant.address,
          image: restaurant.image,
          badge: restaurant.priceRange || restaurant.cuisineType || "Restaurant",
        })),
    );
  }

  if (block.type === "activities") {
    return uniqueByKey(
      itemIds
        .map((id) => attractions.find((attraction) => matchesEntityId(attraction, id)))
        .filter((attraction): attraction is Attraction => Boolean(attraction))
        .map((attraction) => ({
          key: `activity-${attraction.id}`,
          href: getListingBlockHref("activities", attraction),
          title: attraction.name,
          description: attraction.summary || attraction.description,
          image: attraction.image,
          badge: attraction.category || attraction.type || "Activity",
        })),
    );
  }

  return [];
}

export function getListingBlockHref(
  type: GuideListingBlockType,
  item: Destination | City | Guide | Restaurant | Attraction | string | GuideListingBlockCustomItem,
) {
  if (type === "destinations" && isDestination(item)) {
    return getCanonicalDestinationPath(item);
  }

  if (type === "cities" && isCity(item)) {
    return `/${item.slug}`;
  }

  if (type === "countries" && typeof item === "string") {
    return countryPath(item);
  }

  if (type === "guides" && isGuide(item)) {
    return getGuideHref(item);
  }

  if (type === "restaurants" && isRestaurant(item)) {
    return `/restaurants/${item.slug}`;
  }

  if (type === "activities" && isAttraction(item)) {
    return `/${item.citySlug}/attractions/${item.slug}`;
  }

  if (type === "custom" && isCustomItem(item)) {
    return item.href;
  }

  return "";
}

function normalizeGuideListingBlock(block: Record<string, unknown>, index: number) {
  const type = normalizeListingBlockType(block.type);
  const title = stringValue(block.title);

  if (!type || !title) {
    return undefined;
  }

  const id = stringValue(block.id) || `listing-block-${index + 1}`;
  const normalizedBlock: GuideListingBlock = {
    id,
    title,
    type,
  };

  if (type === "custom") {
    const customItems = normalizeCustomItems(block.customItems);

    if (customItems.length > 0) {
      normalizedBlock.customItems = customItems;
    }

    return normalizedBlock;
  }

  const itemIds = stringArrayValue(block.itemIds);

  if (itemIds.length > 0) {
    normalizedBlock.itemIds = itemIds;
  }

  return normalizedBlock;
}

function normalizeCustomItems(value: unknown): GuideListingBlockCustomItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      title: stringValue(item.title),
      description: stringValue(item.description) || undefined,
      image: stringValue(item.image) || undefined,
      href: stringValue(item.href),
      badge: stringValue(item.badge) || undefined,
    }))
    .filter((item) => item.title && item.href);
}

function resolveCustomItem(
  item: GuideListingBlockCustomItem,
  blockId: string,
  index: number,
): ResolvedGuideListingBlockItem | undefined {
  if (!item.title || !item.href) {
    return undefined;
  }

  return {
    key: `custom-${blockId}-${index}-${item.href}`,
    href: item.href,
    title: item.title,
    description: item.description,
    image: item.image,
    badge: item.badge || "Link",
  };
}

function normalizeListingBlockType(value: unknown): GuideListingBlockType | undefined {
  const type = stringValue(value) as GuideListingBlockType;
  return guideListingBlockTypes.includes(type) ? type : undefined;
}

function stringArrayValue(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.map((item) => stringValue(item)).filter(Boolean)));
}

function matchesEntityId(item: { id: string; slug?: string; name?: string; title?: string }, id: string) {
  const normalizedId = slugify(id);
  return (
    item.id === id ||
    slugify(item.id) === normalizedId ||
    (item.slug ? slugify(item.slug) === normalizedId : false) ||
    (item.name ? slugify(item.name) === normalizedId : false) ||
    (item.title ? slugify(item.title) === normalizedId : false)
  );
}

function parseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDestination(value: unknown): value is Destination {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && "citySlug" in value;
}

function isCity(value: unknown): value is City {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && "country" in value;
}

function isGuide(value: unknown): value is Guide {
  return isRecord(value) && typeof value.id === "string" && typeof value.title === "string" && "targetType" in value;
}

function isRestaurant(value: unknown): value is Restaurant {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && "cuisineType" in value;
}

function isAttraction(value: unknown): value is Attraction {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && "citySlug" in value && "recommendedTime" in value;
}

function isCustomItem(value: unknown): value is GuideListingBlockCustomItem {
  return isRecord(value) && typeof value.title === "string" && typeof value.href === "string";
}

function uniqueByKey(items: ResolvedGuideListingBlockItem[]) {
  return Array.from(new Map(items.filter((item) => item.href).map((item) => [item.href, item])).values());
}
