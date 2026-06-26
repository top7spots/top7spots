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
}: GuideStructuredFieldsProps) {
  const [guideType, setGuideType] = useState<GuideType>(() => normalizeGuideType(defaultGuideType));
  const [guideData, setGuideData] = useState<GuideData>(() => normalizeGuideData(defaultGuideData));
  const [selectedItems, setSelectedItems] = useState<GuideSelectedItem[]>(() =>
    normalizeGuideSelectedItems(defaultSelectedItems),
  );
  const normalizedData = useMemo(() => normalizeGuideData(guideData), [guideData]);
  const normalizedSelectedItems = useMemo(
    () => normalizeGuideSelectedItems(selectedItems),
    [selectedItems],
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
      <input type="hidden" name="guideSelectedItems" value={JSON.stringify(normalizedSelectedItems)} />

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
  onChange,
}: {
  title: string;
  items: GuideSelectedItem[];
  onChange: (items: GuideSelectedItem[]) => void;
}) {
  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Add ordered cards or stops. Use existing item IDs/slugs where possible.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2A66] shadow-sm transition hover:border-[#2563EB] hover:bg-blue-50"
          onClick={() => onChange([...items, newSelectedItem(items.length + 1)])}
        >
          Add item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No structured selected items yet.
        </div>
      ) : null}

      {items.map((item, index) => (
        <div key={item.id} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
              Item {index + 1}
            </p>
            <button
              type="button"
              className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              Remove
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-xs font-semibold text-slate-600">Item type</span>
              <select
                value={item.type}
                onChange={(event) => updateSelectedItem(items, index, { type: event.target.value as GuideSelectedItemType }, onChange)}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
              >
                {selectedItemTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <SmallField
              label="Item ID or slug"
              value={item.itemId}
              onChange={(itemId) => updateSelectedItem(items, index, { itemId }, onChange)}
              placeholder="mutrah-corniche"
            />
            <SmallField
              label="Display order"
              value={String(item.displayOrder || index + 1)}
              onChange={(displayOrder) => updateSelectedItem(items, index, { displayOrder: Number(displayOrder) || index + 1 }, onChange)}
              type="number"
            />
          </div>

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
      ))}
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

function newSelectedItem(displayOrder: number): GuideSelectedItem {
  return {
    id: `selected-item-${Date.now()}`,
    type: "destination",
    itemId: "",
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

function updateItineraryItem(
  items: GuideItineraryItem[],
  index: number,
  patch: Partial<GuideItineraryItem>,
  onChange: (items: GuideItineraryItem[]) => void,
) {
  onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
}

function splitList(value: string) {
  return value
    .split(/,|\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}
