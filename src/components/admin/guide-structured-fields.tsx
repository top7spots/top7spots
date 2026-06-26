"use client";

import { useEffect, useMemo, useState } from "react";
import {
  emptyGuideRouteData,
  guideTypeOptions,
  normalizeGuideData,
  normalizeGuideSelectedItems,
  normalizeGuideType,
} from "@/lib/guide-structured-data";
import type {
  GuideData,
  GuideItineraryItem,
  GuideSelectedItem,
  GuideSelectedItemType,
  GuideType,
} from "@/lib/types";

type GuideStructuredFieldsProps = {
  defaultGuideType?: GuideType;
  defaultGuideData?: GuideData;
  defaultSelectedItems?: GuideSelectedItem[];
  selectedItemOptions: SelectedItemOptions;
};

export type SelectedItemOption = {
  id: string;
  label: string;
  slug?: string;
  city?: string;
  country?: string;
  meta?: string;
  image?: string;
  imageAlt?: string;
  href?: string;
  badge?: string;
};

export type SelectedItemOptions = Partial<Record<GuideSelectedItemType, SelectedItemOption[]>>;

type SelectedItemWarning = {
  key: string;
  message: string;
  tone: "warning" | "error";
};

const selectedItemTypeOptions: Array<{ value: GuideSelectedItemType; label: string }> = [
  { value: "destination", label: "Destination" },
  { value: "city", label: "City" },
  { value: "country", label: "Country" },
  { value: "guide", label: "Guide" },
  { value: "restaurant", label: "Restaurant" },
  { value: "activity", label: "Activity" },
  { value: "custom", label: "Custom" },
];

export function GuideStructuredFields({
  defaultGuideType,
  defaultGuideData,
  defaultSelectedItems,
  selectedItemOptions,
}: GuideStructuredFieldsProps) {
  const [guideType, setGuideType] = useState<GuideType>(() => normalizeGuideType(defaultGuideType));
  const [guideData, setGuideData] = useState<GuideData>(() => normalizeGuideData(defaultGuideData));
  const [selectedItems, setSelectedItems] = useState<GuideSelectedItem[]>(() =>
    normalizeGuideSelectedItems(defaultSelectedItems),
  );
  const normalizedData = useMemo(() => normalizeGuideData(guideData), [guideData]);
  const selectedItemsForStorage = useMemo(
    () => normalizeGuideSelectedItems(selectedItems.map((item) => resolveSelectedItemForStorage(item, selectedItemOptions))),
    [selectedItemOptions, selectedItems],
  );

  useEffect(() => {
    const handleImport = (event: Event) => {
      const detail = (event as CustomEvent<{
        guideType?: GuideType;
        guideData?: GuideData;
        selectedItems?: GuideSelectedItem[];
      }>).detail;

      if (!detail) {
        return;
      }

      if (detail.guideType) {
        setGuideType(normalizeGuideType(detail.guideType));
      }

      if (detail.guideData) {
        setGuideData(normalizeGuideData(detail.guideData));
      }

      if (detail.selectedItems) {
        setSelectedItems(normalizeGuideSelectedItems(detail.selectedItems));
      }
    };

    window.addEventListener("guide-structured-import", handleImport);
    return () => window.removeEventListener("guide-structured-import", handleImport);
  }, []);

  return (
    <div className="grid gap-5">
      <input type="hidden" name="guideData" value={JSON.stringify(normalizedData)} />
      <input type="hidden" name="guideSelectedItems" value={JSON.stringify(selectedItemsForStorage)} />

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Guide type
        <select
          name="guideType"
          value={guideType}
          onChange={(event) => setGuideType(normalizeGuideType(event.target.value))}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
        >
          {guideTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {guideType === "best_places" ? (
        <SelectedItemsEditor
          title="Best places selected items"
          items={selectedItems}
          options={selectedItemOptions}
          onChange={setSelectedItems}
        />
      ) : null}

      {guideType === "itinerary" ? (
        <ItineraryEditor
          items={normalizedData.itinerary}
          onChange={(itinerary) => setGuideData({ ...normalizedData, itinerary })}
        />
      ) : null}

      {guideType === "day_trip" || guideType === "road_trip" ? (
        <>
          <RouteEditor
            route={normalizedData.route}
            onChange={(route) => setGuideData({ ...normalizedData, route })}
          />
          <SelectedItemsEditor
            title={guideType === "day_trip" ? "Day trip stops" : "Road trip stops"}
            items={selectedItems}
            options={selectedItemOptions}
            onChange={setSelectedItems}
          />
        </>
      ) : null}
    </div>
  );
}

function SelectedItemsEditor({
  title,
  items,
  options,
  onChange,
}: {
  title: string;
  items: GuideSelectedItem[];
  options: SelectedItemOptions;
  onChange: (items: GuideSelectedItem[]) => void;
}) {
  const duplicateDestinationKeys = duplicateSelectedDestinationKeys(items, options);

  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Add ordered cards or stops. Use existing item IDs/slugs where possible.
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Images and links are pulled from the matched destination. Card text should be written fresh for this guide.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2A66] shadow-sm transition hover:border-[#2563EB] hover:bg-blue-50"
          onClick={() => onChange([...items, newSelectedItem(items.length + 1)])}
        >
          Add Selected Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No structured selected items yet.
        </div>
      ) : null}

      {items.map((item, index) => {
        const itemOptions = optionsForType(options, item.type);
        const matchedOption = findMatchingOption(item, itemOptions);
        const warnings = selectedItemWarnings(item, matchedOption, duplicateDestinationKeys);

        return (
        <div key={item.id} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
              Item {index + 1}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={index === 0}
                onClick={() => onChange(moveSelectedItem(items, index, index - 1))}
              >
                Move Up
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={index === items.length - 1}
                onClick={() => onChange(moveSelectedItem(items, index, index + 1))}
              >
                Move Down
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                onClick={() => onChange(duplicateSelectedItem(items, index))}
              >
                Duplicate
              </button>
              <button
                type="button"
                className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              >
                Remove
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,0.75fr)_minmax(0,1.75fr)_minmax(110px,0.5fr)]">
            <label className="grid gap-2">
              <span className="text-xs font-semibold text-slate-600">Item type</span>
              <select
                value={item.type}
                onChange={(event) =>
                  updateSelectedItem(
                    items,
                    index,
                    {
                      type: event.target.value as GuideSelectedItemType,
                      itemId: "",
                      itemSlug: "",
                      itemName: "",
                      city: "",
                    },
                    onChange,
                  )
                }
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
              >
                {selectedItemTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <SelectedItemEntityPicker
              item={item}
              options={itemOptions}
              matchedOption={matchedOption}
              onSelect={(option) => updateSelectedItem(items, index, selectedItemPatchFromOption(item, option), onChange)}
              onUnmatchedQuery={(query) =>
                updateSelectedItem(items, index, { itemName: query, itemSlug: "", itemId: "" }, onChange)
              }
            />
            <SmallField
              label="Display order"
              value={String(item.displayOrder || index + 1)}
              onChange={(displayOrder) => updateSelectedItem(items, index, { displayOrder: Number(displayOrder) || index + 1 }, onChange)}
              type="number"
            />
          </div>

          <SelectedItemPreview item={item} option={matchedOption} />

          {warnings.length > 0 ? (
            <div className="grid gap-2">
              {warnings.map((warning) => (
                <p
                  key={warning.key}
                  className={
                    warning.tone === "error"
                      ? "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
                      : "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700"
                  }
                >
                  {warning.message}
                </p>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <SmallField
              label="Custom title"
              value={item.customTitle}
              onChange={(customTitle) => updateSelectedItem(items, index, { customTitle }, onChange)}
              placeholder="Best sunset stop"
            />
            <SmallField
              label="Read more label"
              value={item.readMoreLabel}
              onChange={(readMoreLabel) => updateSelectedItem(items, index, { readMoreLabel }, onChange)}
              placeholder="Read more"
            />
          </div>

          <TextAreaField
            label="Custom short summary"
            value={item.customSummary}
            onChange={(customSummary) => updateSelectedItem(items, index, { customSummary }, onChange)}
          />

          <div className="grid gap-3 md:grid-cols-3">
            <SmallField
              label="Best for"
              value={item.bestFor}
              onChange={(bestFor) => updateSelectedItem(items, index, { bestFor }, onChange)}
              placeholder="First-time visitors"
            />
            <SmallField
              label="Suggested time"
              value={item.suggestedTime}
              onChange={(suggestedTime) => updateSelectedItem(items, index, { suggestedTime }, onChange)}
              placeholder="1-2 hours"
            />
            <SmallField
              label="Nearby places"
              value={item.nearbyPlaces.join(", ")}
              onChange={(nearbyPlaces) =>
                updateSelectedItem(items, index, { nearbyPlaces: splitList(nearbyPlaces) }, onChange)
              }
              placeholder="old-muscat, mutrah-souq"
            />
          </div>
        </div>
        );
      })}
    </div>
  );
}

function ItineraryEditor({
  items,
  onChange,
}: {
  items: GuideItineraryItem[];
  onChange: (items: GuideItineraryItem[]) => void;
}) {
  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Itinerary timeline</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Add day-by-day rows. Empty rows are ignored when the guide is saved.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2A66] shadow-sm transition hover:border-[#2563EB] hover:bg-blue-50"
          onClick={() => onChange([...items, newItineraryItem(items.length + 1)])}
        >
          Add itinerary row
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No itinerary rows yet.
        </div>
      ) : null}

      {items.map((item, index) => (
        <div key={item.id} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
              Itinerary row {index + 1}
            </p>
            <button
              type="button"
              className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              Remove
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <SmallField
              label="Day number"
              type="number"
              value={String(item.dayNumber || 1)}
              onChange={(dayNumber) => updateItineraryItem(items, index, { dayNumber: Number(dayNumber) || 1 }, onChange)}
            />
            <SmallField
              label="Time slot"
              value={item.timeSlot}
              onChange={(timeSlot) => updateItineraryItem(items, index, { timeSlot }, onChange)}
              placeholder="Morning"
            />
            <SmallField
              label="Display order"
              type="number"
              value={String(item.displayOrder || index + 1)}
              onChange={(displayOrder) => updateItineraryItem(items, index, { displayOrder: Number(displayOrder) || index + 1 }, onChange)}
            />
            <SmallField
              label="Travel time"
              value={item.travelTime}
              onChange={(travelTime) => updateItineraryItem(items, index, { travelTime }, onChange)}
              placeholder="20 min"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <SmallField
              label="Place title"
              value={item.placeTitle}
              onChange={(placeTitle) => updateItineraryItem(items, index, { placeTitle }, onChange)}
              placeholder="Mutrah Corniche"
            />
            <SmallField
              label="Destination ID or slug"
              value={item.destinationId}
              onChange={(destinationId) => updateItineraryItem(items, index, { destinationId }, onChange)}
              placeholder="mutrah-corniche"
            />
          </div>
          <TextAreaField
            label="Details"
            value={item.details}
            onChange={(details) => updateItineraryItem(items, index, { details }, onChange)}
          />
        </div>
      ))}
    </div>
  );
}

function RouteEditor({
  route,
  onChange,
}: {
  route: GuideData["route"];
  onChange: (route: GuideData["route"]) => void;
}) {
  const safeRoute = route || emptyGuideRouteData;

  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-800">Route details</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Store practical route facts for day-trip and road-trip guide layouts.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <SmallField label="Starting point" value={safeRoute.startingPoint} onChange={(startingPoint) => onChange({ ...safeRoute, startingPoint })} />
        <SmallField label="Ending point" value={safeRoute.endingPoint} onChange={(endingPoint) => onChange({ ...safeRoute, endingPoint })} />
        <SmallField label="Distance" value={safeRoute.distance} onChange={(distance) => onChange({ ...safeRoute, distance })} placeholder="170 km" />
        <SmallField label="Travel time" value={safeRoute.travelTime} onChange={(travelTime) => onChange({ ...safeRoute, travelTime })} placeholder="2 hr 30 min" />
        <SmallField label="Best transport" value={safeRoute.bestTransport} onChange={(bestTransport) => onChange({ ...safeRoute, bestTransport })} placeholder="Private driver" />
        <SmallField label="Parking info" value={safeRoute.parkingInfo} onChange={(parkingInfo) => onChange({ ...safeRoute, parkingInfo })} />
      </div>
      <TextAreaField label="Route notes" value={safeRoute.routeNotes} onChange={(routeNotes) => onChange({ ...safeRoute, routeNotes })} />
    </div>
  );
}

function SmallField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectedItemEntityPicker({
  item,
  options,
  matchedOption,
  onSelect,
  onUnmatchedQuery,
}: {
  item: GuideSelectedItem;
  options: SelectedItemOption[];
  matchedOption?: SelectedItemOption;
  onSelect: (option: SelectedItemOption) => void;
  onUnmatchedQuery: (query: string) => void;
}) {
  const [query, setQuery] = useState(() => selectedOptionInputValue(matchedOption, item));
  const listId = `selected-item-options-${item.id || "new"}`;

  useEffect(() => {
    setQuery(selectedOptionInputValue(matchedOption, item));
  }, [item, matchedOption]);

  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-slate-600">Search/select existing item</span>
      <input
        list={listId}
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value;
          const nextOption = findOptionFromQuery(nextQuery, options);
          setQuery(nextQuery);
          if (nextOption) {
            onSelect(nextOption);
          }
        }}
        onBlur={() => {
          if (!query.trim()) {
            onUnmatchedQuery("");
            return;
          }

          const nextOption = findOptionFromQuery(query, options);
          if (nextOption) {
            onSelect(nextOption);
          } else {
            onUnmatchedQuery(query);
          }
        }}
        placeholder={options.length > 0 ? "Search by name, slug, city, or country" : "No items available"}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.id} value={optionInputValue(option)}>
            {optionSearchText(option)}
          </option>
        ))}
      </datalist>
    </label>
  );
}

function SelectedItemPreview({ item, option }: { item: GuideSelectedItem; option?: SelectedItemOption }) {
  if (!option) {
    const reference = selectedItemReference(item);
    return reference ? (
      <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
        No existing {item.type} matched for &quot;{reference}&quot;. The item can still be saved as draft.
      </div>
    ) : null;
  }

  const imageStyle = option.image
    ? {
        backgroundImage: `url("${option.image}")`,
      }
    : undefined;

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[84px_minmax(0,1fr)]">
      <div
        className="flex aspect-[4/3] items-center justify-center rounded-lg bg-slate-200 bg-cover bg-center text-xs font-semibold text-slate-500"
        style={imageStyle}
        aria-label={option.imageAlt || option.label}
      >
        {option.image ? null : option.badge || item.type}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">{option.label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {[option.city, option.country, option.slug].filter(Boolean).join(" - ")}
        </p>
        {option.href ? (
          <a
            href={option.href}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex max-w-full truncate text-xs font-semibold text-[#1D4ED8] hover:text-[#0A2A66]"
          >
            {option.href}
          </a>
        ) : null}
      </div>
    </div>
  );
}

function newSelectedItem(displayOrder: number): GuideSelectedItem {
  return {
    id: `selected-item-${Date.now()}`,
    type: "destination",
    itemId: "",
    itemSlug: "",
    itemName: "",
    city: "",
    displayOrder,
    customTitle: "",
    customSummary: "",
    bestFor: "",
    suggestedTime: "",
    nearbyPlaces: [],
    readMoreLabel: "",
  };
}

function newItineraryItem(displayOrder: number): GuideItineraryItem {
  return {
    id: `itinerary-${Date.now()}`,
    dayNumber: 1,
    timeSlot: "",
    placeTitle: "",
    destinationId: "",
    details: "",
    travelTime: "",
    displayOrder,
  };
}

function updateSelectedItem(
  items: GuideSelectedItem[],
  index: number,
  patch: Partial<GuideSelectedItem>,
  onChange: (items: GuideSelectedItem[]) => void,
) {
  onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
}

function moveSelectedItem(items: GuideSelectedItem[], fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return withDisplayOrder(nextItems);
}

function duplicateSelectedItem(items: GuideSelectedItem[], index: number) {
  const source = items[index];
  if (!source) {
    return items;
  }

  const duplicate: GuideSelectedItem = {
    ...source,
    id: `selected-item-${Date.now()}`,
    displayOrder: index + 2,
  };
  const nextItems = [...items.slice(0, index + 1), duplicate, ...items.slice(index + 1)];
  return withDisplayOrder(nextItems);
}

function withDisplayOrder(items: GuideSelectedItem[]) {
  return items.map((item, index) => ({ ...item, displayOrder: index + 1 }));
}

function updateItineraryItem(
  items: GuideItineraryItem[],
  index: number,
  patch: Partial<GuideItineraryItem>,
  onChange: (items: GuideItineraryItem[]) => void,
) {
  onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
}

function selectedItemReference(item: GuideSelectedItem) {
  return item.itemSlug || item.itemId || item.itemName || item.customTitle;
}

function optionsForType(options: SelectedItemOptions, type: GuideSelectedItemType) {
  return options[type] || [];
}

function selectedItemPatchFromOption(item: GuideSelectedItem, option: SelectedItemOption): Partial<GuideSelectedItem> {
  return {
    itemId: option.id,
    itemSlug: option.slug || "",
    itemName: option.label,
    city: option.city || "",
    customTitle: item.customTitle || "",
  };
}

function resolveSelectedItemForStorage(item: GuideSelectedItem, options: SelectedItemOptions): GuideSelectedItem {
  const option = findMatchingOption(item, optionsForType(options, item.type));
  return option
    ? {
        ...item,
        itemId: option.id,
        itemSlug: item.itemSlug || option.slug || "",
        itemName: item.itemName || option.label,
        city: item.city || option.city || "",
      }
    : item;
}

function findMatchingOption(item: GuideSelectedItem, options: SelectedItemOption[]) {
  const candidates = [item.itemId, item.itemSlug, item.itemName, item.customTitle].filter(isNonEmptyString);
  const requestedCity = normalizeSearchText(item.city || "");

  for (const candidate of candidates) {
    const matches = options.filter((option) => optionSearchValues(option).some((value) => value === normalizeSearchText(candidate)));
    const cityMatch = requestedCity
      ? matches.find((option) => optionSearchValues(option).some((value) => value === requestedCity))
      : matches[0];

    if (cityMatch) {
      return cityMatch;
    }
  }

  return undefined;
}

function findOptionFromQuery(query: string, options: SelectedItemOption[]) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return undefined;
  }

  return options.find((option) => optionSearchValues(option).some((value) => value === normalizedQuery));
}

function optionInputValue(option: SelectedItemOption) {
  return [option.label, option.slug, option.city, option.country].filter(Boolean).join(" - ");
}

function selectedOptionInputValue(option: SelectedItemOption | undefined, item: GuideSelectedItem) {
  return option ? optionInputValue(option) : selectedItemReference(item);
}

function optionSearchText(option: SelectedItemOption) {
  return [option.label, option.slug, option.city, option.country, option.meta].filter(Boolean).join(" ");
}

function optionSearchValues(option: SelectedItemOption) {
  return Array.from(
    new Set(
      [option.id, option.slug, option.label, option.city, option.country, option.meta, optionInputValue(option)]
        .flatMap((value) => String(value || "").split(/\s+-\s+|,/))
        .map(normalizeSearchText)
        .filter(Boolean),
    ),
  );
}

function selectedItemWarnings(
  item: GuideSelectedItem,
  matchedOption: SelectedItemOption | undefined,
  duplicateDestinationKeys: Set<string>,
): SelectedItemWarning[] {
  const warnings: SelectedItemWarning[] = [];
  const reference = selectedItemReference(item);
  const duplicateKey = selectedDestinationKey(item, matchedOption);

  if (item.type === "destination" && reference && !matchedOption) {
    warnings.push({
      key: "unmatched-destination",
      tone: "warning",
      message: `Selected destination is not matched: ${reference}`,
    });
  }

  if (reference && !item.customSummary) {
    warnings.push({
      key: "missing-summary",
      tone: "warning",
      message: `Selected item needs a fresh custom summary: ${reference}`,
    });
  }

  if (item.type === "destination" && duplicateKey && duplicateDestinationKeys.has(duplicateKey)) {
    warnings.push({
      key: "duplicate-destination",
      tone: "warning",
      message: `Duplicate selected destination: ${matchedOption?.label || reference}`,
    });
  }

  return warnings;
}

function duplicateSelectedDestinationKeys(items: GuideSelectedItem[], options: SelectedItemOptions) {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.type !== "destination") {
      continue;
    }

    const key = selectedDestinationKey(item, findMatchingOption(item, optionsForType(options, item.type)));
    if (key) {
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  return new Set(Array.from(counts).filter(([, count]) => count > 1).map(([key]) => key));
}

function selectedDestinationKey(item: GuideSelectedItem, option?: SelectedItemOption) {
  return normalizeSearchText(option?.id || option?.slug || item.itemId || item.itemSlug || item.itemName || "");
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isNonEmptyString(value: string | undefined): value is string {
  return Boolean(value);
}

function splitList(value: string) {
  return value
    .split(/,|\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}
