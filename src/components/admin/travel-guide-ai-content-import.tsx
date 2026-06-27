"use client";

import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { parseTravelGuideImportContent } from "@/lib/admin-content-parser";
import {
  normalizeGuideData,
  normalizeGuideSelectedItems,
  normalizeGuideType,
} from "@/lib/guide-structured-data";
import type {
  GuideContentBlock,
  GuideData,
  GuideFaq,
  GuideItineraryItem,
  GuideQuickInfoItem,
  GuideSelectedItem,
  GuideSelectedItemType,
  GuideType,
} from "@/lib/types";

type FillState = {
  tone: "idle" | "success" | "warning";
  message: string;
};

type SelectableItem = {
  id: string;
  label: string;
  meta?: string;
  slug?: string;
  city?: string;
  country?: string;
  category?: string;
  status?: string;
};

type TravelGuideAiContentImportProps = {
  destinations: SelectableItem[];
  cities: SelectableItem[];
  countries: SelectableItem[];
  restaurants: SelectableItem[];
  activities: SelectableItem[];
  guides: SelectableItem[];
};

type EntityMatchResult = {
  ids: string[];
  missing: string[];
};

type SelectedItemMatchResult =
  | { status: "matched"; item: SelectableItem }
  | { status: "ambiguous"; matches: SelectableItem[] }
  | { status: "missing" };

const textFields = [
  "title",
  "slug",
  "category",
  "author",
  "readTime",
  "displayOrder",
  "image",
  "coverImageAlt",
  "excerpt",
  "content",
  "faqs",
  "tableOfContents",
  "seoTitle",
  "seoDescription",
  "seoKeywords",
  "relatedGuideSlugs",
  "relatedPlaceSlugs",
] as const;

export function TravelGuideAiContentImport({
  destinations,
  cities,
  countries,
  restaurants,
  activities,
  guides,
}: TravelGuideAiContentImportProps) {
  const [importText, setImportText] = useState("");
  const [state, setState] = useState<FillState>({
    tone: "idle",
    message: "",
  });
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const fillFields = () => {
    const parsed = parseTravelGuideImportContent(importText);
    const filledFields: string[] = [];
    const warnings: string[] = [];
    const form = detailsRef.current?.closest("form");

    if (!form) {
      setState({ tone: "warning", message: "Guide form could not be found." });
      return;
    }

    for (const field of textFields) {
      const value = parsed[field];
      if (typeof value !== "string") {
        continue;
      }

      if (setTextControlValue(form, field, value)) {
        filledFields.push(field);
      }
    }

    if (parsed.status && setSelectValue(form, "status", parsed.status)) {
      filledFields.push("status");
    }

    if (typeof parsed.isFeatured === "boolean" && setCheckboxValue(form, "isFeatured", parsed.isFeatured)) {
      filledFields.push("isFeatured");
    }

    const structuredImport = buildStructuredGuideImport(parsed, {
      destinations,
      cities,
      countries,
      restaurants,
      activities,
      guides,
      warnings,
    });
    window.dispatchEvent(new CustomEvent("guide-structured-import", { detail: structuredImport }));
    if (structuredImport.guideType && setSelectValue(form, "guideType", structuredImport.guideType)) {
      filledFields.push("guideType");
    }
    if (structuredImport.guideData && setHiddenInputValue(form, "guideData", JSON.stringify(structuredImport.guideData))) {
      filledFields.push("guideData");
    }
    if (
      structuredImport.selectedItems &&
      setHiddenInputValue(form, "guideSelectedItems", JSON.stringify(structuredImport.selectedItems))
    ) {
      filledFields.push("guideSelectedItems");
    }

    const builderBlocks = buildGuideBuilderBlocks(parsed, {
      destinations,
      cities,
      countries,
      restaurants,
      activities,
      guides,
      warnings,
    });
    validateGuideImport(parsed, structuredImport.selectedItems || [], builderBlocks, warnings);

    if (builderBlocks.length > 0) {
      window.dispatchEvent(new CustomEvent("guide-builder-import", { detail: { blocks: builderBlocks } }));
      setHiddenInputValue(form, "contentBlocks", JSON.stringify(builderBlocks));
      filledFields.push("contentBlocks");
    }

    if (parsed.targetType && setRadioValue(form, "targetType", parsed.targetType)) {
      filledFields.push("targetType");
      window.setTimeout(() => {
        fillOwnershipSelects(form, parsed, filledFields);
        setCompletionState(parsed, filledFields, warnings);
      }, 0);
      return;
    }

    fillOwnershipSelects(form, parsed, filledFields);
    setCompletionState(parsed, filledFields, warnings);
  };

  return (
    <details
      ref={detailsRef}
      className="rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
        <span>
          <span className="flex items-center gap-2 text-lg font-semibold text-[#111827]">
            <Sparkles className="size-5 text-[#FF6B00]" aria-hidden="true" />
            Paste Bulk Guide Content
          </span>
          <span className="mt-1 block text-sm leading-6 text-slate-600">
            Paste content, auto-fill the guide, then review any warnings before saving.
          </span>
        </span>
        <span className="text-sm font-semibold text-[#0A2A66]">Open</span>
      </summary>
      <div className="grid gap-4 border-t border-slate-100 px-6 pb-6 pt-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Bulk guide content</span>
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            rows={12}
            className="min-h-56 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder={
              "Title: Best Places to Visit in Dubai\nCity: Dubai\nCountry: United Arab Emirates\nCategory: Best Places\nGuide Type: best_places\nShort Description: A focused guide to Dubai's strongest sightseeing areas and attractions.\n\nQuick Answer:\nFor most first-time visitors, prioritize Downtown Dubai, Dubai Marina/JBR, Old Dubai, Palm Jumeirah viewpoints, and one seasonal evening attraction.\n\nContent:\n## How to plan Dubai sightseeing by area\nCover Downtown Dubai, Palm Jumeirah, Dubai Marina/JBR, Old Dubai, and seasonal/evening attractions.\n\n## Best places in Dubai for first-time visitors\nExplain priority choices without turning the guide into an itinerary.\n\n## Best places in Dubai for families\nMention family-friendly places from the selected list.\n\n## Best free and low-cost places to visit in Dubai\nMention Dubai Fountain, JBR Beach, Dubai Marina Walk, Al Fahidi, Gold Souk, Spice Souk, and waterfront areas.\n\n## Best places to visit in Dubai at night\nMention Dubai Fountain, Dubai Marina, JBR Beach, Global Village, Downtown Dubai, and Palm Jumeirah viewpoints.\n\n## Best cultural places in Dubai\nMention Al Fahidi Historical District, Gold Souk, Spice Souk, Dubai Creek, and Dubai Frame.\n\n## Best indoor places in Dubai during summer\nMention Dubai Mall, Museum of the Future, Dubai Frame, Atlantis indoor experiences, and malls.\n\n## Suggested Dubai sightseeing plan\nGive simple 1-day, 3-day, and 5-day planning suggestions while keeping this a best_places guide.\n\nSelected Items:\ndestination | burj-khalifa | Burj Khalifa | Dubai | 1 | Burj Khalifa | Fresh 80-150 word guide-specific summary. | First-time visitors, skyline views | 2-3 hours | Dubai Mall, Dubai Fountain | Read more\n\nQuick Info:\nBest months | November to March\nGood for | First-time visitors, families, stopovers\n\nEstimated Cost:\nBudget:\nUse free waterfronts, souks, public beaches, and metro-friendly areas.\n\nMid-range:\nMix free areas with one or two paid headline attractions.\n\nPremium:\nAdd observation decks, private transfers, fine dining, and premium experiences.\n\nBest Time To Visit: November to March is the most comfortable season.\nTravel Tips:\nBook major paid attractions early.\nUse evenings for waterfront and outdoor areas in hotter months.\nCommon Mistakes:\nTrying to cross too many distant areas in one day.\nSkipping Old Dubai when planning only modern landmarks.\n\nFAQs:\nQuestion: How many days do you need for Dubai sightseeing?\nAnswer: Three to five days works well for most first-time visitors.\n\nSEO Title: Best Places to Visit in Dubai | Top7Spots\nSEO Description: Plan the best places to visit in Dubai by area, travel style, timing, and budget."
            }
          />
        </label>
        <p className="text-xs leading-5 text-slate-500">
          For competitive best_places guides, use fresh 80-150 word selected item summaries and add deeper planning sections for SEO depth. Major city guides usually need about 3,500-4,500 words when competition is high; do not copy destination page descriptions.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillFields}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#0A2A66] px-5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
          >
            Parse / Auto Fill
          </button>
          <button
            type="button"
            onClick={() => {
              setImportText("");
              setState({ tone: "idle", message: "" });
            }}
            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Clear Import Text
          </button>
        </div>
        {state.message ? (
          <p
            className={
              state.tone === "success"
                ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                : "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </details>
  );

  function setCompletionState(
    parsed: ReturnType<typeof parseTravelGuideImportContent>,
    filledFields: string[],
    warnings: string[],
  ) {
    if (filledFields.length === 0) {
      setState({
        tone: "warning",
        message: "No supported travel guide fields were found in the import text.",
      });
      return;
    }

    const requiredMissing = [parsed.title ? "" : "title"].filter(Boolean);
    const baseMessage =
      requiredMissing.length > 0
        ? `Fields filled. Please review before saving. Missing required import field: ${requiredMissing.join(", ")}.`
        : "Fields filled. Please review before saving.";
    const uniqueWarnings = Array.from(new Set(warnings));
    const warningMessage = uniqueWarnings.length > 0 ? ` ${uniqueWarnings.join(" ")}` : "";

    setState({
      tone: requiredMissing.length > 0 || uniqueWarnings.length > 0 ? "warning" : "success",
      message: `${baseMessage}${warningMessage}`,
    });
  }
}

function buildStructuredGuideImport(
  parsed: ReturnType<typeof parseTravelGuideImportContent>,
  context: TravelGuideAiContentImportProps & { warnings: string[] },
): {
  guideType: GuideType;
  guideData?: GuideData;
  selectedItems?: GuideSelectedItem[];
} {
  const guideType = normalizeGuideType(parsed.guideType);
  const guideData = normalizeGuideData(parseJsonObject(parsed.guideData));
  const parsedItinerary = parseItineraryText(parsed.itinerary);
  const parsedRoute = parseRouteText(parsed.route);
  const selectedItemsSource = parsed.selectedItems || parsed.selectedDestinations;
  const selectedItems = normalizeGuideSelectedItems(parseSelectedItemsText(selectedItemsSource, context));

  return {
    guideType,
    guideData: normalizeGuideData({
      ...guideData,
      itinerary: parsedItinerary.length > 0 ? parsedItinerary : guideData.itinerary,
      route: hasRouteData(parsedRoute) ? parsedRoute : guideData.route,
    }),
    selectedItems,
  };
}

function parseSelectedItemsText(
  value: string | undefined,
  context: TravelGuideAiContentImportProps & { warnings: string[] },
): GuideSelectedItem[] {
  const json = parseJsonArray(value);
  if (json.length > 0) {
    return normalizeGuideSelectedItems(json).map((item, index) => resolveSelectedItemReference(item, index, context));
  }

  const importedItems = selectedItemLines(value).map((line, index) => {
    const parts = line.split("|").map((item) => clean(item));
    const hasSlugAndNameColumns = parts.length >= 11;
    const hasNameColumns = parts.length >= 10;

    if (hasSlugAndNameColumns) {
      const [
        type,
        itemSlug,
        itemName,
        city,
        displayOrder,
        customTitle,
        customSummary,
        bestFor,
        suggestedTime,
        nearbyPlaces,
        readMoreLabel,
      ] = parts;

      return resolveSelectedItemReference(
        {
          id: `imported-selected-${index + 1}`,
          type: normalizeSelectedItemType(type),
          itemId: itemSlug || itemName,
          itemSlug,
          itemName,
          city,
          displayOrder: Number(displayOrder) || index + 1,
          customTitle,
          customSummary,
          bestFor,
          suggestedTime,
          nearbyPlaces: splitList(nearbyPlaces),
          readMoreLabel,
        },
        index,
        context,
      );
    }

    if (hasNameColumns) {
      const [
        type,
        itemName,
        city,
        displayOrder,
        customTitle,
        customSummary,
        bestFor,
        suggestedTime,
        nearbyPlaces,
        readMoreLabel,
      ] = parts;

      return resolveSelectedItemReference(
        {
          id: `imported-selected-${index + 1}`,
          type: normalizeSelectedItemType(type),
          itemId: itemName,
          itemSlug: looksLikeSlug(itemName) ? itemName : "",
          itemName,
          city,
          displayOrder: Number(displayOrder) || index + 1,
          customTitle,
          customSummary,
          bestFor,
          suggestedTime,
          nearbyPlaces: splitList(nearbyPlaces),
          readMoreLabel,
        },
        index,
        context,
      );
    }

    const [legacyType, legacyItemId, legacyDisplayOrder, legacyCustomTitle, legacyCustomSummary, legacyBestFor, legacySuggestedTime, legacyNearbyPlaces, legacyReadMoreLabel] =
      parts;

    return resolveSelectedItemReference(
      {
        id: `imported-selected-${index + 1}`,
        type: normalizeSelectedItemType(legacyType),
        itemId: legacyItemId || legacyType,
        itemSlug: legacyItemId,
        itemName: legacyCustomTitle,
        displayOrder: Number(legacyDisplayOrder) || index + 1,
        customTitle: legacyCustomTitle,
        customSummary: legacyCustomSummary,
        bestFor: legacyBestFor,
        suggestedTime: legacySuggestedTime,
        nearbyPlaces: splitList(legacyNearbyPlaces),
        readMoreLabel: legacyReadMoreLabel,
      },
      index,
      context,
    );
  });

  warnDuplicateSelectedItems(importedItems, context.warnings);
  return importedItems;
}

function selectedItemLines(value?: string) {
  return lines(value)
    .flatMap((line) => (line.includes("|") ? [line] : splitReferenceList(line)))
    .filter((line) => !isSelectedItemHeaderLine(line));
}

function isSelectedItemHeaderLine(line: string) {
  const normalizedParts = line.split("|").map((item) => normalizeMatchValue(item));
  return (
    normalizedParts.includes("displayorder") ||
    normalizedParts.includes("customtitle") ||
    normalizedParts.includes("customsummary") ||
    normalizedParts.includes("readmorelabel")
  );
}

function resolveSelectedItemReference(
  item: GuideSelectedItem,
  index: number,
  context: TravelGuideAiContentImportProps & { warnings: string[] },
): GuideSelectedItem {
  const match = matchSelectedItem(item, context);
  const reference = item.itemSlug || item.itemId || item.itemName;

  if (match.status === "ambiguous" && reference && item.type !== "custom") {
    context.warnings.push(`Warning: multiple ${item.type} records match "${reference}". Please select the correct item.`);
  }

  if (match.status === "missing" && reference && item.type !== "custom") {
    context.warnings.push(`Warning: selected item not found: ${reference}.`);
  }

  if (!item.customSummary && reference && item.type === "destination") {
    context.warnings.push(`Selected item needs a fresh custom summary: ${reference}.`);
  }

  return {
    ...item,
    itemId: match.status === "matched" ? match.item.id : item.itemId || item.itemSlug || item.itemName || "",
    itemSlug: item.itemSlug || (match.status === "matched" ? match.item.slug || "" : ""),
    itemName: item.itemName || (match.status === "matched" ? match.item.label : ""),
    city: item.city || (match.status === "matched" ? match.item.city || "" : ""),
    country: item.country || (match.status === "matched" ? match.item.country || "" : ""),
    displayOrder: item.displayOrder || index + 1,
  };
}

function matchSelectedItem(item: GuideSelectedItem, context: TravelGuideAiContentImportProps): SelectedItemMatchResult {
  const items = selectableItemsForType(item.type, context);
  const requestedId = normalizeMatchValue(item.itemId || "");
  const requestedSlug = normalizeMatchValue(item.itemSlug || "");
  const requestedName = normalizeMatchValue(item.itemName || item.customTitle || "");
  const requestedCity = normalizeMatchValue(item.city || "");
  const requestedCountry = normalizeMatchValue(item.country || "");

  return firstSelectedItemMatch([
    requestedId ? items.filter((candidate) => normalizeMatchValue(candidate.id) === requestedId) : [],
    requestedSlug ? items.filter((candidate) => normalizeMatchValue(candidate.slug || "") === requestedSlug) : [],
    requestedName && requestedCity
      ? items.filter(
          (candidate) =>
            normalizeMatchValue(candidate.label) === requestedName &&
            normalizeMatchValue(candidate.city || "") === requestedCity,
        )
      : [],
    requestedName && requestedCountry
      ? items.filter(
          (candidate) =>
            normalizeMatchValue(candidate.label) === requestedName &&
            normalizeMatchValue(candidate.country || "") === requestedCountry,
        )
      : [],
    requestedName ? items.filter((candidate) => normalizeMatchValue(candidate.label) === requestedName) : [],
  ]);
}

function selectableItemsForType(type: GuideSelectedItemType, context: TravelGuideAiContentImportProps) {
  if (type === "city") return context.cities;
  if (type === "country") return context.countries;
  if (type === "guide") return context.guides;
  if (type === "restaurant") return context.restaurants;
  if (type === "activity") return context.activities;
  if (type === "custom") return [];
  return context.destinations;
}

function firstSelectedItemMatch(matchGroups: SelectableItem[][]): SelectedItemMatchResult {
  for (const matches of matchGroups) {
    if (matches.length === 1) {
      return { status: "matched", item: matches[0] };
    }

    if (matches.length > 1) {
      return { status: "ambiguous", matches };
    }
  }

  return { status: "missing" };
}

function warnDuplicateSelectedItems(items: GuideSelectedItem[], warnings: string[]) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = [item.type, item.itemId || item.itemSlug || item.itemName].map((value) => compactMatchValue(value || "")).join(":");
    if (key === `${compactMatchValue(item.type)}:`) {
      continue;
    }

    counts.set(key, (counts.get(key) || 0) + 1);
  }

  for (const [key, count] of counts) {
    if (count > 1) {
      warnings.push(`Warning: duplicate selected item in import: ${key}.`);
    }
  }
}

function looksLikeSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim());
}

function parseItineraryText(value?: string): GuideItineraryItem[] {
  const json = parseJsonArray(value);
  if (json.length > 0) {
    return normalizeGuideData({ itinerary: json }).itinerary;
  }

  return lines(value)
    .map((line, index) => {
      const [dayNumber, timeSlot, placeTitle, destinationId, details, travelTime, displayOrder] =
        line.split("|").map((item) => clean(item));

      return {
        id: `imported-itinerary-${index + 1}`,
        dayNumber: Number(dayNumber) || 1,
        timeSlot,
        placeTitle,
        destinationId,
        details,
        travelTime,
        displayOrder: Number(displayOrder) || index + 1,
      };
    })
    .filter((item) => item.placeTitle || item.destinationId || item.details);
}

function parseRouteText(value?: string): GuideData["route"] {
  const json = parseJsonObject(value);
  const route = normalizeGuideData({ route: json }).route;
  if (hasRouteData(route)) {
    return route;
  }

  const routeRecord: Record<string, string> = {};
  for (const line of lines(value)) {
    const colonIndex = line.indexOf(":");
    if (colonIndex < 0) {
      continue;
    }

    const key = compactMatchValue(line.slice(0, colonIndex));
    routeRecord[key] = clean(line.slice(colonIndex + 1));
  }

  return normalizeGuideData({
    route: {
      startingPoint: routeRecord.startingpoint || routeRecord.start || "",
      endingPoint: routeRecord.endingpoint || routeRecord.end || "",
      distance: routeRecord.distance || "",
      travelTime: routeRecord.traveltime || routeRecord.duration || "",
      bestTransport: routeRecord.besttransport || routeRecord.transport || "",
      routeNotes: routeRecord.routenotes || routeRecord.notes || "",
      parkingInfo: routeRecord.parkinginfo || routeRecord.parking || "",
    },
  }).route;
}

function parseJsonObject(value?: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return {};
  }

  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function parseJsonArray(value?: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function hasRouteData(route: GuideData["route"]) {
  return Boolean(
    route.startingPoint ||
      route.endingPoint ||
      route.distance ||
      route.travelTime ||
      route.bestTransport ||
      route.routeNotes ||
      route.parkingInfo,
  );
}

function normalizeSelectedItemType(value?: string): GuideSelectedItemType {
  const normalized = normalizeMatchValue(value || "");
  if (normalized.includes("city")) return "city";
  if (normalized.includes("country")) return "country";
  if (normalized.includes("guide")) return "guide";
  if (normalized.includes("restaurant")) return "restaurant";
  if (normalized.includes("activity") || normalized.includes("attraction")) return "activity";
  if (normalized.includes("custom")) return "custom";
  return "destination";
}

function splitList(value?: string) {
  return String(value || "")
    .split(/,|\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildGuideBuilderBlocks(
  parsed: ReturnType<typeof parseTravelGuideImportContent>,
  context: TravelGuideAiContentImportProps & { warnings: string[] },
): GuideContentBlock[] {
  const blocks: GuideContentBlock[] = [];
  const heroImage = parsed.image?.trim();

  if (parsed.title || parsed.excerpt || heroImage) {
    blocks.push({
      id: "imported-hero",
      type: "hero",
      title: parsed.title,
      body: cleanHeroExcerpt(parsed.excerpt),
      image: heroImage,
      imageAlt: parsed.coverImageAlt || parsed.title,
    });
  }

  if (parsed.quickAnswer) {
    blocks.push({
      id: "imported-quick-answer",
      type: "quick-answer",
      title: "Quick Answer",
      body: parsed.quickAnswer,
    });
  }

  if (parsed.content) {
    blocks.push({
      id: "imported-intro",
      type: "intro",
      title: "Introduction",
      body: cleanImportedContentBody(parsed.content, parsed),
    });
  }

  const destinationMatches = matchEntities(parsed.selectedDestinations, context.destinations);
  pushEntityBlock(blocks, "imported-destinations", "selected-destinations", "Selected destinations", destinationMatches);
  pushMissingWarnings(context.warnings, "destinations", destinationMatches.missing);

  const cityMatches = matchEntities(parsed.selectedCities, context.cities);
  pushEntityBlock(blocks, "imported-cities", "selected-cities", "Selected cities", cityMatches);
  pushMissingWarnings(context.warnings, "cities", cityMatches.missing);

  const countryMatches = matchEntities(parsed.selectedCountries, context.countries);
  pushEntityBlock(blocks, "imported-countries", "selected-countries", "Selected countries", countryMatches);
  pushMissingWarnings(context.warnings, "countries", countryMatches.missing);

  const restaurantMatches = matchEntities(parsed.selectedRestaurants, context.restaurants);
  pushEntityBlock(blocks, "imported-restaurants", "selected-restaurants", "Selected restaurants", restaurantMatches);
  pushMissingWarnings(context.warnings, "restaurants", restaurantMatches.missing);

  const activityMatches = matchEntities(parsed.selectedActivities, context.activities);
  pushEntityBlock(blocks, "imported-activities", "selected-activities", "Selected activities", activityMatches);
  pushMissingWarnings(context.warnings, "activities", activityMatches.missing);

  const guideMatches = matchEntities(parsed.selectedGuides || parsed.relatedGuideSlugs, context.guides);
  pushEntityBlock(blocks, "imported-guides", "related-guides", "Related guides", guideMatches);
  pushMissingWarnings(context.warnings, "guides", guideMatches.missing);

  const quickInfo = parseQuickInfoText(parsed.quickInfo);
  if (quickInfo.length > 0) {
    blocks.push({
      id: "imported-quick-info",
      type: "quick-info",
      title: "Quick info",
      quickInfo,
    });
  }

  if (parsed.bestTimeToVisit) {
    blocks.push({
      id: "imported-best-time",
      type: "best-time-to-visit",
      title: "Best time to visit",
      body: parsed.bestTimeToVisit,
      tips: lines(parsed.bestTimeToVisit).length > 1 ? lines(parsed.bestTimeToVisit) : [],
    });
  }

  if (parsed.estimatedCost) {
    const estimatedCost = parseEstimatedCostText(parsed.estimatedCost, context.warnings);
    blocks.push({
      id: "imported-estimated-cost",
      type: "estimated-cost",
      title: "Estimated cost",
      body: estimatedCost.length > 0 ? undefined : parsed.estimatedCost,
      estimatedCost,
    });
  }

  const tips = lines(parsed.travelTips);
  if (tips.length > 0) {
    blocks.push({
      id: "imported-travel-tips",
      type: "travel-tips",
      title: "Travel tips",
      tips,
    });
  }

  const mistakes = lines(parsed.commonMistakes);
  if (mistakes.length > 0 || parsed.commonMistakes) {
    blocks.push({
      id: "imported-common-mistakes",
      type: "warnings",
      title: "Common mistakes",
      body: parsed.commonMistakes,
      tips: mistakes.length > 1 ? mistakes : [],
    });
  }

  const faqs = parseFaqText(parsed.faqs);
  if (faqs.length > 0) {
    blocks.push({
      id: "imported-faq",
      type: "faq",
      title: "FAQs",
      faqs,
    });
  }

  return blocks;
}

function validateGuideImport(
  parsed: ReturnType<typeof parseTravelGuideImportContent>,
  selectedItems: GuideSelectedItem[],
  blocks: GuideContentBlock[],
  warnings: string[],
) {
  const guideType = normalizeGuideType(parsed.guideType);
  const contentText = [
    parsed.excerpt,
    parsed.quickAnswer,
    parsed.content,
    parsed.bestTimeToVisit,
    parsed.estimatedCost,
    parsed.travelTips,
    parsed.commonMistakes,
    parsed.faqs,
  ]
    .filter(Boolean)
    .join("\n\n");

  for (const item of selectedItems) {
    const label = item.customTitle || item.itemName || item.itemSlug || item.itemId || "selected item";
    const summaryWords = wordCount(item.customSummary);

    if (!item.customSummary) {
      warnings.push(`Selected item needs a fresh custom summary: ${label}.`);
    } else if (summaryWords > 250) {
      warnings.push(`Selected item summary is over 250 words: ${label}.`);
    }
  }

  if (guideType === "best_places" && wordCount(contentText) < 2000) {
    warnings.push("Warning: this best_places guide appears under 2,000 words. Competitive city guides often need deeper planning sections.");
  }

  if (guideType === "best_places" && hasDayByDayWording(parsed.content || "") && !hasSuggestedSightseeingPlan(parsed.content || "")) {
    warnings.push('Warning: content has itinerary-style "Day 1 / Day 2 / Day 3" wording. Keep best_places guides non-itinerary unless it is inside a Suggested sightseeing plan section.');
  }

  const estimatedCostBlocks = blocks.filter((block) => block.type === "estimated-cost");
  const hasStructuredEstimatedCost = estimatedCostBlocks.some((block) => (block.estimatedCost || []).length > 0);
  const hasPlainEstimatedCost = estimatedCostBlocks.some((block) => Boolean(block.body));

  if (hasStructuredEstimatedCost && hasPlainEstimatedCost) {
    warnings.push("Warning: Estimated Cost has structured cards and plain text. Structured cards will be preferred.");
  }

  if (parsed.estimatedCost && parsed.content && /estimated cost\s*:/i.test(parsed.content)) {
    warnings.push("Warning: Estimated Cost appears both in Content and the Estimated Cost field. The duplicate content copy will be ignored.");
  }

  for (const block of estimatedCostBlocks) {
    const missingLabels = missingEstimatedCostLabels(block.estimatedCost || []);

    if ((block.estimatedCost || []).length > 0 && missingLabels.length > 0) {
      warnings.push(`Warning: Estimated Cost is missing ${missingLabels.join("/")}.`);
    }
  }
}

function cleanImportedContentBody(
  content: string,
  parsed: ReturnType<typeof parseTravelGuideImportContent>,
) {
  if (!parsed.estimatedCost) {
    return content;
  }

  return content
    .replace(/(^|\n)#{2,3}\s*Estimated Cost[\s\S]*?(?=\n#{2,3}\s+|$)/i, "\n")
    .replace(/(^|\n)Estimated Cost\s*:[\s\S]*?(?=\n[A-Z][^\n:]{2,80}\s*:|$)/i, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function wordCount(value?: string) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function hasDayByDayWording(value: string) {
  return /\bDay\s+[123]\b/i.test(value);
}

function hasSuggestedSightseeingPlan(value: string) {
  return /suggested\s+dubai\s+sightseeing\s+plan|suggested\s+sightseeing\s+plan/i.test(value);
}

function parseEstimatedCostText(value: string | undefined, warnings: string[]): GuideQuickInfoItem[] {
  const text = String(value || "").trim();
  if (!text) {
    return [];
  }

  const { items: sections, emptyLabels, extraText } = parseEstimatedCostRows(text);

  for (const label of emptyLabels) {
    warnings.push(`Warning: Estimated Cost has an empty ${label} entry.`);
  }

  if (sections.length > 0 && extraText) {
    warnings.push("Warning: Estimated Cost includes structured labels and extra plain text. Structured cards will be used.");
  }

  return dedupeQuickInfoItems(sections);
}

function pushEntityBlock(
  blocks: GuideContentBlock[],
  id: string,
  type: GuideContentBlock["type"],
  title: string,
  result: EntityMatchResult,
) {
  if (result.ids.length === 0) {
    return;
  }

  blocks.push({
    id,
    type,
    title,
    itemIds: result.ids,
  });
}

function pushMissingWarnings(warnings: string[], label: string, missing: string[]) {
  if (missing.length > 0) {
    warnings.push(`Warning: unmatched ${label}: ${missing.join(", ")}.`);
  }
}

function matchEntities(value: string | undefined, items: SelectableItem[]): EntityMatchResult {
  const requested = splitReferenceList(value);
  const ids: string[] = [];
  const missing: string[] = [];

  for (const reference of requested) {
    const match = items.find((item) => matchesItem(item, reference));

    if (match) {
      ids.push(match.id);
    } else {
      missing.push(reference);
    }
  }

  return {
    ids: Array.from(new Set(ids)),
    missing,
  };
}

function matchesItem(item: SelectableItem, reference: string) {
  const normalizedReference = normalizeMatchValue(reference);
  const compactReference = compactMatchValue(reference);

  return exactSelectableValues(item).some(
    (value) => value.normalized === normalizedReference || value.compact === compactReference,
  );
}

function exactSelectableValues(item: SelectableItem) {
  return Array.from(
    new Set(
      [
        item.id,
        item.slug,
        item.label,
        item.city,
        item.country,
        ...(item.meta || "").split(/\s+-\s+|,/),
      ]
        .map((value) => clean(value))
        .filter(Boolean),
    ),
  ).map((value) => ({
    normalized: normalizeMatchValue(value),
    compact: compactMatchValue(value),
  }));
}

function splitReferenceList(value?: string) {
  return Array.from(
    new Set(
      String(value || "")
        .split(/\n|,|;|\|/)
        .map((item) => item.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean),
    ),
  );
}

function parseQuickInfoText(value?: string): GuideQuickInfoItem[] {
  return lines(value)
    .map((line) => {
      const [label, ...rest] = line.split("|");

      if (rest.length > 0) {
        return {
          label: clean(label),
          value: clean(rest.join("|")),
        };
      }

      const colonIndex = line.indexOf(":");
      if (colonIndex >= 0) {
        return {
          label: clean(line.slice(0, colonIndex)),
          value: clean(line.slice(colonIndex + 1)),
        };
      }

      return { label: "", value: "" };
    })
    .filter((item): item is GuideQuickInfoItem => Boolean(item.label && item.value && !isPlaceholderQuickInfo(item)));
}

function cleanEstimatedCostValue(value: string) {
  return value
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => !isEstimatedCostLabelOnly(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseEstimatedCostRows(value: string): {
  items: GuideQuickInfoItem[];
  emptyLabels: string[];
  extraText: boolean;
} {
  const items: GuideQuickInfoItem[] = [];
  const emptyLabels: string[] = [];
  const extraLines: string[] = [];
  let currentLabel = "";
  let currentLines: string[] = [];

  const flush = () => {
    if (!currentLabel) {
      return;
    }

    const sectionValue = cleanEstimatedCostValue(currentLines.join("\n"));
    if (sectionValue) {
      items.push({ label: currentLabel, value: sectionValue });
    } else {
      emptyLabels.push(currentLabel);
    }

    currentLabel = "";
    currentLines = [];
  };

  for (const rawLine of value.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();
    const rowMatch = line.match(/^[-*]?\s*(Budget|Mid[-\s]?range|Premium)\s*(?::|\|)\s*(.*)$/i);

    if (rowMatch) {
      flush();
      currentLabel = displayEstimatedCostLabel(rowMatch[1]);
      currentLines = rowMatch[2] ? [rowMatch[2]] : [];
      continue;
    }

    if (currentLabel) {
      currentLines.push(rawLine);
    } else if (line) {
      extraLines.push(line);
    }
  }

  flush();

  return {
    items,
    emptyLabels,
    extraText: extraLines.some((line) => !isEstimatedCostLabelOnly(line)),
  };
}

function isEstimatedCostLabelOnly(value: string) {
  return /^(budget|mid-range|mid range|premium)\s*:?\s*$/i.test(value.trim());
}

function displayEstimatedCostLabel(value: string) {
  return normalizeMatchValue(value) === "midrange" ? "Mid-range" : value.trim().replace(/^\w/, (letter) => letter.toUpperCase());
}

function missingEstimatedCostLabels(items: GuideQuickInfoItem[]) {
  const presentLabels = new Set(items.map((item) => normalizeMatchValue(item.label)));
  return ["Budget", "Mid-range", "Premium"].filter((label) => !presentLabels.has(normalizeMatchValue(label)));
}

function dedupeQuickInfoItems(items: GuideQuickInfoItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${normalizeMatchValue(item.label)}:${normalizeMatchValue(item.value)}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function cleanHeroExcerpt(value?: string) {
  return String(value || "")
    .replace(/Quick Answer\s*:[\s\S]*$/i, "")
    .trim();
}

function isPlaceholderQuickInfo(item: GuideQuickInfoItem) {
  return item.label.trim().toLowerCase() === "label" && item.value.trim().toLowerCase() === "value";
}

function parseFaqText(value?: string): GuideFaq[] {
  return String(value || "")
    .split(/\n\s*\n/)
    .map((block) => {
      const questionMatch = block.match(/(?:^|\n)\s*(?:Question|Q):\s*(.+)/i);
      const answerMatch = block.match(/(?:^|\n)\s*(?:Answer|A):\s*([\s\S]+)/i);
      return {
        question: clean(questionMatch?.[1]),
        answer: clean(answerMatch?.[1]),
      };
    })
    .filter((faq): faq is GuideFaq => Boolean(faq.question && faq.answer));
}

function fillOwnershipSelects(
  form: HTMLFormElement,
  parsed: ReturnType<typeof parseTravelGuideImportContent>,
  filledFields: string[],
) {
  if (parsed.countryId && setSelectValue(form, "countryId", parsed.countryId)) {
    filledFields.push("countryId");
  }

  if (parsed.citySlug && setSelectValue(form, "citySlug", parsed.citySlug)) {
    filledFields.push("citySlug");
  }

  if (parsed.destinationId && setSelectValue(form, "destinationId", parsed.destinationId)) {
    filledFields.push("destinationId");
  }
}

function setTextControlValue(form: HTMLFormElement, name: string, value: string) {
  const input = form.elements.namedItem(name);

  if (!isTextControl(input)) {
    return false;
  }

  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function setHiddenInputValue(form: HTMLFormElement, name: string, value: string) {
  const input = form.elements.namedItem(name);

  if (!(input instanceof HTMLInputElement) || input.type !== "hidden") {
    return false;
  }

  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function setSelectValue(form: HTMLFormElement, name: string, value: string) {
  const input = form.elements.namedItem(name);

  if (!(input instanceof HTMLSelectElement)) {
    return false;
  }

  const normalizedValue = normalizeMatchValue(value);
  const option = Array.from(input.options).find((item) => {
    const optionValue = normalizeMatchValue(item.value);
    const optionLabel = normalizeMatchValue(item.textContent || "");
    return (
      optionValue === normalizedValue ||
      optionLabel === normalizedValue ||
      optionLabel.startsWith(`${normalizedValue},`) ||
      optionLabel.includes(normalizedValue)
    );
  });

  if (!option) {
    return false;
  }

  input.value = option.value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function setCheckboxValue(form: HTMLFormElement, name: string, value: boolean) {
  const input = form.elements.namedItem(name);

  if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") {
    return false;
  }

  input.checked = value;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function setRadioValue(form: HTMLFormElement, name: string, value: string) {
  const input = form.elements.namedItem(name);
  const normalizedValue = normalizeMatchValue(value);

  if (input instanceof RadioNodeList) {
    const radio = Array.from(input).find(
      (item): item is HTMLInputElement =>
        item instanceof HTMLInputElement &&
        item.type === "radio" &&
        normalizeMatchValue(item.value) === normalizedValue,
    );

    if (!radio) {
      return false;
    }

    if (!radio.checked) {
      radio.click();
    } else {
      radio.dispatchEvent(new Event("change", { bubbles: true }));
    }

    return true;
  }

  if (
    input instanceof HTMLInputElement &&
    input.type === "radio" &&
    normalizeMatchValue(input.value) === normalizedValue
  ) {
    if (!input.checked) {
      input.click();
    }
    return true;
  }

  return false;
}

function isTextControl(input: RadioNodeList | Element | null): input is HTMLInputElement | HTMLTextAreaElement {
  return input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement;
}

function lines(value?: string) {
  return String(value || "")
    .split("\n")
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function clean(value?: string) {
  return value?.trim() || "";
}

function normalizeMatchValue(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function compactMatchValue(value: string) {
  return normalizeMatchValue(value).replace(/\s+/g, "");
}
