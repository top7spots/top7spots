import "server-only";

import type { AdminCollection, Attraction, City, ContentStatus, Destination, Guide } from "@/lib/types";
import { slugify } from "@/lib/format";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase";

type CollectionMap = {
  cities: City;
  destinations: Destination;
  guides: Guide;
  attractions: Attraction;
};

type CityRow = {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  country_code: string | null;
  region: string | null;
  short_description: string | null;
  long_description: string | null;
  hero_image: string | null;
  card_image: string | null;
  featured_image: string | null;
  status: string | null;
  is_featured: boolean | null;
  display_order: number | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | string | null;
  created_at: string | null;
  updated_at: string | null;
};

type DestinationRow = {
  id: string;
  city_id: string | null;
  city_slug: string | null;
  slug: string;
  name: string;
  city: string | null;
  category: string | null;
  location: string | null;
  region: string | null;
  duration: string | null;
  best_season: string | null;
  image: string | null;
  gallery_images: string[] | null;
  summary: string | null;
  description: string | null;
  highlights: string[] | null;
  practical_info: string[] | null;
  how_to_go: string | null;
  travel_tips: string[] | null;
  nearby_attractions: string[] | null;
  status: string | null;
  is_featured: boolean | null;
  display_order: number | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type GuideRow = {
  id: string;
  city_id: string | null;
  city_slug: string | null;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string[] | null;
  cover_image: string | null;
  image: string | null;
  author: string | null;
  read_time: string | null;
  category: string | null;
  status: string | null;
  is_featured: boolean | null;
  display_order: number | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type AttractionRow = {
  id: string;
  city_id: string | null;
  city_slug: string | null;
  name: string;
  slug: string;
  city: string | null;
  image: string | null;
  category: string | null;
  type: string | null;
  description: string | null;
  summary: string | null;
  recommended_time: string | null;
  status: string | null;
  display_order: number | null;
  seo_title: string | null;
  seo_description: string | null;
};

type RowMap = {
  cities: CityRow;
  destinations: DestinationRow;
  guides: GuideRow;
  attractions: AttractionRow;
};

const tableNames: Record<AdminCollection, string> = {
  cities: "cities",
  destinations: "destinations",
  guides: "guides",
  attractions: "attractions",
};

function byDisplayOrder<T extends { displayOrder?: number; name?: string; title?: string }>(a: T, b: T) {
  const orderA = a.displayOrder ?? 999;
  const orderB = b.displayOrder ?? 999;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  return String(a.name ?? a.title ?? "").localeCompare(String(b.name ?? b.title ?? ""));
}

function status(value?: string | null): ContentStatus {
  return value === "draft" ? "draft" : "published";
}

function arrayValue(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) {
    return value;
  }

  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapCity(row: CityRow): City {
  return {
    id: row.id,
    name: row.name,
    slug: slugify(row.slug || row.name),
    country: row.country || "",
    countryCode: row.country_code || "",
    region: row.region || "",
    shortDescription: row.short_description || "",
    longDescription: row.long_description || "",
    heroImage: row.hero_image || "",
    cardImage: row.card_image || "",
    featuredImage: row.featured_image || "",
    status: status(row.status),
    isFeatured: Boolean(row.is_featured),
    displayOrder: row.display_order ?? 0,
    seoTitle: row.seo_title || "",
    seoDescription: row.seo_description || "",
    seoKeywords: arrayValue(row.seo_keywords),
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function mapDestination(row: DestinationRow): Destination {
  return {
    id: row.id,
    cityId: row.city_id || "",
    citySlug: slugify(row.city_slug || ""),
    slug: slugify(row.slug || row.name),
    name: row.name,
    city: row.city || "",
    category: row.category || "",
    location: row.location || "",
    region: row.region || "",
    duration: row.duration || "",
    bestSeason: row.best_season || "",
    image: row.image || "",
    galleryImages: row.gallery_images || [],
    summary: row.summary || "",
    description: row.description || "",
    highlights: row.highlights || [],
    practicalInfo: row.practical_info || [],
    howToGo: row.how_to_go || "",
    travelTips: row.travel_tips || [],
    nearbyAttractions: row.nearby_attractions || [],
    status: status(row.status),
    isFeatured: Boolean(row.is_featured),
    displayOrder: row.display_order ?? 0,
    seoTitle: row.seo_title || "",
    seoDescription: row.seo_description || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function mapGuide(row: GuideRow): Guide {
  const image = row.image || row.cover_image || "";

  return {
    id: row.id,
    cityId: row.city_id || "",
    citySlug: slugify(row.city_slug || ""),
    slug: slugify(row.slug || row.title),
    title: row.title,
    excerpt: row.excerpt || "",
    content: row.content || [],
    coverImage: row.cover_image || image,
    image,
    author: row.author || "",
    readTime: row.read_time || "",
    category: row.category || "",
    status: status(row.status),
    isFeatured: Boolean(row.is_featured),
    displayOrder: row.display_order ?? 0,
    seoTitle: row.seo_title || "",
    seoDescription: row.seo_description || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function mapAttraction(row: AttractionRow): Attraction {
  const category = row.category || row.type || "";

  return {
    id: row.id,
    cityId: row.city_id || "",
    citySlug: slugify(row.city_slug || ""),
    name: row.name,
    slug: slugify(row.slug || row.name),
    city: row.city || "",
    image: row.image || "",
    category,
    type: category,
    description: row.description || "",
    summary: row.summary || row.description || "",
    recommendedTime: row.recommended_time || "",
    status: status(row.status),
    displayOrder: row.display_order ?? 0,
    seoTitle: row.seo_title || "",
    seoDescription: row.seo_description || "",
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
    city_id: item.cityId,
    city_slug: slugify(item.citySlug),
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
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
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

async function readRows<T extends AdminCollection>(collection: T): Promise<RowMap[T][]> {
  if (!hasSupabaseConfig()) {
    return [];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from(tableNames[collection]).select("*");

  if (error) {
    console.error(`Failed to read ${collection} from Supabase:`, error.message);
    return [];
  }

  return (data || []) as RowMap[T][];
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

  return (rows as AttractionRow[]).map(mapAttraction).sort(byDisplayOrder) as CollectionMap[T][];
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

  return toAttractionRow(item as Attraction) as RowMap[T];
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
  return guides.filter((guide) => guide.citySlug === normalizedCitySlug);
}

export async function getGuide(slug: string) {
  const guides = await getGuides();
  return guides.find((guide) => guide.slug === slugify(slug));
}

export async function getGuideByCityAndSlug(citySlug: string, guideSlug: string) {
  const normalizedCitySlug = slugify(citySlug);
  const normalizedGuideSlug = slugify(guideSlug);
  const guides = await getPublishedGuides();
  return guides.find((guide) => guide.citySlug === normalizedCitySlug && guide.slug === normalizedGuideSlug);
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

export async function getAdminData() {
  const [cities, destinations, guides, attractions] = await Promise.all([
    getCities(),
    getDestinations(),
    getGuides(),
    getAttractions(),
  ]);

  return { cities, destinations, guides, attractions };
}

export async function upsertItem<T extends AdminCollection>(
  collection: T,
  item: CollectionMap[T],
) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from(tableNames[collection])
    .upsert(itemToRow(collection, item), { onConflict: "id" });

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
