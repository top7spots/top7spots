import { slugify } from "@/lib/format";
import type {
  GuideData,
  GuideItineraryItem,
  GuideRouteData,
  GuideSelectedItem,
  GuideSelectedItemType,
  GuideType,
} from "@/lib/types";

export const guideTypeOptions: Array<{ value: GuideType; label: string }> = [
  { value: "best_places", label: "Best places" },
  { value: "things_to_do", label: "Things to do" },
  { value: "itinerary", label: "Itinerary" },
  { value: "day_trip", label: "Day trip" },
  { value: "road_trip", label: "Road trip" },
  { value: "practical", label: "Practical" },
  { value: "destination_combination", label: "Destination combination" },
  { value: "comparison", label: "Comparison" },
  { value: "seasonal", label: "Seasonal" },
];

const guideTypes = new Set<GuideType>(guideTypeOptions.map((option) => option.value));

const selectedItemTypes = new Set<GuideSelectedItemType>([
  "destination",
  "city",
  "country",
  "guide",
  "restaurant",
  "activity",
  "custom",
]);

export const emptyGuideRouteData: GuideRouteData = {
  startingPoint: "",
  endingPoint: "",
  distance: "",
  travelTime: "",
  bestTransport: "",
  routeNotes: "",
  parkingInfo: "",
};

export function normalizeGuideType(value: unknown): GuideType {
  const type = stringValue(value) as GuideType;
  return guideTypes.has(type) ? type : "practical";
}

export function normalizeGuideData(value: unknown): GuideData {
  const record = recordValue(parseMaybeJson(value));
  const route = recordValue(record.route);

  return {
    ...record,
    itinerary: normalizeItineraryItems(record.itinerary),
    route: {
      startingPoint: stringValue(route.startingPoint),
      endingPoint: stringValue(route.endingPoint),
      distance: stringValue(route.distance),
      travelTime: stringValue(route.travelTime),
      bestTransport: stringValue(route.bestTransport),
      routeNotes: stringValue(route.routeNotes),
      parkingInfo: stringValue(route.parkingInfo),
    },
  };
}

export function compactGuideDataForStorage(value: unknown): Record<string, unknown> {
  const data = normalizeGuideData(value);
  const output: Record<string, unknown> = {};
  const extraEntries = Object.entries(data).filter(([key]) => key !== "itinerary" && key !== "route");

  if (data.itinerary.length > 0) {
    output.itinerary = data.itinerary;
  }

  if (
    data.route.startingPoint ||
    data.route.endingPoint ||
    data.route.distance ||
    data.route.travelTime ||
    data.route.bestTransport ||
    data.route.routeNotes ||
    data.route.parkingInfo
  ) {
    output.route = data.route;
  }

  for (const [key, entryValue] of extraEntries) {
    if (entryValue !== undefined && entryValue !== null && entryValue !== "") {
      output[key] = entryValue;
    }
  }

  return output;
}

export function normalizeGuideSelectedItems(value: unknown): GuideSelectedItem[] {
  const parsed = parseMaybeJson(value);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter(isRecord)
    .map((item, index) => normalizeSelectedItem(item, index))
    .filter((item): item is GuideSelectedItem => Boolean(item));
}

export function normalizeItineraryItems(value: unknown): GuideItineraryItem[] {
  const parsed = parseMaybeJson(value);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter(isRecord)
    .map((item, index) => {
      const dayNumber = numberValue(item.dayNumber, 1);
      const displayOrder = numberValue(item.displayOrder, index + 1);
      const placeTitle = stringValue(item.placeTitle);
      const destinationId = stringValue(item.destinationId);
      const details = stringValue(item.details);

      if (!placeTitle && !destinationId && !details) {
        return undefined;
      }

      return {
        id: stringValue(item.id) || `itinerary-${dayNumber}-${displayOrder}`,
        dayNumber,
        timeSlot: stringValue(item.timeSlot),
        placeTitle,
        destinationId,
        details,
        travelTime: stringValue(item.travelTime),
        displayOrder,
      };
    })
    .filter((item): item is GuideItineraryItem => Boolean(item))
    .sort((a, b) => a.dayNumber - b.dayNumber || a.displayOrder - b.displayOrder);
}

function normalizeSelectedItem(item: Record<string, unknown>, index: number): GuideSelectedItem | undefined {
  const type = normalizeSelectedItemType(item.type);
  const itemSlug = stringValue(item.itemSlug || item.item_slug || item.slug);
  const itemName = stringValue(item.itemName || item.item_name || item.name);
  const city = stringValue(item.city || item.cityName || item.city_name);
  const itemId = stringValue(item.itemId || item.item_id || item.id || itemSlug);
  const customTitle = stringValue(item.customTitle || item.custom_title || item.title);
  const customSummary = stringValue(item.customSummary || item.summary || item.description);
  const id = stringValue(item.id) || slugify([type, itemId || itemSlug || itemName || customTitle, index + 1].filter(Boolean).join("-"));

  if (!itemId && !itemSlug && !itemName && !customTitle && !customSummary) {
    return undefined;
  }

  return {
    id: id || `selected-item-${index + 1}`,
    type,
    itemId,
    itemSlug,
    itemName,
    city,
    displayOrder: numberValue(item.displayOrder, index + 1),
    customTitle,
    customSummary,
    bestFor: stringValue(item.bestFor),
    suggestedTime: stringValue(item.suggestedTime),
    nearbyPlaces: stringArrayValue(item.nearbyPlaces),
    readMoreLabel: stringValue(item.readMoreLabel),
  };
}

function normalizeSelectedItemType(value: unknown): GuideSelectedItemType {
  const type = stringValue(value) as GuideSelectedItemType;
  return selectedItemTypes.has(type) ? type : "destination";
}

function parseMaybeJson(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

function recordValue(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function stringArrayValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => stringValue(item)).filter(Boolean);
  }

  return stringValue(value)
    .split(/,|\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberValue(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
