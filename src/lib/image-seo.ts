import type { Attraction, City, Destination, Guide, Restaurant } from "@/lib/types";

type ImageRole = string | undefined;

type CityLike = Pick<City, "name" | "country" | "region">;

type DestinationLike = Pick<Destination, "name" | "city" | "category" | "location" | "region"> & {
  country?: string;
  countryName?: string;
};

type AttractionLike = Pick<Attraction, "name" | "city" | "category" | "type"> & {
  country?: string;
  countryName?: string;
};

type RestaurantLike = Pick<Restaurant, "name" | "cuisineType" | "countrySlug"> & {
  city?: string;
  country?: string;
  countryName?: string;
};

type CarRentalAltContext = {
  title?: string;
  pageTitle?: string;
  cityName?: string;
  countryName?: string;
  role?: string;
  type?: "cover" | "vehicle-category" | "location-card" | "guide-card" | "destination-card" | "description";
};

export function cityImageAlt(city: CityLike, role?: ImageRole) {
  const place = placeName(city.name, city.country);
  const roleText = normalizedRole(role);

  if (roleText === "hero") {
    return `Travel view of ${place}`;
  }

  if (roleText === "card") {
    return `${city.name} city travel card image${city.country ? ` in ${city.country}` : ""}`;
  }

  if (roleText === "featured") {
    return `Featured travel image of ${place}`;
  }

  return `${city.name} travel image${city.country ? ` in ${city.country}` : ""}`;
}

export function destinationImageAlt(destination: DestinationLike, role?: ImageRole) {
  const descriptor = destination.category?.trim().toLowerCase();
  const suffix = locationSuffix(destination.city, destination.country || destination.countryName || destination.region);
  const roleText = normalizedRole(role);

  if (roleText && roleText !== "main") {
    return `${titleCase(roleText)} image of ${destination.name}${suffix}`;
  }

  return `${destination.name}${descriptor ? ` ${descriptor}` : " travel destination"}${suffix}`;
}

export function galleryImageAlt(destination: DestinationLike, index: number) {
  const photoNumber = Math.max(1, index + 1);
  const suffix = locationSuffix(destination.city, destination.country || destination.countryName || destination.region);
  return `Gallery photo ${photoNumber} of ${destination.name}${suffix}`;
}

export function attractionImageAlt(attraction: AttractionLike) {
  const descriptor = (attraction.category || attraction.type || "attraction").trim().toLowerCase();
  const suffix = locationSuffix(attraction.city, attraction.country || attraction.countryName);
  return `${attraction.name} ${descriptor}${suffix}`;
}

export function restaurantImageAlt(restaurant: RestaurantLike) {
  const suffix = locationSuffix(restaurant.city, restaurant.country || restaurant.countryName || restaurant.countrySlug);
  return `Restaurant image for ${restaurant.name}${suffix}`;
}

export function guideImageAlt(guide: Pick<Guide, "title" | "coverImageAlt" | "category">) {
  return guide.coverImageAlt?.trim() || `${guide.title} ${guide.category ? `${guide.category.toLowerCase()} ` : ""}travel guide`;
}

export function carRentalImageAlt(context: CarRentalAltContext | string) {
  if (typeof context === "string") {
    return `${context} car rental image`;
  }

  const title = context.title?.trim() || context.pageTitle?.trim() || "Car rental";
  const location = placeName(context.cityName, context.countryName);

  if (context.type === "vehicle-category") {
    return `${title} rental car category${location ? ` for ${location} car rental` : ""}`;
  }

  if (context.type === "cover") {
    return `${location || title} car rental cover image`;
  }

  if (context.type === "guide-card") {
    return `${title} car rental guide image`;
  }

  if (context.type === "destination-card" || context.type === "location-card") {
    return `${title} car rental location image`;
  }

  return `${title} car rental image`;
}

function locationSuffix(city?: string, country?: string) {
  const place = placeName(city, country);
  return place ? ` in ${place}` : "";
}

function placeName(city?: string, country?: string) {
  return [cleanLocationPart(city), cleanLocationPart(country)].filter(Boolean).join(", ");
}

function cleanLocationPart(value?: string) {
  const clean = value?.trim();
  return clean && clean !== "-" ? clean : "";
}

function normalizedRole(role?: ImageRole) {
  return role?.trim().toLowerCase().replace(/[-_]+/g, " ");
}

function titleCase(value: string) {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}
