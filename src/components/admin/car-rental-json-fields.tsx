"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Search, Trash2 } from "lucide-react";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CarRentalDirectoryGroup, CarRentalLinkCard, CarRentalVehicleCategoryCard, ContentStatus } from "@/lib/types";

export type CardSuggestion = CarRentalLinkCard & {
  id?: string;
  meta?: string;
  slug?: string;
  language?: string;
  status?: ContentStatus;
  sourceType?: "car-rental-page" | "guide" | "city" | "destination";
};

export type DirectorySuggestion = {
  text: string;
  url: string;
  sortOrder: number;
  meta?: string;
  status?: ContentStatus;
  sourceType?: "car-rental-page" | "guide" | "city" | "destination";
};

type JsonFieldProps = {
  label: string;
  name: string;
  defaultValue: string;
  rows?: number;
  helperText?: string;
  example?: string;
};

type CardSelectorProps = {
  label: string;
  name: string;
  defaultValue: string;
  suggestions: CardSuggestion[];
  helperText: string;
  example: string;
  searchPlaceholder: string;
  autoFillLabel?: string;
  emptyAutoFillMessage?: string;
  includeDraftsControl?: boolean;
};

type VehicleCategoryEditorCard = CarRentalVehicleCategoryCard & {
  editorId: string;
};

export function CarRentalJsonTextarea({
  label,
  name,
  defaultValue,
  rows = 8,
  helperText,
  example,
}: JsonFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const validation = validateJson(value, "array");

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={rows}
        aria-invalid={!validation.valid}
        className="font-mono text-xs"
      />
      {!validation.valid ? <p className="text-xs font-medium text-red-600">{validation.message}</p> : null}
      {helperText ? <p className="text-xs leading-5 text-slate-500">{helperText}</p> : null}
      {example ? <ExampleJson example={example} /> : null}
    </div>
  );
}

export function PopularLocationCardsField({
  defaultValue,
  suggestions,
  example,
}: {
  defaultValue: string;
  suggestions: CardSuggestion[];
  example: string;
}) {
  return (
    <CardSelectorField
      label="Popular location cards"
      name="popularLocationCards"
      defaultValue={defaultValue}
      suggestions={suggestions}
      helperText="Select existing car rental pages from the same country. Cards remain editable after auto-fill."
      example={example}
      searchPlaceholder="Search car rental pages by title, slug, language, or status"
      autoFillLabel="Auto-fill from car rental pages"
      emptyAutoFillMessage="No matching car rental pages were found for this page context."
      includeDraftsControl
    />
  );
}

export function GuideCardsField({
  defaultValue,
  suggestions,
  example,
}: {
  defaultValue: string;
  suggestions: CardSuggestion[];
  example: string;
}) {
  return (
    <CardSelectorField
      label="Guide cards"
      name="guideCards"
      defaultValue={defaultValue}
      suggestions={suggestions}
      helperText="Select related Travel Guides. The saved JSON uses guide title, URL, excerpt, category label, and sort order."
      example={example}
      searchPlaceholder="Search guides by title, city, country, category, or status"
      autoFillLabel="Auto-fill related guides"
      emptyAutoFillMessage="No related travel guides were found yet. You can keep using the Advanced JSON Editor."
    />
  );
}

export function DestinationCardsField({
  defaultValue,
  suggestions,
  example,
}: {
  defaultValue: string;
  suggestions: CardSuggestion[];
  example: string;
}) {
  return (
    <CardSelectorField
      label="Destination cards"
      name="destinationCards"
      defaultValue={defaultValue}
      suggestions={suggestions}
      helperText="Select cities and destinations together. The type badge is saved as the card label, with images left optional."
      example={example}
      searchPlaceholder="Search cities and destinations by name, country, city, or type"
    />
  );
}

export function VehicleCategoryCardsField({
  defaultValue,
  example,
}: {
  defaultValue: string;
  example: string;
}) {
  const initialCards = parseVehicleCategoryCards(defaultValue);
  const [cards, setCards] = useState<VehicleCategoryEditorCard[]>(() => withVehicleEditorIds(initialCards.items));
  const [advancedValue, setAdvancedValue] = useState(initialCards.valid ? pretty(initialCards.items) : defaultValue);
  const [advancedError, setAdvancedError] = useState(initialCards.valid ? "" : initialCards.message);
  const jsonValue = pretty(normalizeVehicleCategoryCards(cards));

  function syncCards(nextCards: VehicleCategoryEditorCard[]) {
    const normalized = normalizeVehicleCategoryEditorCards(nextCards);
    setCards(normalized);
    setAdvancedValue(pretty(normalizeVehicleCategoryCards(normalized)));
    setAdvancedError("");
  }

  function addCard() {
    syncCards([
      ...cards,
      {
        title: "",
        image: "",
        startingPrice: "",
        buttonText: "Find Available Cars",
        sortOrder: cards.length,
        visible: true,
        editorId: newVehicleEditorId(),
      },
    ]);
  }

  function updateCard(index: number, patch: Partial<CarRentalVehicleCategoryCard>) {
    syncCards(cards.map((card, cardIndex) => (cardIndex === index ? { ...card, ...patch } : card)));
  }

  function removeCard(index: number) {
    syncCards(cards.filter((_, cardIndex) => cardIndex !== index));
  }

  function moveCard(index: number, direction: -1 | 1) {
    syncCards(moveItem(cards, index, direction));
  }

  function handleAdvancedChange(value: string) {
    setAdvancedValue(value);
    const parsed = parseVehicleCategoryCards(value);
    if (!parsed.valid) {
      setAdvancedError(parsed.message);
      return;
    }

    setAdvancedError("");
    setCards(withVehicleEditorIds(parsed.items));
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <input type="hidden" name="vehicleCategoryCards" value={jsonValue} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Label>Vehicle Category Cards</Label>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Manage the vehicle cards shown on the public car rental page. Card buttons scroll to the DiscoverCars widget.
          </p>
        </div>
        <Button type="button" onClick={addCard} className="rounded-full bg-[#0A2A66] text-white hover:bg-[#1D4ED8]">
          <Plus className="size-4" aria-hidden="true" />
          Add Vehicle Category
        </Button>
      </div>

      <div className="grid gap-4">
        {cards.map((card, index) => (
          <VehicleCategoryCardEditor
            key={card.editorId}
            card={card}
            index={index}
            count={cards.length}
            onChange={updateCard}
            onRemove={removeCard}
            onMove={moveCard}
          />
        ))}
        {cards.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            No vehicle categories yet. Add one to show this section on the public page.
          </p>
        ) : null}
      </div>

      <AdvancedJsonEditor
        value={advancedValue}
        rows={8}
        example={example}
        error={advancedError}
        onChange={handleAdvancedChange}
      />
    </div>
  );
}

export function DirectoryGroupsField({
  defaultValue,
  airportSuggestions,
  locationSuggestions,
  linkSuggestions,
  example,
}: {
  defaultValue: string;
  airportSuggestions: DirectorySuggestion[];
  locationSuggestions: DirectorySuggestion[];
  linkSuggestions: DirectorySuggestion[];
  example: string;
}) {
  const initialGroups = parseGroups(defaultValue);
  const [groups, setGroups] = useState<CarRentalDirectoryGroup[]>(initialGroups.items);
  const [advancedValue, setAdvancedValue] = useState(initialGroups.valid ? pretty(initialGroups.items) : defaultValue);
  const [advancedError, setAdvancedError] = useState(initialGroups.valid ? "" : initialGroups.message);
  const [query, setQuery] = useState("");
  const [includeDrafts, setIncludeDrafts] = useState(true);
  const [message, setMessage] = useState("");
  const jsonValue = pretty(normalizeGroups(groups));
  const visibleSuggestions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const existingUrls = new Set(groups.flatMap((group) => group.links.map((link) => link.url)));
    return linkSuggestions
      .filter((item) => !existingUrls.has(item.url))
      .filter((item) => {
        if (!needle) {
          return true;
        }

        return searchText(item.text, item.url, item.meta, item.status, item.sourceType).includes(needle);
      })
      .slice(0, 12);
  }, [groups, linkSuggestions, query]);

  function syncGroups(nextGroups: CarRentalDirectoryGroup[], nextMessage = "") {
    const normalized = normalizeGroups(nextGroups);
    setGroups(normalized);
    setAdvancedValue(pretty(normalized));
    setAdvancedError("");
    setMessage(nextMessage);
  }

  function autoFill() {
    const airports = airportSuggestions.filter((item) => includeDrafts || item.status === "published");
    const locations = locationSuggestions.filter((item) => includeDrafts || item.status === "published");
    const nextGroups: CarRentalDirectoryGroup[] = [
      {
        title: "Airports",
        sortOrder: 0,
        links: airports.map((item, index) => ({ text: item.text, url: item.url, sortOrder: index })),
      },
      {
        title: "Popular Locations",
        sortOrder: 1,
        links: locations.map((item, index) => ({ text: item.text, url: item.url, sortOrder: index })),
      },
    ].filter((group) => group.links.length > 0);

    if (nextGroups.length === 0) {
      setMessage("No matching car rental pages were found for directory links.");
      return;
    }

    syncGroups(nextGroups, "Directory groups added. Review, reorder, or add more links before saving.");
  }

  function addGroup(title: string) {
    const cleanedTitle = title.trim();
    if (!cleanedTitle) {
      return;
    }

    syncGroups([
      ...groups,
      {
        title: cleanedTitle,
        sortOrder: groups.length,
        links: [],
      },
    ]);
  }

  function addLink(groupIndex: number, suggestion: DirectorySuggestion) {
    syncGroups(
      groups.map((group, index) =>
        index === groupIndex
          ? {
              ...group,
              links: [
                ...group.links,
                {
                  text: suggestion.text,
                  url: suggestion.url,
                  sortOrder: group.links.length,
                },
              ],
            }
          : group,
      ),
    );
  }

  function updateGroup(groupIndex: number, nextGroup: CarRentalDirectoryGroup) {
    syncGroups(groups.map((group, index) => (index === groupIndex ? nextGroup : group)));
  }

  function removeGroup(groupIndex: number) {
    syncGroups(groups.filter((_, index) => index !== groupIndex));
  }

  function moveGroup(groupIndex: number, direction: -1 | 1) {
    syncGroups(moveItem(groups, groupIndex, direction));
  }

  function handleAdvancedChange(value: string) {
    setAdvancedValue(value);
    const parsed = parseGroups(value);
    if (!parsed.valid) {
      setAdvancedError(parsed.message);
      return;
    }

    setAdvancedError("");
    setGroups(parsed.items);
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <input type="hidden" name="directoryGroups" value={jsonValue} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Label>Directory groups / simple text listings</Label>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Create text-link groups for airports, popular locations, cities, destinations, guides, or custom related links.
          </p>
        </div>
        <Button type="button" onClick={autoFill} className="rounded-full bg-[#0A2A66] text-white hover:bg-[#1D4ED8]">
          Auto-fill directory
        </Button>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={includeDrafts}
          onChange={(event) => setIncludeDrafts(event.target.checked)}
          className="size-4 rounded border-slate-300 text-[#1D4ED8]"
        />
        Include draft pages
      </label>
      {message ? <p className="text-sm font-medium text-slate-600">{message}</p> : null}

      <DirectoryGroupCreator onAdd={addGroup} />

      <div className="grid gap-3">
        {groups.map((group, groupIndex) => (
          <DirectoryGroupEditor
            key={`${group.title}-${groupIndex}`}
            group={group}
            groupIndex={groupIndex}
            groupCount={groups.length}
            suggestions={visibleSuggestions}
            query={query}
            onQueryChange={setQuery}
            onAddLink={addLink}
            onUpdateGroup={updateGroup}
            onRemoveGroup={removeGroup}
            onMoveGroup={moveGroup}
          />
        ))}
        {groups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            No directory groups selected yet. Auto-fill the default groups or create one manually.
          </p>
        ) : null}
      </div>

      <AdvancedJsonEditor
        value={advancedValue}
        rows={10}
        example={example}
        error={advancedError}
        onChange={handleAdvancedChange}
      />
    </div>
  );
}

function CardSelectorField({
  label,
  name,
  defaultValue,
  suggestions,
  helperText,
  example,
  searchPlaceholder,
  autoFillLabel,
  emptyAutoFillMessage,
  includeDraftsControl = false,
}: CardSelectorProps) {
  const initialCards = parseCards(defaultValue);
  const [cards, setCards] = useState<CarRentalLinkCard[]>(initialCards.items);
  const [advancedValue, setAdvancedValue] = useState(initialCards.valid ? pretty(initialCards.items) : defaultValue);
  const [advancedError, setAdvancedError] = useState(initialCards.valid ? "" : initialCards.message);
  const [query, setQuery] = useState("");
  const [includeDrafts, setIncludeDrafts] = useState(true);
  const [message, setMessage] = useState("");
  const jsonValue = pretty(normalizeCards(cards));
  const filteredSuggestions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const existingUrls = new Set(cards.map((card) => card.url));
    return suggestions
      .filter((item) => includeDrafts || item.status === "published" || !includeDraftsControl)
      .filter((item) => !existingUrls.has(item.url))
      .filter((item) => {
        if (!needle) {
          return true;
        }

        return searchText(item.title, item.url, item.description, item.label, item.meta, item.slug, item.language, item.status).includes(needle);
      })
      .slice(0, 12);
  }, [cards, includeDrafts, includeDraftsControl, query, suggestions]);

  function syncCards(nextCards: CarRentalLinkCard[], nextMessage = "") {
    const normalized = normalizeCards(nextCards);
    setCards(normalized);
    setAdvancedValue(pretty(normalized));
    setAdvancedError("");
    setMessage(nextMessage);
  }

  function autoFill() {
    const nextCards = suggestions
      .filter((item) => includeDrafts || item.status === "published" || !includeDraftsControl)
      .map(cardFromSuggestion);

    if (nextCards.length === 0) {
      setMessage(emptyAutoFillMessage || "No matching records were found.");
      return;
    }

    syncCards(nextCards, `${nextCards.length} ${nextCards.length === 1 ? "item" : "items"} added. Review and edit before saving.`);
  }

  function addCard(suggestion: CardSuggestion) {
    syncCards([...cards, { ...cardFromSuggestion(suggestion), sortOrder: cards.length }]);
  }

  function updateCard(index: number, patch: Partial<CarRentalLinkCard>) {
    syncCards(cards.map((card, cardIndex) => (cardIndex === index ? { ...card, ...patch } : card)));
  }

  function removeCard(index: number) {
    syncCards(cards.filter((_, cardIndex) => cardIndex !== index));
  }

  function moveCard(index: number, direction: -1 | 1) {
    syncCards(moveItem(cards, index, direction));
  }

  function handleAdvancedChange(value: string) {
    setAdvancedValue(value);
    const parsed = parseCards(value);
    if (!parsed.valid) {
      setAdvancedError(parsed.message);
      return;
    }

    setAdvancedError("");
    setCards(parsed.items);
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <input type="hidden" name={name} value={jsonValue} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Label>{label}</Label>
          <p className="mt-1 text-xs leading-5 text-slate-500">{helperText}</p>
        </div>
        {autoFillLabel ? (
          <Button type="button" onClick={autoFill} className="rounded-full bg-[#0A2A66] text-white hover:bg-[#1D4ED8]">
            {autoFillLabel}
          </Button>
        ) : null}
      </div>
      {includeDraftsControl ? (
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={includeDrafts}
            onChange={(event) => setIncludeDrafts(event.target.checked)}
            className="size-4 rounded border-slate-300 text-[#1D4ED8]"
          />
          Include draft pages
        </label>
      ) : null}
      {message ? <p className="text-sm font-medium text-slate-600">{message}</p> : null}

      <div className="grid gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {filteredSuggestions.map((suggestion) => (
            <SelectorSuggestion key={`${suggestion.url}-${suggestion.title}`} suggestion={suggestion} onAdd={() => addCard(suggestion)} />
          ))}
          {filteredSuggestions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500 md:col-span-2">
              No selectable matches found. Try a different search or use Advanced JSON Editor.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3">
        {cards.map((card, index) => (
          <EditableCardRow
            key={`${card.url}-${index}`}
            card={card}
            index={index}
            count={cards.length}
            onChange={updateCard}
            onRemove={removeCard}
            onMove={moveCard}
          />
        ))}
        {cards.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            Nothing selected yet. Add records from the selector above or paste JSON in the advanced editor.
          </p>
        ) : null}
      </div>

      <AdvancedJsonEditor
        value={advancedValue}
        rows={8}
        example={example}
        error={advancedError}
        onChange={handleAdvancedChange}
      />
    </div>
  );
}

function SelectorSuggestion({ suggestion, onAdd }: { suggestion: CardSuggestion; onAdd: () => void }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="min-w-0">
        <p className="line-clamp-1 text-sm font-semibold text-slate-900">{suggestion.title}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
          {[suggestion.slug, suggestion.language, suggestion.meta, suggestion.status].filter(Boolean).join(" - ") || suggestion.url}
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onAdd} className="shrink-0 rounded-full">
        <Plus className="size-4" aria-hidden="true" />
        Add
      </Button>
    </div>
  );
}

function EditableCardRow({
  card,
  index,
  count,
  onChange,
  onRemove,
  onMove,
}: {
  card: CarRentalLinkCard;
  index: number;
  count: number;
  onChange: (index: number, patch: Partial<CarRentalLinkCard>) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Selected item {index + 1}</p>
        <RowControls
          index={index}
          count={count}
          onMove={onMove}
          onRemove={onRemove}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input value={card.title} onChange={(event) => onChange(index, { title: event.target.value })} placeholder="Title" />
        <Input value={card.url} onChange={(event) => onChange(index, { url: event.target.value })} placeholder="URL" />
        <Input value={card.label} onChange={(event) => onChange(index, { label: event.target.value })} placeholder="Badge / label" />
        <Input
          type="number"
          value={card.sortOrder}
          onChange={(event) => onChange(index, { sortOrder: Number(event.target.value) || 0 })}
          placeholder="Sort order"
        />
      </div>
      <Textarea
        value={card.description}
        onChange={(event) => onChange(index, { description: event.target.value })}
        placeholder="Description"
        rows={2}
      />
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={card.visible !== false}
          onChange={(event) => onChange(index, { visible: event.target.checked })}
          className="size-4 rounded border-slate-300 text-[#1D4ED8]"
        />
        Visible
      </label>
    </div>
  );
}

function VehicleCategoryCardEditor({
  card,
  index,
  count,
  onChange,
  onRemove,
  onMove,
}: {
  card: CarRentalVehicleCategoryCard;
  index: number;
  count: number;
  onChange: (index: number, patch: Partial<CarRentalVehicleCategoryCard>) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}) {
  return (
    <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Vehicle category {index + 1}
        </p>
        <RowControls index={index} count={count} onMove={onMove} onRemove={onRemove} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(240px,340px)_1fr]">
        <ImageUploadField
          fieldName={`vehicleCategoryImage_${index}`}
          label="Vehicle image"
          currentImage={card.image}
        />
        <div className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`vehicle-title-${index}`}>Title</Label>
              <Input
                id={`vehicle-title-${index}`}
                value={card.title}
                onChange={(event) => onChange(index, { title: event.target.value })}
                placeholder="SUVs"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`vehicle-price-${index}`}>Starting price</Label>
              <Input
                id={`vehicle-price-${index}`}
                value={card.startingPrice}
                onChange={(event) => onChange(index, { startingPrice: event.target.value })}
                placeholder="$40/day"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`vehicle-button-${index}`}>Button text</Label>
              <Input
                id={`vehicle-button-${index}`}
                value={card.buttonText}
                onChange={(event) => onChange(index, { buttonText: event.target.value })}
                placeholder="Find Cars"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`vehicle-order-${index}`}>Sort order</Label>
              <Input
                id={`vehicle-order-${index}`}
                type="number"
                value={card.sortOrder}
                onChange={(event) => onChange(index, { sortOrder: Number(event.target.value) || 0 })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={card.visible !== false}
              onChange={(event) => onChange(index, { visible: event.target.checked })}
              className="size-4 rounded border-slate-300 text-[#1D4ED8]"
            />
            Visible
          </label>
        </div>
      </div>
    </div>
  );
}

function DirectoryGroupCreator({ onAdd }: { onAdd: (title: string) => void }) {
  const [customTitle, setCustomTitle] = useState("");

  function add(title: string) {
    onAdd(title);
    setCustomTitle("");
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <Button type="button" variant="outline" className="rounded-full" onClick={() => add("Airports")}>
        Add Airports
      </Button>
      <Button type="button" variant="outline" className="rounded-full" onClick={() => add("Popular Locations")}>
        Add Popular Locations
      </Button>
      <Input
        value={customTitle}
        onChange={(event) => setCustomTitle(event.target.value)}
        placeholder="Custom group title"
        className="min-w-[220px] flex-1"
      />
      <Button type="button" variant="outline" className="rounded-full" onClick={() => add(customTitle)}>
        Add Custom
      </Button>
    </div>
  );
}

function DirectoryGroupEditor({
  group,
  groupIndex,
  groupCount,
  suggestions,
  query,
  onQueryChange,
  onAddLink,
  onUpdateGroup,
  onRemoveGroup,
  onMoveGroup,
}: {
  group: CarRentalDirectoryGroup;
  groupIndex: number;
  groupCount: number;
  suggestions: DirectorySuggestion[];
  query: string;
  onQueryChange: (value: string) => void;
  onAddLink: (groupIndex: number, suggestion: DirectorySuggestion) => void;
  onUpdateGroup: (groupIndex: number, group: CarRentalDirectoryGroup) => void;
  onRemoveGroup: (groupIndex: number) => void;
  onMoveGroup: (groupIndex: number, direction: -1 | 1) => void;
}) {
  function updateLink(linkIndex: number, patch: Partial<CarRentalDirectoryGroup["links"][number]>) {
    onUpdateGroup(groupIndex, {
      ...group,
      links: group.links.map((link, index) => (index === linkIndex ? { ...link, ...patch } : link)),
    });
  }

  function removeLink(linkIndex: number) {
    onUpdateGroup(groupIndex, {
      ...group,
      links: group.links.filter((_, index) => index !== linkIndex),
    });
  }

  function moveLink(linkIndex: number, direction: -1 | 1) {
    onUpdateGroup(groupIndex, {
      ...group,
      links: moveItem(group.links, linkIndex, direction),
    });
  }

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <Input
          value={group.title}
          onChange={(event) => onUpdateGroup(groupIndex, { ...group, title: event.target.value })}
          className="max-w-md bg-white"
          placeholder="Group title"
        />
        <RowControls index={groupIndex} count={groupCount} onMove={onMoveGroup} onRemove={onRemoveGroup} />
      </div>
      <div className="grid gap-2">
        {group.links.map((link, linkIndex) => (
          <div key={`${link.url}-${linkIndex}`} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr_1fr_auto]">
            <Input value={link.text} onChange={(event) => updateLink(linkIndex, { text: event.target.value })} placeholder="Link text" />
            <Input value={link.url} onChange={(event) => updateLink(linkIndex, { url: event.target.value })} placeholder="URL" />
            <RowControls index={linkIndex} count={group.links.length} onMove={moveLink} onRemove={removeLink} compact />
          </div>
        ))}
        {group.links.length === 0 ? <p className="text-sm text-slate-500">No links in this group yet.</p> : null}
      </div>
      <div className="grid gap-2 rounded-lg border border-blue-100 bg-blue-50/70 p-3">
        <Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search car rental pages, cities, destinations, or guides" />
        <div className="grid gap-2 md:grid-cols-2">
          {suggestions.map((suggestion) => (
            <div key={`${group.title}-${suggestion.url}`} className="flex items-start justify-between gap-3 rounded-lg bg-white p-3">
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-semibold text-slate-900">{suggestion.text}</p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                  {[suggestion.sourceType, suggestion.meta, suggestion.status].filter(Boolean).join(" - ") || suggestion.url}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-full" onClick={() => onAddLink(groupIndex, suggestion)}>
                <Plus className="size-4" aria-hidden="true" />
                Add
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RowControls({
  index,
  count,
  compact = false,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  compact?: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button type="button" variant="outline" size="icon" disabled={index === 0} onClick={() => onMove(index, -1)} className="size-8 rounded-full">
        <ArrowUp className="size-4" aria-hidden="true" />
        <span className="sr-only">Move up</span>
      </Button>
      <Button type="button" variant="outline" size="icon" disabled={index === count - 1} onClick={() => onMove(index, 1)} className="size-8 rounded-full">
        <ArrowDown className="size-4" aria-hidden="true" />
        <span className="sr-only">Move down</span>
      </Button>
      <Button type="button" variant="outline" size={compact ? "icon" : "sm"} onClick={() => onRemove(index)} className="rounded-full text-red-600 hover:text-red-700">
        <Trash2 className="size-4" aria-hidden="true" />
        {!compact ? "Remove" : <span className="sr-only">Remove</span>}
      </Button>
    </div>
  );
}

function AdvancedJsonEditor({
  value,
  rows,
  example,
  error,
  onChange,
}: {
  value: string;
  rows: number;
  example: string;
  error: string;
  onChange: (value: string) => void;
}) {
  return (
    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
      <summary className="cursor-pointer font-semibold text-slate-700">Advanced JSON Editor</summary>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        aria-invalid={Boolean(error)}
        className="mt-3 font-mono text-xs"
      />
      {error ? (
        <p className="mt-2 font-medium text-red-600">
          {error} The last valid selector state will be saved until this JSON is fixed.
        </p>
      ) : null}
      <ExampleJson example={example} />
    </details>
  );
}

function ExampleJson({ example }: { example: string }) {
  return (
    <details className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
      <summary className="cursor-pointer font-semibold text-slate-700">Helper example</summary>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap">{example}</pre>
    </details>
  );
}

function parseCards(value: string): { valid: boolean; items: CarRentalLinkCard[]; message: string } {
  try {
    const parsed = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) {
      return { valid: false, items: [], message: "JSON must be an array of card objects." };
    }

    return {
      valid: true,
      items: normalizeCards(parsed.map((item) => ({ ...emptyCard(), ...(isRecord(item) ? item : {}) }))),
      message: "",
    };
  } catch (error) {
    return { valid: false, items: [], message: jsonErrorMessage(error) };
  }
}

function parseVehicleCategoryCards(value: string): { valid: boolean; items: CarRentalVehicleCategoryCard[]; message: string } {
  try {
    const parsed = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) {
      return { valid: false, items: [], message: "JSON must be an array of vehicle category card objects." };
    }

    return {
      valid: true,
      items: normalizeVehicleCategoryCards(
        parsed.map((item) => ({ ...emptyVehicleCategoryCard(), ...(isRecord(item) ? item : {}) })),
      ),
      message: "",
    };
  } catch (error) {
    return { valid: false, items: [], message: jsonErrorMessage(error) };
  }
}

function parseGroups(value: string): { valid: boolean; items: CarRentalDirectoryGroup[]; message: string } {
  try {
    const parsed = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) {
      return { valid: false, items: [], message: "JSON must be an array of directory groups." };
    }

    return {
      valid: true,
      items: normalizeGroups(
        parsed.map((group) => {
          const record = isRecord(group) ? group : {};
          const links = Array.isArray(record.links) ? record.links : [];
          return {
            title: stringValue(record.title),
            sortOrder: numberValue(record.sortOrder),
            links: links.map((link) => {
              const linkRecord = isRecord(link) ? link : {};
              return {
                text: stringValue(linkRecord.text),
                url: stringValue(linkRecord.url),
                sortOrder: numberValue(linkRecord.sortOrder),
              };
            }),
          };
        }),
      ),
      message: "",
    };
  } catch (error) {
    return { valid: false, items: [], message: jsonErrorMessage(error) };
  }
}

function validateJson(value: string, shape: "array") {
  try {
    const parsed = JSON.parse(value || "[]");
    if (shape === "array" && !Array.isArray(parsed)) {
      return { valid: false, message: "JSON must be an array." };
    }

    return { valid: true, message: "" };
  } catch (error) {
    return { valid: false, message: jsonErrorMessage(error) };
  }
}

function normalizeCards(cards: CarRentalLinkCard[]) {
  return cards
    .map((card, index) => ({
      title: stringValue(card.title),
      url: stringValue(card.url),
      description: stringValue(card.description),
      image: stringValue(card.image),
      label: stringValue(card.label),
      sortOrder: numberValue(card.sortOrder, index),
      visible: card.visible !== false,
    }))
    .filter((card) => card.title || card.url)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((card, index) => ({ ...card, sortOrder: index }));
}

function normalizeVehicleCategoryCards(cards: CarRentalVehicleCategoryCard[]) {
  return cards
    .map((card, index) => ({
      title: stringValue(card.title),
      image: stringValue(card.image),
      startingPrice: stringValue(card.startingPrice),
      buttonText: stringValue(card.buttonText) || "Find Available Cars",
      sortOrder: numberValue(card.sortOrder, index),
      visible: card.visible !== false,
    }))
    .filter((card) => card.title || card.image || card.startingPrice)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function normalizeVehicleCategoryEditorCards(cards: VehicleCategoryEditorCard[]) {
  return cards
    .map((card, index) => ({
      ...card,
      title: stringValue(card.title),
      image: stringValue(card.image),
      startingPrice: stringValue(card.startingPrice),
      buttonText: stringValue(card.buttonText) || "Find Available Cars",
      sortOrder: numberValue(card.sortOrder, index),
      visible: card.visible !== false,
      editorId: card.editorId || newVehicleEditorId(),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function normalizeGroups(groups: CarRentalDirectoryGroup[]) {
  return groups
    .map((group, index) => ({
      title: stringValue(group.title),
      sortOrder: numberValue(group.sortOrder, index),
      links: group.links
        .map((link, linkIndex) => ({
          text: stringValue(link.text),
          url: stringValue(link.url),
          sortOrder: numberValue(link.sortOrder, linkIndex),
        }))
        .filter((link) => link.text || link.url)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((link, linkIndex) => ({ ...link, sortOrder: linkIndex })),
    }))
    .filter((group) => group.title || group.links.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((group, index) => ({ ...group, sortOrder: index }));
}

function cardFromSuggestion(suggestion: CardSuggestion): CarRentalLinkCard {
  return {
    title: suggestion.title,
    url: suggestion.url,
    description: suggestion.description,
    image: "",
    label: suggestion.label,
    sortOrder: suggestion.sortOrder,
    visible: suggestion.visible !== false,
  };
}

function emptyCard(): CarRentalLinkCard {
  return {
    title: "",
    url: "",
    description: "",
    image: "",
    label: "",
    sortOrder: 0,
    visible: true,
  };
}

function emptyVehicleCategoryCard(): CarRentalVehicleCategoryCard {
  return {
    title: "",
    image: "",
    startingPrice: "",
    buttonText: "Find Available Cars",
    sortOrder: 0,
    visible: true,
  };
}

function withVehicleEditorIds(
  cards: CarRentalVehicleCategoryCard[],
  previousCards: VehicleCategoryEditorCard[] = [],
): VehicleCategoryEditorCard[] {
  return cards.map((card, index) => ({
    ...card,
    editorId: previousCards[index]?.editorId || newVehicleEditorId(),
  }));
}

function newVehicleEditorId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `vehicle-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const item = nextItems[index];
  nextItems[index] = nextItems[nextIndex];
  nextItems[nextIndex] = item;
  return nextItems;
}

function searchText(...values: unknown[]) {
  return values
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function jsonErrorMessage(error: unknown) {
  return error instanceof Error ? `Invalid JSON: ${error.message}` : "Invalid JSON.";
}
