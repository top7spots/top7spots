import "server-only";

import type {
  AdminCollection,
  Attraction,
  City,
  ContentStatus,
  Destination,
  Guide,
  GuideTargetType,
  HomepageFaq,
  HomepageReview,
  Restaurant,
  SitePage,
} from "@/lib/types";
import { slugify } from "@/lib/format";
import { normalizeGuideContentBlocks } from "@/lib/guide-content-blocks";
import { normalizeGuideListingBlocks } from "@/lib/guide-listing-blocks";
import { getSiteSettings } from "@/lib/site-settings";
import { getSupabaseAdminClient, getSupabaseEnvStatus, hasSupabaseConfig } from "@/lib/supabase";

type CollectionMap = {
  cities: City;
  destinations: Destination;
  guides: Guide;
  attractions: Attraction;
  restaurants: Restaurant;
  homepage_reviews: HomepageReview;
  homepage_faqs: HomepageFaq;
  site_pages: SitePage;
};

type CityRow = Record<string, unknown>;
type DestinationRow = Record<string, unknown>;
type GuideRow = Record<string, unknown>;
type AttractionRow = Record<string, unknown>;
type RestaurantRow = Record<string, unknown>;
type HomepageReviewRow = Record<string, unknown>;
type HomepageFaqRow = Record<string, unknown>;
type SitePageRow = Record<string, unknown>;

type RowMap = {
  cities: CityRow;
  destinations: DestinationRow;
  guides: GuideRow;
  attractions: AttractionRow;
  restaurants: RestaurantRow;
  homepage_reviews: HomepageReviewRow;
  homepage_faqs: HomepageFaqRow;
  site_pages: SitePageRow;
};

const tableNames: Record<AdminCollection, string> = {
  cities: "cities",
  destinations: "destinations",
  guides: "guides",
  attractions: "attractions",
  restaurants: "restaurants",
  homepage_reviews: "homepage_reviews",
  homepage_faqs: "homepage_faqs",
  site_pages: "site_pages",
};

const structuredGuideRowKeys = [
  "target_type",
  "country_id",
  "destination_id",
  "seo_keywords",
  "cover_image_alt",
  "faqs",
  "related_guide_slugs",
  "related_place_slugs",
  "table_of_contents",
  "listing_blocks",
  "content_blocks",
] as const;

const guideOwnershipRowKeys = ["target_type", "country_id", "destination_id"] as const;

function byDisplayOrder<T extends { displayOrder?: number; name?: string; title?: string }>(a: T, b: T) {
  const orderA = a.displayOrder ?? 999;
  const orderB = b.displayOrder ?? 999;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  return String(a.name ?? a.title ?? "").localeCompare(String(b.name ?? b.title ?? ""));
}

function sortGuidesNewestFirst(guides: Guide[]) {
  return [...guides].sort((a, b) => {
    const dateA = Date.parse(a.updatedAt || a.createdAt || "");
    const dateB = Date.parse(b.updatedAt || b.createdAt || "");
    const safeDateA = Number.isFinite(dateA) ? dateA : 0;
    const safeDateB = Number.isFinite(dateB) ? dateB : 0;

    if (safeDateA !== safeDateB) {
      return safeDateB - safeDateA;
    }

    return a.title.localeCompare(b.title);
  });
}

function nullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function bySortOrder<T extends { sortOrder?: number; name?: string; question?: string }>(a: T, b: T) {
  const orderA = a.sortOrder ?? 999;
  const orderB = b.sortOrder ?? 999;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  return String(a.name ?? a.question ?? "").localeCompare(String(b.name ?? b.question ?? ""));
}

function getField(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

function stringField(row: Record<string, unknown>, ...keys: string[]) {
  const value = getField(row, ...keys);
  return value === undefined ? "" : String(value);
}

function numberField(row: Record<string, unknown>, ...keys: string[]) {
  const value = getField(row, ...keys);
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function booleanField(row: Record<string, unknown>, ...keys: string[]) {
  const value = getField(row, ...keys);

  if (typeof value === "boolean") {
    return value;
  }

  return String(value ?? "").toLowerCase() === "true";
}

function status(value?: string | null): ContentStatus {
  return value?.toLowerCase() === "draft" ? "draft" : "published";
}

function guideTargetType(row: GuideRow): GuideTargetType {
  const value = stringField(row, "target_type", "targetType").toLowerCase();

  if (value === "country" || value === "destination") {
    return value;
  }

  if (stringField(row, "destination_id", "destinationId")) {
    return "destination";
  }

  if (stringField(row, "country_id", "countryId")) {
    return "country";
  }

  return "city";
}

function arrayValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringListValue(value: unknown, { splitString = false } = {}) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
      .filter(Boolean);
  }

  if (splitString && typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function faqValue(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      question: stringField(item, "question"),
      answer: stringField(item, "answer"),
    }))
    .filter((item) => item.question && item.answer);
}

function tableOfContentsValue(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      label: stringField(item, "label"),
      anchor: stringField(item, "anchor"),
    }))
    .filter((item) => item.label && item.anchor);
}

function mapCity(row: CityRow): City {
  const name = stringField(row, "name");

  return {
    id: stringField(row, "id") || slugify(name),
    name,
    slug: slugify(stringField(row, "slug") || name),
    country: stringField(row, "country"),
    countryCode: stringField(row, "country_code", "countryCode"),
    region: stringField(row, "region"),
    shortDescription: stringField(row, "short_description", "shortDescription"),
    longDescription: stringField(row, "long_description", "longDescription"),
    heroImage: stringField(row, "hero_image", "heroImage"),
    cardImage: stringField(row, "card_image", "cardImage"),
    featuredImage: stringField(row, "featured_image", "featuredImage"),
    status: status(stringField(row, "status")),
    isFeatured: booleanField(row, "is_featured", "isFeatured"),
    displayOrder: numberField(row, "display_order", "displayOrder"),
    seoTitle: stringField(row, "seo_title", "seoTitle"),
    seoDescription: stringField(row, "seo_description", "seoDescription"),
    seoKeywords: arrayValue(getField(row, "seo_keywords", "seoKeywords")),
    createdAt: stringField(row, "created_at", "createdAt"),
    updatedAt: stringField(row, "updated_at", "updatedAt"),
  };
}

function mapDestination(row: DestinationRow): Destination {
  const name = stringField(row, "name");

  return {
    id: stringField(row, "id"),
    cityId: stringField(row, "city_id", "cityId"),
    citySlug: slugify(stringField(row, "city_slug", "citySlug")),
    slug: slugify(stringField(row, "slug") || name),
    name,
    city: stringField(row, "city"),
    category: stringField(row, "category"),
    location: stringField(row, "location"),
    region: stringField(row, "region"),
    duration: stringField(row, "duration"),
    bestSeason: stringField(row, "best_season", "bestSeason"),
    image: stringField(row, "image"),
    galleryImages: arrayValue(getField(row, "gallery_images", "galleryImages")),
    summary: stringField(row, "summary"),
    description: stringField(row, "description"),
    highlights: arrayValue(getField(row, "highlights")),
    practicalInfo: arrayValue(getField(row, "practical_info", "practicalInfo")),
    howToGo: stringField(row, "how_to_go", "howToGo"),
    travelTips: arrayValue(getField(row, "travel_tips", "travelTips")),
    nearbyAttractions: arrayValue(getField(row, "nearby_attractions", "nearbyAttractions")),
    faqs: faqValue(getField(row, "faqs")),
    status: status(stringField(row, "status")),
    isFeatured: booleanField(row, "is_featured", "isFeatured"),
    displayOrder: numberField(row, "display_order", "displayOrder"),
    seoTitle: stringField(row, "seo_title", "seoTitle"),
    seoDescription: stringField(row, "seo_description", "seoDescription"),
    createdAt: stringField(row, "created_at", "createdAt"),
    updatedAt: stringField(row, "updated_at", "updatedAt"),
  };
}

function mapGuide(row: GuideRow): Guide {
  const title = stringField(row, "title");
  const image = stringField(row, "image") || stringField(row, "cover_image", "coverImage");
  const targetType = guideTargetType(row);

  return {
    id: stringField(row, "id"),
    targetType,
    countryId: slugify(stringField(row, "country_id", "countryId")),
    cityId: stringField(row, "city_id", "cityId"),
    citySlug: slugify(stringField(row, "city_slug", "citySlug")),
    destinationId: stringField(row, "destination_id", "destinationId"),
    slug: slugify(stringField(row, "slug") || title),
    title,
    excerpt: stringField(row, "excerpt"),
    content: arrayValue(getField(row, "content")),
    coverImage: stringField(row, "cover_image", "coverImage") || image,
    image,
    author: stringField(row, "author"),
    readTime: stringField(row, "read_time", "readTime"),
    category: stringField(row, "category"),
    status: status(stringField(row, "status")),
    isFeatured: booleanField(row, "is_featured", "isFeatured"),
    displayOrder: numberField(row, "display_order", "displayOrder"),
    seoTitle: stringField(row, "seo_title", "seoTitle"),
    seoDescription: stringField(row, "seo_description", "seoDescription"),
    seoKeywords: stringListValue(getField(row, "seo_keywords", "seoKeywords"), { splitString: true }),
    coverImageAlt: stringField(row, "cover_image_alt", "coverImageAlt"),
    faqs: faqValue(getField(row, "faqs")),
    relatedGuideSlugs: stringListValue(getField(row, "related_guide_slugs", "relatedGuideSlugs")),
    relatedPlaceSlugs: stringListValue(getField(row, "related_place_slugs", "relatedPlaceSlugs")),
    tableOfContents: tableOfContentsValue(getField(row, "table_of_contents", "tableOfContents")),
    listingBlocks: normalizeGuideListingBlocks(getField(row, "listing_blocks", "listingBlocks")),
    contentBlocks: normalizeGuideContentBlocks(getField(row, "content_blocks", "contentBlocks")),
    createdAt: stringField(row, "created_at", "createdAt"),
    updatedAt: stringField(row, "updated_at", "updatedAt"),
  };
}

function mapAttraction(row: AttractionRow): Attraction {
  const name = stringField(row, "name");
  const category = stringField(row, "category") || stringField(row, "type");

  return {
    id: stringField(row, "id"),
    cityId: stringField(row, "city_id", "cityId"),
    citySlug: slugify(stringField(row, "city_slug", "citySlug")),
    name,
    slug: slugify(stringField(row, "slug") || name),
    city: stringField(row, "city"),
    image: stringField(row, "image"),
    category,
    type: category,
    description: stringField(row, "description"),
    summary: stringField(row, "summary") || stringField(row, "description"),
    recommendedTime: stringField(row, "recommended_time", "recommendedTime"),
    status: status(stringField(row, "status")),
    displayOrder: numberField(row, "display_order", "displayOrder"),
    seoTitle: stringField(row, "seo_title", "seoTitle"),
    seoDescription: stringField(row, "seo_description", "seoDescription"),
  };
}

function mapRestaurant(row: RestaurantRow): Restaurant {
  const name = stringField(row, "name");

  return {
    id: stringField(row, "id"),
    slug: slugify(stringField(row, "slug") || name),
    name,
    shortDescription: stringField(row, "short_description", "shortDescription"),
    longDescription: stringField(row, "long_description", "longDescription"),
    image: stringField(row, "image"),
    cityId: stringField(row, "city_id", "cityId"),
    destinationId: stringField(row, "destination_id", "destinationId"),
    countrySlug: slugify(stringField(row, "country_slug", "countrySlug")),
    cuisineType: stringField(row, "cuisine_type", "cuisineType"),
    priceRange: stringField(row, "price_range", "priceRange"),
    address: stringField(row, "address"),
    googleMapsUrl: stringField(row, "google_maps_url", "googleMapsUrl"),
    tags: arrayValue(getField(row, "tags")),
    featured: booleanField(row, "featured"),
    published: booleanField(row, "published"),
    createdAt: stringField(row, "created_at", "createdAt"),
    updatedAt: stringField(row, "updated_at", "updatedAt"),
  };
}

function mapHomepageReview(row: HomepageReviewRow): HomepageReview {
  const name = stringField(row, "name");

  return {
    id: stringField(row, "id"),
    name,
    reviewText: stringField(row, "review_text", "reviewText"),
    isPublished: booleanField(row, "is_published", "isPublished"),
    sortOrder: numberField(row, "sort_order", "sortOrder"),
    createdAt: stringField(row, "created_at", "createdAt"),
    updatedAt: stringField(row, "updated_at", "updatedAt"),
  };
}

function mapHomepageFaq(row: HomepageFaqRow): HomepageFaq {
  return {
    id: stringField(row, "id"),
    question: stringField(row, "question"),
    answer: stringField(row, "answer"),
    isPublished: booleanField(row, "is_published", "isPublished"),
    sortOrder: numberField(row, "sort_order", "sortOrder"),
    createdAt: stringField(row, "created_at", "createdAt"),
    updatedAt: stringField(row, "updated_at", "updatedAt"),
  };
}

function mapSitePage(row: SitePageRow): SitePage {
  const title = stringField(row, "title");

  return {
    id: stringField(row, "id"),
    title,
    slug: slugify(stringField(row, "slug") || title),
    content: stringField(row, "content"),
    metaTitle: stringField(row, "meta_title", "metaTitle"),
    metaDescription: stringField(row, "meta_description", "metaDescription"),
    status: status(stringField(row, "status")),
    createdAt: stringField(row, "created_at", "createdAt"),
    updatedAt: stringField(row, "updated_at", "updatedAt"),
  };
}

function toCityRow(item: City): CityRow {
  return {
    id: item.id,
    name: item.name,
    slug: slugify(item.slug || item.name),
    country: item.country,
    country_code: item.countryCode,
    region: item.region,
    short_description: item.shortDescription,
    long_description: item.longDescription,
    hero_image: item.heroImage,
    card_image: item.cardImage,
    featured_image: item.featuredImage,
    status: item.status,
    is_featured: item.isFeatured,
    display_order: item.displayOrder,
    seo_title: item.seoTitle,
    seo_description: item.seoDescription,
    seo_keywords: item.seoKeywords,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function toDestinationRow(item: Destination): DestinationRow {
  return {
    id: item.id,
    city_id: item.cityId,
    city_slug: slugify(item.citySlug),
    slug: slugify(item.slug || item.name),
    name: item.name,
    city: item.city,
    category: item.category,
    location: item.location,
    region: item.region,
    duration: item.duration,
    best_season: item.bestSeason,
    image: item.image,
    gallery_images: item.galleryImages,
    summary: item.summary,
    description: item.description,
    highlights: item.highlights,
    practical_info: item.practicalInfo,
    how_to_go: item.howToGo,
    travel_tips: item.travelTips,
    nearby_attractions: item.nearbyAttractions,
    faqs: item.faqs || [],
    status: item.status,
    is_featured: item.isFeatured,
    display_order: item.displayOrder,
    seo_title: item.seoTitle,
    seo_description: item.seoDescription,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function toGuideRow(item: Guide): GuideRow {
  return {
    id: item.id,
    target_type: item.targetType,
    country_id: item.countryId || "",
    city_id: nullableString(item.cityId),
    city_slug: slugify(item.citySlug),
    destination_id: nullableString(item.destinationId),
    slug: slugify(item.slug || item.title),
    title: item.title,
    excerpt: item.excerpt,
    content: item.content,
    cover_image: item.coverImage || item.image,
    image: item.image || item.coverImage,
    author: item.author,
    read_time: item.readTime,
    category: item.category,
    status: item.status,
    is_featured: item.isFeatured,
    display_order: item.displayOrder,
    seo_title: item.seoTitle,
    seo_description: item.seoDescription,
    seo_keywords: item.seoKeywords || [],
    cover_image_alt: item.coverImageAlt || "",
    faqs: item.faqs || [],
    related_guide_slugs: item.relatedGuideSlugs || [],
    related_place_slugs: item.relatedPlaceSlugs || [],
    table_of_contents: item.tableOfContents || [],
    listing_blocks: item.listingBlocks || [],
    content_blocks: item.contentBlocks || [],
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function isMissingStructuredGuideColumn(error: { message?: string }) {
  return Boolean(missingStructuredGuideColumn(error));
}

function missingStructuredGuideColumn(error: { message?: string }) {
  const message = String(error.message || "").toLowerCase();
  return structuredGuideRowKeys.find((key) => message.includes(key));
}

function isMissingGuideOwnershipColumn(error: { message?: string }) {
  const message = String(error.message || "").toLowerCase();
  return guideOwnershipRowKeys.some((key) => message.includes(key));
}

function toAttractionRow(item: Attraction): AttractionRow {
  return {
    id: item.id,
    city_id: item.cityId,
    city_slug: slugify(item.citySlug),
    name: item.name,
    slug: slugify(item.slug || item.name),
    city: item.city,
    image: item.image,
    category: item.category,
    type: item.type || item.category,
    description: item.description,
    summary: item.summary,
    recommended_time: item.recommendedTime,
    status: item.status,
    display_order: item.displayOrder,
    seo_title: item.seoTitle,
    seo_description: item.seoDescription,
  };
}

function toRestaurantRow(item: Restaurant): RestaurantRow {
  return {
    id: item.id,
    slug: slugify(item.slug || item.name),
    name: item.name,
    short_description: item.shortDescription,
    long_description: item.longDescription,
    image: item.image,
    city_id: item.cityId,
    destination_id: item.destinationId || null,
    country_slug: slugify(item.countrySlug),
    cuisine_type: item.cuisineType,
    price_range: item.priceRange,
    address: item.address,
    google_maps_url: item.googleMapsUrl,
    tags: item.tags || [],
    featured: item.featured,
    published: item.published,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function toHomepageReviewRow(item: HomepageReview): HomepageReviewRow {
  return {
    id: item.id,
    name: item.name,
    review_text: item.reviewText,
    is_published: item.isPublished,
    sort_order: item.sortOrder,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function toHomepageFaqRow(item: HomepageFaq): HomepageFaqRow {
  return {
    id: item.id,
    question: item.question,
    answer: item.answer,
    is_published: item.isPublished,
    sort_order: item.sortOrder,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function toSitePageRow(item: SitePage): SitePageRow {
  return {
    id: item.id,
    title: item.title,
    slug: slugify(item.slug || item.title),
    content: item.content,
    meta_title: item.metaTitle,
    meta_description: item.metaDescription,
    status: item.status,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

async function readRows<T extends AdminCollection>(collection: T): Promise<RowMap[T][]> {
  if (!hasSupabaseConfig()) {
    console.error(
      `[Top7Spots Supabase] Missing Supabase env while reading "${collection}". Expected NEXT_PUBLIC_SUPABASE_URL plus SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.`,
    );
    return [];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from(tableNames[collection]).select("*");

  if (error) {
    if (isOptionalHomepageCollection(collection) && isMissingTableError(error)) {
      return [];
    }

    console.error(`[Top7Spots Supabase] Failed to read "${collection}".`, {
      table: tableNames[collection],
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      supabase: getSupabaseEnvStatus(),
    });
    return [];
  }

  if (process.env.NODE_ENV === "production" && (!data || data.length === 0)) {
    console.error(`[Top7Spots Supabase] Read "${collection}" returned 0 rows.`, {
      table: tableNames[collection],
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    });
  }

  return (data || []) as RowMap[T][];
}

function isOptionalHomepageCollection(collection: AdminCollection) {
  return (
    collection === "homepage_reviews" ||
    collection === "homepage_faqs" ||
    collection === "restaurants" ||
    collection === "site_pages"
  );
}

function isMissingTableError(error: { code?: string; message?: string }) {
  const message = String(error.message || "").toLowerCase();
  return error.code === "PGRST205" || message.includes("could not find the table");
}

async function readCollection<T extends AdminCollection>(
  collection: T,
): Promise<CollectionMap[T][]> {
  const rows = await readRows(collection);

  if (collection === "cities") {
    return (rows as CityRow[]).map(mapCity).sort(byDisplayOrder) as CollectionMap[T][];
  }

  if (collection === "destinations") {
    return (rows as DestinationRow[]).map(mapDestination).sort(byDisplayOrder) as CollectionMap[T][];
  }

  if (collection === "guides") {
    return (rows as GuideRow[]).map(mapGuide).sort(byDisplayOrder) as CollectionMap[T][];
  }

  if (collection === "attractions") {
    return (rows as AttractionRow[]).map(mapAttraction).sort(byDisplayOrder) as CollectionMap[T][];
  }

  if (collection === "restaurants") {
    return (rows as RestaurantRow[]).map(mapRestaurant).sort(byDisplayOrder) as CollectionMap[T][];
  }

  if (collection === "homepage_reviews") {
    return (rows as HomepageReviewRow[]).map(mapHomepageReview).sort(bySortOrder) as CollectionMap[T][];
  }

  if (collection === "homepage_faqs") {
    return (rows as HomepageFaqRow[]).map(mapHomepageFaq).sort(bySortOrder) as CollectionMap[T][];
  }

  return (rows as SitePageRow[]).map(mapSitePage).sort(byDisplayOrder) as CollectionMap[T][];
}

function itemToRow<T extends AdminCollection>(collection: T, item: CollectionMap[T]): RowMap[T] {
  if (collection === "cities") {
    return toCityRow(item as City) as RowMap[T];
  }

  if (collection === "destinations") {
    return toDestinationRow(item as Destination) as RowMap[T];
  }

  if (collection === "guides") {
    return toGuideRow(item as Guide) as RowMap[T];
  }

  if (collection === "attractions") {
    return toAttractionRow(item as Attraction) as RowMap[T];
  }

  if (collection === "restaurants") {
    return toRestaurantRow(item as Restaurant) as RowMap[T];
  }

  if (collection === "homepage_reviews") {
    return toHomepageReviewRow(item as HomepageReview) as RowMap[T];
  }

  if (collection === "homepage_faqs") {
    return toHomepageFaqRow(item as HomepageFaq) as RowMap[T];
  }

  return toSitePageRow(item as SitePage) as RowMap[T];
}

export async function getCities() {
  return readCollection("cities");
}

export async function getPublishedCities() {
  const cities = await getCities();
  return cities.filter((city) => city.status === "published");
}

export async function getFeaturedCities() {
  const cities = await getPublishedCities();
  return cities.filter((city) => city.isFeatured);
}

export async function getCityBySlug(slug: string) {
  const normalizedSlug = slugify(slug);
  const cities = await getCities();
  return cities.find((city) => city.slug === normalizedSlug);
}

export async function getDestinations() {
  return readCollection("destinations");
}

export async function getPublishedDestinations() {
  const destinations = await getDestinations();
  return destinations.filter((destination) => destination.status === "published");
}

export async function getDestinationsByCity(citySlug: string) {
  const normalizedCitySlug = slugify(citySlug);
  const destinations = await getPublishedDestinations();
  return destinations.filter((destination) => destination.citySlug === normalizedCitySlug);
}

export async function getDestination(slug: string) {
  const destinations = await getDestinations();
  return destinations.find((destination) => destination.slug === slugify(slug));
}

export async function getDestinationByCityAndSlug(citySlug: string, destinationSlug: string) {
  const normalizedCitySlug = slugify(citySlug);
  const normalizedDestinationSlug = slugify(destinationSlug);
  const destinations = await getPublishedDestinations();
  return destinations.find(
    (destination) =>
      destination.citySlug === normalizedCitySlug && destination.slug === normalizedDestinationSlug,
  );
}

export async function getGuides() {
  return readCollection("guides");
}

export async function getPublishedGuides() {
  const guides = await getGuides();
  return guides.filter((guide) => guide.status === "published");
}

export async function getGuidesByCity(citySlug: string) {
  const normalizedCitySlug = slugify(citySlug);
  const guides = await getPublishedGuides();
  return guides.filter((guide) => guide.targetType === "city" && guide.citySlug === normalizedCitySlug);
}

export async function getGuidesForCountry(countrySlug: string) {
  const normalizedCountryId = slugify(countrySlug);
  const guides = await getPublishedGuides();
  return sortGuidesNewestFirst(
    guides.filter((guide) => guide.targetType === "country" && guide.countryId === normalizedCountryId),
  );
}

export async function getGuidesForCity(citySlug: string) {
  const normalizedCitySlug = slugify(citySlug);
  const guides = await getPublishedGuides();
  return sortGuidesNewestFirst(
    guides.filter((guide) => guide.targetType === "city" && guide.citySlug === normalizedCitySlug),
  );
}

export async function getGuidesForDestination(destinationSlug: string) {
  const normalizedDestinationSlug = slugify(destinationSlug);
  const [guides, destinations] = await Promise.all([getPublishedGuides(), getPublishedDestinations()]);
  const destination = destinations.find((item) => item.slug === normalizedDestinationSlug);

  if (!destination) {
    return [];
  }

  return sortGuidesNewestFirst(
    guides.filter(
      (guide) =>
        guide.targetType === "destination" &&
        (guide.destinationId === destination.id ||
          guide.destinationId === destination.slug ||
          slugify(guide.destinationId) === normalizedDestinationSlug),
    ),
  );
}

export async function getGuide(slug: string) {
  const guides = await getGuides();
  return guides.find((guide) => guide.slug === slugify(slug));
}

export async function getGuideByCityAndSlug(citySlug: string, guideSlug: string) {
  const normalizedCitySlug = slugify(citySlug);
  const normalizedGuideSlug = slugify(guideSlug);
  const guides = await getPublishedGuides();
  return guides.find(
    (guide) =>
      guide.targetType === "city" &&
      guide.citySlug === normalizedCitySlug &&
      guide.slug === normalizedGuideSlug,
  );
}

export async function getAttractions() {
  return readCollection("attractions");
}

export async function getPublishedAttractions() {
  const attractions = await getAttractions();
  return attractions.filter((attraction) => attraction.status === "published");
}

export async function getAttractionsByCity(citySlug: string) {
  const normalizedCitySlug = slugify(citySlug);
  const attractions = await getPublishedAttractions();
  return attractions.filter((attraction) => attraction.citySlug === normalizedCitySlug);
}

export async function getAttractionByCityAndSlug(citySlug: string, attractionSlug: string) {
  const normalizedCitySlug = slugify(citySlug);
  const normalizedAttractionSlug = slugify(attractionSlug);
  const attractions = await getPublishedAttractions();
  return attractions.find(
    (attraction) =>
      attraction.citySlug === normalizedCitySlug && attraction.slug === normalizedAttractionSlug,
  );
}

export async function getRestaurants() {
  return readCollection("restaurants");
}

export async function getPublishedRestaurants() {
  const restaurants = await getRestaurants();
  return restaurants.filter((restaurant) => restaurant.published);
}

export async function getRestaurantsByCityId(cityId: string) {
  const restaurants = await getPublishedRestaurants();
  return restaurants.filter((restaurant) => restaurant.cityId === cityId);
}

export async function getRestaurantsByDestinationId(destinationId: string) {
  const restaurants = await getPublishedRestaurants();
  return restaurants.filter((restaurant) => restaurant.destinationId === destinationId);
}

export async function getRestaurant(slug: string) {
  const restaurants = await getRestaurants();
  return restaurants.find((restaurant) => restaurant.slug === slugify(slug));
}

export async function getPublishedRestaurant(slug: string) {
  const restaurant = await getRestaurant(slug);
  return restaurant?.published ? restaurant : undefined;
}

export async function getHomepageReviews() {
  return readCollection("homepage_reviews");
}

export async function getPublishedHomepageReviews() {
  const reviews = await getHomepageReviews();
  return reviews.filter((review) => review.isPublished);
}

export async function getHomepageFaqs() {
  return readCollection("homepage_faqs");
}

export async function getPublishedHomepageFaqs() {
  const faqs = await getHomepageFaqs();
  return faqs.filter((faq) => faq.isPublished);
}

export async function getSitePages() {
  return readCollection("site_pages");
}

export async function getPublishedSitePages() {
  const pages = await getSitePages();
  return pages.filter((page) => page.status === "published");
}

export async function getSitePageBySlug(slug: string) {
  const normalizedSlug = slugify(slug);
  const pages = await getSitePages();
  return pages.find((page) => page.slug === normalizedSlug);
}

export async function getPublishedSitePageBySlug(slug: string) {
  const page = await getSitePageBySlug(slug);
  return page?.status === "published" ? page : undefined;
}

export async function getAdminData() {
  const [
    cities,
    destinations,
    guides,
    attractions,
    restaurants,
    restaurantTableMissing,
    homepageReviews,
    homepageFaqs,
    sitePages,
    siteSettings,
  ] = await Promise.all([
    getCities(),
    getDestinations(),
    getGuides(),
    getAttractions(),
    getRestaurants(),
    isRestaurantTableMissing(),
    getHomepageReviews(),
    getHomepageFaqs(),
    getSitePages(),
    getSiteSettings(),
  ]);

  return {
    cities,
    destinations,
    guides,
    attractions,
    restaurants,
    restaurantTableMissing,
    homepageReviews,
    homepageFaqs,
    sitePages,
    siteSettings,
  };
}

async function isRestaurantTableMissing() {
  if (!hasSupabaseConfig()) {
    return false;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("restaurants").select("id").limit(1);
  return Boolean(error && isMissingTableError(error));
}

export async function upsertItem<T extends AdminCollection>(
  collection: T,
  item: CollectionMap[T],
) {
  const supabase = getSupabaseAdminClient();
  const row = itemToRow(collection, item);
  let { error } = await supabase.from(tableNames[collection]).upsert(row, { onConflict: "id" });

  if (
    error &&
    collection === "guides" &&
    isMissingGuideOwnershipColumn(error) &&
    (row as GuideRow).target_type !== "city"
  ) {
    throw new Error(
      "Failed to save guides: apply the Phase 2 guide ownership schema migration before saving country or destination guides.",
    );
  }

  if (error && collection === "guides" && isMissingStructuredGuideColumn(error)) {
    const guideRow = row as GuideRow;
    const fallbackRow = { ...guideRow };
    const hasListingBlocks =
      Array.isArray(guideRow.listing_blocks) && guideRow.listing_blocks.length > 0;
    const hasContentBlocks =
      Array.isArray(guideRow.content_blocks) && guideRow.content_blocks.length > 0;

    for (let attempt = 0; error && attempt < structuredGuideRowKeys.length; attempt += 1) {
      const missingColumn = missingStructuredGuideColumn(error);

      if (!missingColumn) {
        break;
      }

      if (missingColumn === "listing_blocks" && hasListingBlocks) {
        throw new Error(
          "Failed to save guides: apply the Phase 6C listing_blocks schema migration before saving guide listing blocks.",
        );
      }

      if (missingColumn === "content_blocks" && hasContentBlocks) {
        throw new Error(
          "Failed to save guides: apply the guide content_blocks schema migration before saving block-based guide pages.",
        );
      }

      delete fallbackRow[missingColumn];
      const result = await supabase
        .from(tableNames[collection])
        .upsert(fallbackRow, { onConflict: "id" });
      error = result.error;

      if (
        error &&
        isMissingGuideOwnershipColumn(error) &&
        fallbackRow.target_type !== "city"
      ) {
        throw new Error(
          "Failed to save guides: apply the Phase 2 guide ownership schema migration before saving country or destination guides.",
        );
      }
    }

    if (!error) {
      return;
    }
  }

  if (error) {
    throw new Error(`Failed to save ${collection}: ${error.message}`);
  }
}

export async function updateCityReferences(previousSlug: string, city: Pick<City, "id" | "name" | "slug">) {
  const normalizedPreviousSlug = slugify(previousSlug);

  if (!normalizedPreviousSlug || normalizedPreviousSlug === city.slug) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const updates = [
    supabase
      .from("destinations")
      .update({ city_id: city.id, city_slug: city.slug, city: city.name })
      .eq("city_slug", normalizedPreviousSlug),
    supabase
      .from("guides")
      .update({ city_id: city.id, city_slug: city.slug })
      .eq("city_slug", normalizedPreviousSlug),
    supabase
      .from("attractions")
      .update({ city_id: city.id, city_slug: city.slug, city: city.name })
      .eq("city_slug", normalizedPreviousSlug),
  ];

  const results = await Promise.all(updates);
  const error = results.find((result) => result.error)?.error;

  if (error) {
    throw new Error(`Failed to update city references: ${error.message}`);
  }
}

export async function deleteItem(collection: AdminCollection, id: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from(tableNames[collection]).delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete ${collection}: ${error.message}`);
  }
}
