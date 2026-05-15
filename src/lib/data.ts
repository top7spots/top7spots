import "server-only";

import { promises as fs } from "fs";
import path from "path";
import type { AdminCollection, Attraction, City, Destination, Guide } from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "src", "data");

type CollectionMap = {
  cities: City;
  destinations: Destination;
  guides: Guide;
  attractions: Attraction;
};

const files: Record<AdminCollection, string> = {
  cities: "cities.json",
  destinations: "destinations.json",
  guides: "guides.json",
  attractions: "attractions.json",
};

function byDisplayOrder<T extends { displayOrder?: number; name?: string; title?: string }>(a: T, b: T) {
  const orderA = a.displayOrder ?? 999;
  const orderB = b.displayOrder ?? 999;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  return String(a.name ?? a.title ?? "").localeCompare(String(b.name ?? b.title ?? ""));
}

async function readCollection<T extends AdminCollection>(
  collection: T,
): Promise<CollectionMap[T][]> {
  const filePath = path.join(dataDirectory, files[collection]);
  const raw = await fs.readFile(filePath, "utf8");
  const items = JSON.parse(raw) as CollectionMap[T][];

  if (collection === "cities") {
    return (items as City[]).map((city) => ({
      ...city,
      seoKeywords: Array.isArray(city.seoKeywords)
        ? city.seoKeywords
        : String(city.seoKeywords || "")
            .split(",")
            .map((keyword) => keyword.trim())
            .filter(Boolean),
    })) as CollectionMap[T][];
  }

  return items;
}

async function writeCollection<T extends AdminCollection>(
  collection: T,
  items: CollectionMap[T][],
) {
  const filePath = path.join(dataDirectory, files[collection]);
  await fs.writeFile(filePath, `${JSON.stringify(items, null, 2)}\n`, "utf8");
}

export async function getCities() {
  const cities = await readCollection("cities");
  return cities.sort(byDisplayOrder);
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
  const cities = await getCities();
  return cities.find((city) => city.slug === slug);
}

export async function getDestinations() {
  const destinations = await readCollection("destinations");
  return destinations.sort(byDisplayOrder);
}

export async function getPublishedDestinations() {
  const destinations = await getDestinations();
  return destinations.filter((destination) => destination.status === "published");
}

export async function getDestinationsByCity(citySlug: string) {
  const destinations = await getPublishedDestinations();
  return destinations.filter((destination) => destination.citySlug === citySlug);
}

export async function getDestination(slug: string) {
  const destinations = await getDestinations();
  return destinations.find((destination) => destination.slug === slug);
}

export async function getDestinationByCityAndSlug(citySlug: string, destinationSlug: string) {
  const destinations = await getPublishedDestinations();
  return destinations.find(
    (destination) => destination.citySlug === citySlug && destination.slug === destinationSlug,
  );
}

export async function getGuides() {
  const guides = await readCollection("guides");
  return guides.sort(byDisplayOrder);
}

export async function getPublishedGuides() {
  const guides = await getGuides();
  return guides.filter((guide) => guide.status === "published");
}

export async function getGuidesByCity(citySlug: string) {
  const guides = await getPublishedGuides();
  return guides.filter((guide) => guide.citySlug === citySlug);
}

export async function getGuide(slug: string) {
  const guides = await getGuides();
  return guides.find((guide) => guide.slug === slug);
}

export async function getGuideByCityAndSlug(citySlug: string, guideSlug: string) {
  const guides = await getPublishedGuides();
  return guides.find((guide) => guide.citySlug === citySlug && guide.slug === guideSlug);
}

export async function getAttractions() {
  const attractions = await readCollection("attractions");
  return attractions.sort(byDisplayOrder);
}

export async function getPublishedAttractions() {
  const attractions = await getAttractions();
  return attractions.filter((attraction) => attraction.status === "published");
}

export async function getAttractionsByCity(citySlug: string) {
  const attractions = await getPublishedAttractions();
  return attractions.filter((attraction) => attraction.citySlug === citySlug);
}

export async function getAttractionByCityAndSlug(citySlug: string, attractionSlug: string) {
  const attractions = await getPublishedAttractions();
  return attractions.find(
    (attraction) => attraction.citySlug === citySlug && attraction.slug === attractionSlug,
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
  const items = await readCollection(collection);
  const existingIndex = items.findIndex((entry) => entry.id === item.id);

  if (existingIndex >= 0) {
    items[existingIndex] = item;
  } else {
    items.push(item);
  }

  await writeCollection(collection, items);
}

export async function deleteItem(collection: AdminCollection, id: string) {
  const items = await readCollection(collection);
  await writeCollection(
    collection,
    items.filter((item) => item.id !== id),
  );
}
