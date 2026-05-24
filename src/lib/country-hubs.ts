import { slugify } from "@/lib/format";
import type { Attraction, City, Destination, Guide } from "@/lib/types";

export type CountryHub = {
  name: string;
  slug: string;
  code: string;
  cities: City[];
  destinations: Destination[];
  guides: Guide[];
  attractions: Attraction[];
  image?: string;
  updatedAt?: string;
};

type CountryHubInput = {
  cities: City[];
  destinations: Destination[];
  guides: Guide[];
  attractions: Attraction[];
};

export function countryPath(countrySlug: string) {
  return `/countries/${slugify(countrySlug)}`;
}

export function buildCountryHubs({
  cities,
  destinations,
  guides,
  attractions,
}: CountryHubInput): CountryHub[] {
  const cityBySlug = new Map(cities.map((city) => [city.slug, city]));
  const destinationById = new Map(destinations.map((destination) => [destination.id, destination]));
  const destinationBySlug = new Map(destinations.map((destination) => [destination.slug, destination]));
  const hubs = new Map<string, CountryHub>();

  for (const city of cities) {
    if (!city.country) {
      continue;
    }

    const slug = slugify(city.country);
    const existing = hubs.get(slug);
    const hub =
      existing ||
      ({
        name: city.country,
        slug,
        code: city.countryCode,
        cities: [],
        destinations: [],
        guides: [],
        attractions: [],
        image: city.heroImage || city.featuredImage || city.cardImage || undefined,
        updatedAt: city.updatedAt || city.createdAt || undefined,
      } satisfies CountryHub);

    hub.cities.push(city);
    hub.code ||= city.countryCode;
    hub.image ||= city.heroImage || city.featuredImage || city.cardImage || undefined;
    hub.updatedAt ||= city.updatedAt || city.createdAt || undefined;
    hubs.set(slug, hub);
  }

  for (const destination of destinations) {
    const city = cityBySlug.get(destination.citySlug);
    const hub = city ? hubs.get(slugify(city.country)) : undefined;

    if (hub) {
      hub.destinations.push(destination);
      hub.image ||= destination.image || undefined;
      hub.updatedAt ||= destination.updatedAt || destination.createdAt || undefined;
    }
  }

  for (const guide of guides) {
    const destination =
      guide.targetType === "destination"
        ? destinationById.get(guide.destinationId) || destinationBySlug.get(slugify(guide.destinationId))
        : undefined;
    const city =
      guide.targetType === "destination" && destination
        ? cityBySlug.get(destination.citySlug)
        : cityBySlug.get(guide.citySlug);
    const countrySlug = guide.targetType === "country" ? guide.countryId : city ? slugify(city.country) : "";
    const hub = countrySlug ? hubs.get(countrySlug) : undefined;

    if (hub) {
      hub.guides.push(guide);
      hub.image ||= guide.coverImage || guide.image || undefined;
      hub.updatedAt ||= guide.updatedAt || guide.createdAt || undefined;
    }
  }

  for (const attraction of attractions) {
    const city = cityBySlug.get(attraction.citySlug);
    const hub = city ? hubs.get(slugify(city.country)) : undefined;

    if (hub) {
      hub.attractions.push(attraction);
    }
  }

  return Array.from(hubs.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getCountryHubBySlug(hubs: CountryHub[], countrySlug: string) {
  const normalizedSlug = slugify(countrySlug);
  return hubs.find((hub) => hub.slug === normalizedSlug);
}
