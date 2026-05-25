"use client";

import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import type { GuideListingBlock, GuideListingBlockCustomItem, GuideListingBlockType } from "@/lib/types";

type SelectableItem = {
  id: string;
  label: string;
  meta?: string;
  description?: string;
  image?: string;
  badge?: string;
};

type GuideListingBlocksFieldProps = {
  defaultBlocks?: GuideListingBlock[];
  destinations: SelectableItem[];
  cities: SelectableItem[];
  countries: SelectableItem[];
  guides: SelectableItem[];
};

type EditableGuideListingBlock = GuideListingBlock & {
  customItems?: GuideListingBlockCustomItem[];
};

const blockTypes: Array<{ value: GuideListingBlockType; label: string }> = [
  { value: "destinations", label: "Destinations" },
  { value: "cities", label: "Cities" },
  { value: "countries", label: "Countries" },
  { value: "guides", label: "Guides" },
  { value: "custom", label: "Custom links" },
];

const maxVisibleOptions = 40;

export function GuideListingBlocksField({
  defaultBlocks = [],
  destinations,
  cities,
  countries,
  guides,
}: GuideListingBlocksFieldProps) {
  const [blocks, setBlocks] = useState<EditableGuideListingBlock[]>(() =>
    defaultBlocks.map((block) => ({
      ...block,
      itemIds: uniqueIds(block.itemIds || []),
      customItems: block.customItems || [],
    })),
  );
  const [collapsedBlockIds, setCollapsedBlockIds] = useState<string[]>([]);
  const selectorItems = useMemo(
    () => ({ destinations, cities, countries, guides }),
    [destinations, cities, countries, guides],
  );
  const serializedBlocks = useMemo(() => JSON.stringify(toPayload(blocks, selectorItems)), [blocks, selectorItems]);

  return (
    <div className="grid gap-4">
      <input type="hidden" name="listingBlocks" value={serializedBlocks} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">Optional guide card sections</p>
          <p className="text-xs leading-5 text-slate-500">
            Add searchable destination, city, country, guide, or custom-link card blocks.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2A66] shadow-sm transition hover:border-[#2563EB] hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
          onClick={() => {
            setBlocks((current) => [
              ...current,
              {
                id: `listing-block-${Date.now()}`,
                title: "",
                type: "destinations",
                itemIds: [],
                customItems: [],
              },
            ]);
          }}
        >
          Add block
        </button>
      </div>

      {blocks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
          No listing blocks yet.
        </div>
      ) : null}

      <div className="grid gap-4">
        {blocks.map((block, blockIndex) => {
          const isCollapsed = collapsedBlockIds.includes(block.id);
          const validation = blockValidation(block);

          return (
            <section key={block.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
                    Block {blockIndex + 1}
                  </p>
                  <h4 className="mt-1 text-sm font-semibold text-slate-800">
                    {block.title.trim() || "Untitled listing block"}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    {blockTypeLabel(block.type)} - {selectedCount(block)} selected
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={blockIndex === 0}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => setBlocks((current) => moveBlock(current, blockIndex, blockIndex - 1))}
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    disabled={blockIndex === blocks.length - 1}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => setBlocks((current) => moveBlock(current, blockIndex, blockIndex + 1))}
                  >
                    Move down
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#0A2A66] transition hover:bg-blue-50"
                    onClick={() => toggleCollapsedBlock(block.id, setCollapsedBlockIds)}
                    aria-expanded={!isCollapsed}
                  >
                    {isCollapsed ? "Expand" : "Collapse"}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    onClick={() => setBlocks((current) => current.filter((_, index) => index !== blockIndex))}
                  >
                    Remove
                  </button>
                </div>
              </div>

              {!isCollapsed ? (
                <div className="grid gap-4 p-4">
                  {validation ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      {validation}
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">Block title</span>
                      <input
                        value={block.title}
                        onChange={(event) => updateBlock(blockIndex, { title: event.target.value }, setBlocks)}
                        placeholder="Best destinations near Muscat"
                        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">Block type</span>
                      <select
                        value={block.type}
                        onChange={(event) =>
                          updateBlock(
                            blockIndex,
                            {
                              type: event.target.value as GuideListingBlockType,
                              itemIds: [],
                              customItems: event.target.value === "custom" ? block.customItems || [] : [],
                            },
                            setBlocks,
                          )
                        }
                        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                      >
                        {blockTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {block.type === "custom" ? (
                    <CustomLinksEditor
                      items={block.customItems || []}
                      onChange={(customItems) => updateBlock(blockIndex, { customItems }, setBlocks)}
                    />
                  ) : (
                    <ItemSelector
                      blockId={block.id}
                      type={block.type}
                      items={itemsForType(block.type, selectorItems)}
                      selectedIds={block.itemIds || []}
                      onChange={(itemIds) => updateBlock(blockIndex, { itemIds }, setBlocks)}
                    />
                  )}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ItemSelector({
  blockId,
  type,
  items,
  selectedIds,
  onChange,
}: {
  blockId: string;
  type: GuideListingBlockType;
  items: SelectableItem[];
  selectedIds: string[];
  onChange: (itemIds: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedItems = useMemo(
    () => selectedIds.map((id) => items.find((item) => item.id === id)).filter((item): item is SelectableItem => Boolean(item)),
    [items, selectedIds],
  );
  const staleIds = useMemo(
    () => selectedIds.filter((id) => !items.some((item) => item.id === id)),
    [items, selectedIds],
  );
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return items.slice(0, maxVisibleOptions);
    }

    return items
      .filter((item) =>
        [item.label, item.meta, item.description, item.badge].some((value) =>
          value?.toLowerCase().includes(normalizedQuery),
        ),
      )
      .slice(0, maxVisibleOptions);
  }, [items, query]);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        No matching items are available for this type.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700" htmlFor={`listing-search-${blockId}`}>
          Search {blockTypeLabel(type).toLowerCase()}
        </label>
        <input
          id={`listing-search-${blockId}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Type to find ${blockTypeLabel(type).toLowerCase()}...`}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
        />
        <p className="text-xs text-slate-500">
          Showing {filteredItems.length} of {items.length}. Selected items are previewed below.
        </p>
      </div>

      {selectedItems.length > 0 ? (
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700">Selected preview</p>
            <button
              type="button"
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              onClick={() => onChange([])}
            >
              Clear all
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {selectedItems.map((item) => (
              <PreviewCard
                key={item.id}
                item={item}
                typeLabel={blockTypeLabel(type)}
                onRemove={() => onChange(selectedIds.filter((id) => id !== item.id))}
              />
            ))}
          </div>
        </div>
      ) : null}

      {staleIds.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {staleIds.length} previously selected {staleIds.length === 1 ? "item is" : "items are"} no longer available
          and will not render unless restored.
        </div>
      ) : null}

      <div className="grid max-h-80 gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const checked = selectedIdSet.has(item.id);

            return (
              <label
                key={item.id}
                className="flex gap-3 rounded-lg border border-slate-100 bg-white p-3 text-sm transition hover:border-blue-200 hover:bg-blue-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(checked ? selectedIds.filter((id) => id !== item.id) : uniqueIds([...selectedIds, item.id]))
                  }
                  className="mt-1"
                />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-800">{item.label}</span>
                  {item.meta ? <span className="mt-1 block text-xs leading-5 text-slate-500">{item.meta}</span> : null}
                </span>
              </label>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            No results match this search.
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewCard({
  item,
  typeLabel,
  onRemove,
}: {
  item: SelectableItem;
  typeLabel: string;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <ImagePreview image={item.image} label={item.label} />
      <div className="min-w-0 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1D4ED8]">
            {item.badge || typeLabel}
          </p>
          <button
            type="button"
            className="rounded-full px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            onClick={onRemove}
            aria-label={`Remove ${item.label}`}
          >
            Remove
          </button>
        </div>
        <p className="mt-1 truncate text-sm font-semibold text-slate-800">{item.label}</p>
        {item.description || item.meta ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.description || item.meta}</p>
        ) : null}
      </div>
    </div>
  );
}

function CustomLinksEditor({
  items,
  onChange,
}: {
  items: GuideListingBlockCustomItem[];
  onChange: (items: GuideListingBlockCustomItem[]) => void;
}) {
  const validItems = items.filter((item) => item.title.trim() || item.href.trim());

  return (
    <div className="grid gap-3">
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          No custom links yet.
        </div>
      ) : null}
      {items.map((item, index) => {
        const hrefIsValid = !item.href.trim() || isValidHref(item.href);

        return (
          <div key={`${item.href}-${index}`} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 lg:grid-cols-[5rem_minmax(0,1fr)]">
              <ImagePreview image={item.image} label={item.title || "Custom link"} />
              <div className="grid gap-3 md:grid-cols-2">
                <SmallField
                  label="Title"
                  value={item.title}
                  onChange={(title) => updateCustomItem(index, { title }, items, onChange)}
                />
                <SmallField
                  label="Href"
                  value={item.href}
                  onChange={(href) => updateCustomItem(index, { href }, items, onChange)}
                  invalid={!hrefIsValid}
                  helperText={hrefIsValid ? "Use a relative path or https URL." : "Use /path or https://example.com."}
                />
                <SmallField
                  label="Badge"
                  value={item.badge || ""}
                  onChange={(badge) => updateCustomItem(index, { badge }, items, onChange)}
                />
                <SmallField
                  label="Image URL"
                  value={item.image || ""}
                  onChange={(image) => updateCustomItem(index, { image }, items, onChange)}
                />
              </div>
            </div>
            <label className="grid gap-2">
              <span className="text-xs font-semibold text-slate-600">Description</span>
              <textarea
                value={item.description || ""}
                onChange={(event) => updateCustomItem(index, { description: event.target.value }, items, onChange)}
                rows={2}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <button
              type="button"
              className="w-fit rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              Remove link
            </button>
          </div>
        );
      })}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2A66] shadow-sm transition hover:border-[#2563EB] hover:bg-blue-50"
          onClick={() => onChange([...items, { title: "", href: "", description: "", image: "", badge: "" }])}
        >
          Add custom link
        </button>
        {validItems.length !== items.length ? (
          <button
            type="button"
            className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            onClick={() => onChange(validItems)}
          >
            Remove empty links
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SmallField({
  label,
  value,
  onChange,
  invalid = false,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  helperText?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        className={`h-9 rounded-md border bg-white px-3 text-sm shadow-sm outline-none transition focus:ring-4 ${
          invalid
            ? "border-red-300 focus:border-red-500 focus:ring-red-100"
            : "border-slate-200 focus:border-[#2563EB] focus:ring-blue-100"
        }`}
      />
      {helperText ? (
        <span className={`text-xs ${invalid ? "text-red-600" : "text-slate-500"}`}>{helperText}</span>
      ) : null}
    </label>
  );
}

function ImagePreview({ image, label }: { image?: string; label: string }) {
  const safeImage = image?.trim();

  return (
    <div
      className="min-h-20 bg-slate-100 bg-cover bg-center"
      style={safeImage ? { backgroundImage: `url("${safeImage.replace(/"/g, '\\"')}")` } : undefined}
      aria-label={safeImage ? `${label} image preview` : undefined}
    >
      {!safeImage ? (
        <div className="flex size-full min-h-20 items-center justify-center px-2 text-center text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
          No image
        </div>
      ) : null}
    </div>
  );
}

function updateBlock(
  blockIndex: number,
  patch: Partial<EditableGuideListingBlock>,
  setBlocks: Dispatch<SetStateAction<EditableGuideListingBlock[]>>,
) {
  setBlocks((current) =>
    current.map((block, index) => (index === blockIndex ? { ...block, ...patch } : block)),
  );
}

function updateCustomItem(
  itemIndex: number,
  patch: Partial<GuideListingBlockCustomItem>,
  items: GuideListingBlockCustomItem[],
  onChange: (items: GuideListingBlockCustomItem[]) => void,
) {
  onChange(items.map((item, index) => (index === itemIndex ? { ...item, ...patch } : item)));
}

function toggleCollapsedBlock(
  blockId: string,
  setCollapsedBlockIds: Dispatch<SetStateAction<string[]>>,
) {
  setCollapsedBlockIds((current) =>
    current.includes(blockId) ? current.filter((id) => id !== blockId) : [...current, blockId],
  );
}

function moveBlock(blocks: EditableGuideListingBlock[], fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= blocks.length || fromIndex === toIndex) {
    return blocks;
  }

  const nextBlocks = [...blocks];
  const [movedBlock] = nextBlocks.splice(fromIndex, 1);
  nextBlocks.splice(toIndex, 0, movedBlock);
  return nextBlocks;
}

function itemsForType(
  type: GuideListingBlockType,
  items: {
    destinations: SelectableItem[];
    cities: SelectableItem[];
    countries: SelectableItem[];
    guides: SelectableItem[];
  },
) {
  if (type === "destinations") {
    return items.destinations;
  }

  if (type === "cities") {
    return items.cities;
  }

  if (type === "countries") {
    return items.countries;
  }

  if (type === "guides") {
    return items.guides;
  }

  return [];
}

function toPayload(
  blocks: EditableGuideListingBlock[],
  items: {
    destinations: SelectableItem[];
    cities: SelectableItem[];
    countries: SelectableItem[];
    guides: SelectableItem[];
  },
): GuideListingBlock[] {
  return blocks
    .map((block, index) => {
      const title = block.title.trim();

      if (!title) {
        return undefined;
      }

      const payloadBlock: GuideListingBlock = {
        id: block.id || `listing-block-${index + 1}`,
        title,
        type: block.type,
      };

      if (block.type === "custom") {
        const customItems = (block.customItems || [])
          .map((item) => ({
            title: item.title.trim(),
            description: item.description?.trim() || undefined,
            image: item.image?.trim() || undefined,
            href: item.href.trim(),
            badge: item.badge?.trim() || undefined,
          }))
          .filter((item) => item.title && item.href && isValidHref(item.href));

        if (customItems.length === 0) {
          return undefined;
        }

        payloadBlock.customItems = uniqueCustomItems(customItems);
      } else {
        const availableIds = new Set(itemsForType(block.type, items).map((item) => item.id));
        const itemIds = uniqueIds(block.itemIds || []).filter((id) => availableIds.has(id));

        if (itemIds.length === 0) {
          return undefined;
        }

        payloadBlock.itemIds = itemIds;
      }

      return payloadBlock;
    })
    .filter((block): block is GuideListingBlock => Boolean(block));
}

function blockValidation(block: EditableGuideListingBlock) {
  if (!block.title.trim()) {
    return "Add a title before saving this block.";
  }

  if (block.type === "custom") {
    const validItems = (block.customItems || []).filter((item) => item.title.trim() && isValidHref(item.href));

    if (validItems.length === 0) {
      return "Add at least one custom link with a title and valid URL.";
    }

    return "";
  }

  if (uniqueIds(block.itemIds || []).length === 0) {
    return "Select at least one item before saving this block.";
  }

  return "";
}

function selectedCount(block: EditableGuideListingBlock) {
  return block.type === "custom"
    ? (block.customItems || []).filter((item) => item.title.trim() && isValidHref(item.href)).length
    : uniqueIds(block.itemIds || []).length;
}

function blockTypeLabel(type: GuideListingBlockType) {
  return blockTypes.find((blockType) => blockType.value === type)?.label || "Items";
}

function uniqueIds(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function uniqueCustomItems(items: GuideListingBlockCustomItem[]) {
  return Array.from(new Map(items.map((item) => [item.href, item])).values());
}

function isValidHref(value?: string) {
  const href = value?.trim();

  if (!href) {
    return false;
  }

  return href.startsWith("/") || /^https?:\/\//i.test(href);
}
