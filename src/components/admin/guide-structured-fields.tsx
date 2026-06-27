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
};

export type SelectedItemOption = {
  id: string;
  label: string;
  slug?: string;
  city?: string;
  country?: string;
  category?: string;
  status?: string;
  meta?: string;
  image?: string;
  imageAlt?: string;
  href?: string;
  badge?: string;
};

export type SelectedItemOptions = Partial<Record<GuideSelectedItemType, SelectedItemOption[]>>;

type GuideSelectedItemsFieldProps = {
  defaultSelectedItems?: GuideSelectedItem[];
  selectedItemOptions: SelectedItemOptions;
};

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

const manualSelectedItemTypeOptions = selectedItemTypeOptions.filter((option) =>
  ["destination", "city", "guide", "restaurant", "activity"].includes(option.value),
);

export function GuideStructuredFields({
  defaultGuideType,
  defaultGuideData,
}: GuideStructuredFieldsProps) {
  const [guideType, setGuideType] = useState<GuideType>(() => normalizeGuideType(defaultGuideType));
  const [guideData, setGuideData] = useState<GuideData>(() => normalizeGuideData(defaultGuideData));
  const normalizedData = useMemo(() => normalizeGuideData(guideData), [guideData]);

  useEffect(() => {
    const handleImport = (event: Event) => {
      const detail = (event as CustomEvent<{
        guideType?: GuideType;
        guideData?: GuideData;
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
    };

    window.addEventListener("guide-structured-import", handleImport);
    return () => window.removeEventListener("guide-structured-import", handleImport);
  }, []);

  return (
    <div className="grid gap-5">
      <input type="hidden" name="guideData" value={JSON.stringify(normalizedData)} />

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
        </>
      ) : null}
    </div>
  );
}

export function GuideSelectedItemsField({
  defaultSelectedItems,
  selectedItemOptions,
}: GuideSelectedItemsFieldProps) {
  const [selectedItems, setSelectedItems] = useState<GuideSelectedItem[]>(() =>
    normalizeGuideSelectedItems(defaultSelectedItems),
  );
  const selectedItemsForStorage = useMemo(
    () => normalizeGuideSelectedItems(selectedItems.map((item) => resolveSelectedItemForStorage(item, selectedItemOptions))),
    [selectedItemOptions, selectedItems],
  );

  useEffect(() => {
    const handleImport = (event: Event) => {
      const detail = (event as CustomEvent<{ selectedItems?: GuideSelectedItem[] }>).detail;

      if (detail?.selectedItems) {
        setSelectedItems(normalizeGuideSelectedItems(detail.selectedItems));
      }
    };

    window.addEventListener("guide-structured-import", handleImport);
    return () => window.removeEventListener("guide-structured-import", handleImport);
  }, []);

  return (
    <div className="grid gap-5">
      <input type="hidden" name="guideSelectedItems" value={JSON.stringify(selectedItemsForStorage)} />
      <SelectedItemsEditor
        title="Selected reusable items"
        items={selectedItems}
        options={selectedItemOptions}
        onChange={setSelectedItems}
      />
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
  const [filters, setFilters] = useState({
    type: "destination" as GuideSelectedItemType,
    country: "",
    city: "",
    category: "",
    status: "",
    search: "",
  });
  const selectableOptions = useMemo(() => filterTypedOptions(allTypedOptions(options), filters), [filters, options]);
  const selectedKeys = useMemo(
    () => new Set(items.map((item) => selectedItemOptionKey(item, findMatchingOption(item, optionsForType(options, item.type))))),
    [items, options],
  );
  const filterChoices = useMemo(() => optionFilterChoices(allTypedOptions(options), filters.type), [filters.type, options]);

  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Select existing records, then write fresh guide text for each card.
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

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Add from existing records</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Filter the list, then select items to add cards below.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <SelectField
            label="Item type"
            value={filters.type}
            onChange={(type) =>
              setFilters((current) => ({
                ...current,
                type: type as GuideSelectedItemType,
                country: "",
                city: "",
                category: "",
                status: "",
              }))
            }
            options={manualSelectedItemTypeOptions}
          />
          <FilterSelect label="Country" value={filters.country} values={filterChoices.countries} onChange={(country) => setFilters((current) => ({ ...current, country }))} />
          <FilterSelect label="City" value={filters.city} values={filterChoices.cities} onChange={(city) => setFilters((current) => ({ ...current, city }))} />
          <FilterSelect label="Category" value={filters.category} values={filterChoices.categories} onChange={(category) => setFilters((current) => ({ ...current, category }))} />
          <FilterSelect label="Status" value={filters.status} values={filterChoices.statuses} onChange={(status) => setFilters((current) => ({ ...current, status }))} />
          <label className="grid gap-2">
            <span className="text-xs font-semibold text-slate-600">Search text</span>
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search by name, city, or category"
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>
        <div className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 md:grid-cols-2">
          {selectableOptions.length > 0 ? (
            selectableOptions.map(({ type, option }) => {
              const key = typedOptionKey(type, option);
              const checked = selectedKeys.has(key);

              return (
                <label key={key} className="flex gap-3 rounded-lg border border-slate-100 bg-white p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      checked
                        ? onChange(items.filter((item) => selectedItemOptionKey(item, findMatchingOption(item, optionsForType(options, item.type))) !== key))
                        : onChange([...items, newSelectedItemFromOption(type, option, items.length + 1)])
                    }
                    className="mt-1"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-800">{option.label}</span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {[option.city, option.country, option.category, option.status].filter(Boolean).join(" - ") || option.slug}
                    </span>
                  </span>
                </label>
              );
            })
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
              No matching records found.
            </p>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No structured selected items yet.
        </div>
      ) : null}

      {items.map((item, index) => {
        const itemOptions = optionsForType(options, item.type);
        const matchedOption = findMatchingOption(item, itemOptions);
        const warnings = selectedItemWarnings(item, matchedOption, itemOptions, duplicateDestinationKeys);

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
                      country: "",
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
          <div className="grid gap-3 md:grid-cols-3">
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
          <SmallField
            label="Place title"
            value={item.placeTitle}
            onChange={(placeTitle) => updateItineraryItem(items, index, { placeTitle }, onChange)}
            placeholder="Mutrah Corniche"
          />
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

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterSelect({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
      >
        <option value="">All</option>
        {values.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

function SelectedItemEntityPicker({
  item,
  options,
  matchedOption,
  onSelect,
}: {
  item: GuideSelectedItem;
  options: SelectedItemOption[];
  matchedOption?: SelectedItemOption;
  onSelect: (option: SelectedItemOption) => void;
}) {
  const [query, setQuery] = useState(() => selectedOptionInputValue(matchedOption, item));
  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) {
      return options.slice(0, 8);
    }

    return options
      .filter((option) => normalizeSearchText(optionSearchText(option)).includes(normalizedQuery))
      .slice(0, 8);
  }, [options, query]);

  useEffect(() => {
    setQuery(selectedOptionInputValue(matchedOption, item));
  }, [item, matchedOption]);

  return (
    <div className="grid gap-2">
      <span className="text-xs font-semibold text-slate-600">Selected reusable item</span>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={options.length > 0 ? "Search by name, slug, city, or country" : "No items available"}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
      />
      <div className="grid max-h-48 gap-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => {
            const selected = matchedOption?.id === option.id;

            return (
              <button
                key={option.id}
                type="button"
                className={
                  selected
                    ? "rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-left text-xs font-semibold text-[#0A2A66]"
                    : "rounded-md border border-transparent px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:border-slate-200 hover:bg-slate-50"
                }
                onClick={() => onSelect(option)}
              >
                <span className="block truncate">{option.label}</span>
                <span className="mt-0.5 block truncate font-normal text-slate-500">
                  {[option.city, option.country, option.category, option.status, option.slug].filter(Boolean).join(" - ")}
                </span>
              </button>
            );
          })
        ) : (
          <span className="px-3 py-2 text-xs text-slate-500">No matching records found.</span>
        )}
      </div>
    </div>
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
    country: "",
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
    country: option.country || "",
    customTitle: item.customTitle || "",
  };
}

function newSelectedItemFromOption(
  type: GuideSelectedItemType,
  option: SelectedItemOption,
  displayOrder: number,
): GuideSelectedItem {
  return {
    ...newSelectedItem(displayOrder),
    type,
    itemId: option.id,
    itemSlug: option.slug || "",
    itemName: option.label,
    city: option.city || "",
    country: option.country || "",
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
        country: item.country || option.country || "",
      }
    : item;
}

function findMatchingOption(item: GuideSelectedItem, options: SelectedItemOption[]) {
  const result = findMatchingOptions(item, options);
  return result.matches.length === 1 ? result.matches[0] : undefined;
}

function optionInputValue(option: SelectedItemOption) {
  return [option.label, option.slug, option.city, option.country].filter(Boolean).join(" - ");
}

function selectedOptionInputValue(option: SelectedItemOption | undefined, item: GuideSelectedItem) {
  return option ? optionInputValue(option) : selectedItemReference(item);
}

function optionSearchText(option: SelectedItemOption) {
  return [option.label, option.slug, option.city, option.country, option.category, option.status, option.meta]
    .filter(Boolean)
    .join(" ");
}

function findMatchingOptions(item: GuideSelectedItem, options: SelectedItemOption[]) {
  const requestedId = normalizeSearchText(item.itemId || "");
  const requestedSlug = normalizeSearchText(item.itemSlug || "");
  const requestedName = normalizeSearchText(item.itemName || item.customTitle || "");
  const requestedCity = normalizeSearchText(item.city || "");
  const requestedCountry = normalizeSearchText(item.country || "");
  const exactIdMatches = requestedId ? options.filter((option) => normalizeSearchText(option.id) === requestedId) : [];

  if (exactIdMatches.length > 0) {
    return { matches: exactIdMatches, ambiguous: exactIdMatches.length > 1 };
  }

  const exactSlugMatches = requestedSlug ? options.filter((option) => normalizeSearchText(option.slug || "") === requestedSlug) : [];

  if (exactSlugMatches.length > 0) {
    return { matches: exactSlugMatches, ambiguous: exactSlugMatches.length > 1 };
  }

  const nameMatches = requestedName ? options.filter((option) => normalizeSearchText(option.label) === requestedName) : [];

  if (requestedCity && nameMatches.length > 0) {
    const cityMatches = nameMatches.filter((option) => normalizeSearchText(option.city || "") === requestedCity);
    if (cityMatches.length > 0) {
      return { matches: cityMatches, ambiguous: cityMatches.length > 1 };
    }
  }

  if (requestedCountry && nameMatches.length > 0) {
    const countryMatches = nameMatches.filter((option) => normalizeSearchText(option.country || "") === requestedCountry);
    if (countryMatches.length > 0) {
      return { matches: countryMatches, ambiguous: countryMatches.length > 1 };
    }
  }

  if (nameMatches.length > 0) {
    return { matches: nameMatches, ambiguous: nameMatches.length > 1 };
  }

  return { matches: [] as SelectedItemOption[], ambiguous: false };
}

function allTypedOptions(options: SelectedItemOptions) {
  return manualSelectedItemTypeOptions.flatMap(({ value }) =>
    optionsForType(options, value).map((option) => ({
      type: value,
      option,
    })),
  );
}

function filterTypedOptions(
  options: Array<{ type: GuideSelectedItemType; option: SelectedItemOption }>,
  filters: {
    type: GuideSelectedItemType;
    country: string;
    city: string;
    category: string;
    status: string;
    search: string;
  },
) {
  const normalizedSearch = normalizeSearchText(filters.search);

  return options
    .filter(({ type }) => type === filters.type)
    .filter(({ option }) => !filters.country || option.country === filters.country)
    .filter(({ option }) => !filters.city || option.city === filters.city)
    .filter(({ option }) => !filters.category || option.category === filters.category)
    .filter(({ option }) => !filters.status || option.status === filters.status)
    .filter(({ option }) => !normalizedSearch || normalizeSearchText(optionSearchText(option)).includes(normalizedSearch))
    .slice(0, 80);
}

function optionFilterChoices(
  options: Array<{ type: GuideSelectedItemType; option: SelectedItemOption }>,
  type: GuideSelectedItemType,
) {
  const filtered = options.filter((item) => item.type === type).map((item) => item.option);

  return {
    countries: uniqueSorted(filtered.map((option) => option.country)),
    cities: uniqueSorted(filtered.map((option) => option.city)),
    categories: uniqueSorted(filtered.map((option) => option.category)),
    statuses: uniqueSorted(filtered.map((option) => option.status)),
  };
}

function uniqueSorted(values: Array<string | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))).sort(
    (a, b) => a.localeCompare(b),
  );
}

function typedOptionKey(type: GuideSelectedItemType, option: SelectedItemOption) {
  return `${type}:${option.id}`;
}

function selectedItemOptionKey(item: GuideSelectedItem, option?: SelectedItemOption) {
  return option ? typedOptionKey(item.type, option) : `${item.type}:${item.itemId || item.itemSlug || item.itemName || item.id}`;
}

function selectedItemWarnings(
  item: GuideSelectedItem,
  matchedOption: SelectedItemOption | undefined,
  itemOptions: SelectedItemOption[],
  duplicateDestinationKeys: Set<string>,
): SelectedItemWarning[] {
  const warnings: SelectedItemWarning[] = [];
  const reference = selectedItemReference(item);
  const duplicateKey = selectedDestinationKey(item, matchedOption);
  const matchResult = findMatchingOptions(item, itemOptions);

  if (reference && !matchedOption) {
    warnings.push({
      key: "unmatched-item",
      tone: "warning",
      message: `Selected item is not matched to an existing record: ${reference}`,
    });
  }

  if (matchResult.ambiguous) {
    warnings.push({
      key: "ambiguous-item",
      tone: "warning",
      message: `Multiple records match "${reference}". Please select the correct item manually.`,
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

function splitList(value: string) {
  return value
    .split(/,|\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}
