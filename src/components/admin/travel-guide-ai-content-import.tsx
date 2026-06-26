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

    const structuredImport = buildStructuredGuideImport(parsed);
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
            AI Content Import
          </span>
          <span className="mt-1 block text-sm leading-6 text-slate-600">
            Paste structured guide content, then review matched builder blocks before saving.
          </span>
        </span>
        <span className="text-sm font-semibold text-[#0A2A66]">Open</span>
      </summary>
      <div className="grid gap-4 border-t border-slate-100 px-6 pb-6 pt-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Structured travel guide content</span>
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            rows={12}
            className="min-h-56 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder={
              "Title: Best places in Muscat\nSlug: best-places-in-muscat\nCity: Muscat\nCountry: Oman\nCategory: City guide\nShort Description: A first-time guide to Muscat.\n\nDescription:\nUse this guide to plan the best stops.\n\nHero Image: /uploads/guides/muscat.jpg\nSelected Destinations: Mutrah Corniche, Sultan Qaboos Grand Mosque\nQuick Info:\nDuration | 2 days\nBest for | First-time visitors\n\nBest Time To Visit: October to April\nTravel Tips:\nBook popular activities early\nStart outdoor visits in the morning\n\nFAQs:\nQuestion: Is Muscat good for first-time visitors?\nAnswer: Yes, it is easy to plan with a few focused areas.\n\nSEO Title: Best places in Muscat | Top7Spots\nSEO Description: Plan the best places to visit in Muscat."
            }
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillFields}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#0A2A66] px-5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
          >
            Parse and Fill Fields
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
    const warningMessage = warnings.length > 0 ? ` Unmatched references: ${warnings.join("; ")}.` : "";

    setState({
      tone: requiredMissing.length > 0 || warnings.length > 0 ? "warning" : "success",
      message: `${baseMessage}${warningMessage}`,
    });
  }
}

function buildStructuredGuideImport(parsed: ReturnType<typeof parseTravelGuideImportContent>): {
  guideType: GuideType;
  guideData?: GuideData;
  selectedItems?: GuideSelectedItem[];
} {
  const guideType = normalizeGuideType(parsed.guideType);
  const guideData = normalizeGuideData(parseJsonObject(parsed.guideData));
  const parsedItinerary = parseItineraryText(parsed.itinerary);
  const parsedRoute = parseRouteText(parsed.route);
  const selectedItems = normalizeGuideSelectedItems(parseSelectedItemsText(parsed.selectedItems));

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

function parseSelectedItemsText(value?: string): GuideSelectedItem[] {
  const json = parseJsonArray(value);
  if (json.length > 0) {
    return normalizeGuideSelectedItems(json);
  }

  return lines(value).map((line, index) => {
    const [type, itemId, displayOrder, customTitle, customSummary, bestFor, suggestedTime, nearbyPlaces, readMoreLabel] =
      line.split("|").map((item) => clean(item));

    return {
      id: `imported-selected-${index + 1}`,
      type: normalizeSelectedItemType(type),
      itemId: itemId || type,
      displayOrder: Number(displayOrder) || index + 1,
      customTitle,
      customSummary,
      bestFor,
      suggestedTime,
      nearbyPlaces: splitList(nearbyPlaces),
      readMoreLabel,
    };
  });
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
      body: parsed.excerpt,
      image: heroImage,
      imageAlt: parsed.coverImageAlt || parsed.title,
    });
  }

  if (parsed.content) {
    blocks.push({
      id: "imported-intro",
      type: "intro",
      title: "Introduction",
      body: parsed.content,
    });
  }

  const destinationMatches = matchEntities(parsed.selectedDestinations, context.destinations);
  pushEntityBlock(blocks, "imported-destinations", "selected-destinations", "Selected destinations", destinationMatches);
  pushMissingWarnings(context.warnings, "destinations", destinationMatches.missing);

  const cityMatches = matchEntities(parsed.selectedCities, context.cities);
  pushEntityBlock(blocks, "imported-cities", "selected-cities", "Selected cities", cityMatches);
  pushMissingWarnings(context.warnings, "cities", cityMatches.missing);

  const countryMatches = matchEntities(parsed.selectedCountries || parsed.countryId, context.countries);
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

  const tips = lines(parsed.travelTips);
  if (tips.length > 0) {
    blocks.push({
      id: "imported-travel-tips",
      type: "travel-tips",
      title: "Travel tips",
      tips,
    });
  }

  const faqs = parseFaqText(parsed.faqs);
  if (faqs.length > 0) {
    blocks.push({
      id: "imported-faq",
      type: "faq",
      title: "FAQ",
      faqs,
    });
  }

  return blocks;
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
    warnings.push(`${label}: ${missing.join(", ")}`);
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

  return [item.id, item.label, item.meta || ""].some((value) => {
    const normalizedValue = normalizeMatchValue(value);
    return (
      normalizedValue === normalizedReference ||
      compactMatchValue(value) === compactReference ||
      normalizedValue.includes(normalizedReference)
    );
  });
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
    .filter((item): item is GuideQuickInfoItem => Boolean(item.label && item.value));
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
