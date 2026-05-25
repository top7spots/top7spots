"use client";

import { useMemo, useState } from "react";
import type { GuideListingBlock, GuideListingBlockCustomItem, GuideListingBlockType } from "@/lib/types";

type SelectableItem = {
  id: string;
  label: string;
  meta?: string;
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
      itemIds: block.itemIds || [],
      customItems: block.customItems || [],
    })),
  );
  const serializedBlocks = useMemo(() => JSON.stringify(toPayload(blocks)), [blocks]);

  return (
    <div className="grid gap-4">
      <input type="hidden" name="listingBlocks" value={serializedBlocks} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">Optional guide card sections</p>
          <p className="text-xs leading-5 text-slate-500">
            Add manually selected destination, city, country, guide, or custom-link cards.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2A66] shadow-sm transition hover:border-[#2563EB] hover:bg-blue-50"
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
        {blocks.map((block, blockIndex) => (
          <div key={block.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
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
              <button
                type="button"
                className="h-10 rounded-full border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                onClick={() => setBlocks((current) => current.filter((_, index) => index !== blockIndex))}
              >
                Remove
              </button>
            </div>

            {block.type === "custom" ? (
              <CustomLinksEditor
                items={block.customItems || []}
                onChange={(customItems) => updateBlock(blockIndex, { customItems }, setBlocks)}
              />
            ) : (
              <ItemSelector
                items={itemsForType(block.type, { destinations, cities, countries, guides })}
                selectedIds={block.itemIds || []}
                onChange={(itemIds) => updateBlock(blockIndex, { itemIds }, setBlocks)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemSelector({
  items,
  selectedIds,
  onChange,
}: {
  items: SelectableItem[];
  selectedIds: string[];
  onChange: (itemIds: string[]) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
        No matching items are available for this type.
      </div>
    );
  }

  return (
    <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-2">
      {items.map((item) => {
        const checked = selectedIds.includes(item.id);

        return (
          <label
            key={item.id}
            className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm transition hover:border-blue-200 hover:bg-blue-50"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() =>
                onChange(
                  checked
                    ? selectedIds.filter((id) => id !== item.id)
                    : Array.from(new Set([...selectedIds, item.id])),
                )
              }
              className="mt-1"
            />
            <span>
              <span className="block font-semibold text-slate-800">{item.label}</span>
              {item.meta ? <span className="mt-1 block text-xs leading-5 text-slate-500">{item.meta}</span> : null}
            </span>
          </label>
        );
      })}
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
  return (
    <div className="mt-4 grid gap-3">
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No custom links yet.
        </div>
      ) : null}
      {items.map((item, index) => (
        <div key={`${item.href}-${index}`} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <SmallField label="Title" value={item.title} onChange={(title) => updateCustomItem(index, { title }, items, onChange)} />
            <SmallField label="Href" value={item.href} onChange={(href) => updateCustomItem(index, { href }, items, onChange)} />
            <SmallField label="Badge" value={item.badge || ""} onChange={(badge) => updateCustomItem(index, { badge }, items, onChange)} />
            <SmallField label="Image URL" value={item.image || ""} onChange={(image) => updateCustomItem(index, { image }, items, onChange)} />
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
            className="w-fit rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
          >
            Remove link
          </button>
        </div>
      ))}
      <button
        type="button"
        className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2A66] shadow-sm transition hover:border-[#2563EB] hover:bg-blue-50"
        onClick={() => onChange([...items, { title: "", href: "", description: "", image: "", badge: "" }])}
      >
        Add custom link
      </button>
    </div>
  );
}

function SmallField({
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
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function updateBlock(
  blockIndex: number,
  patch: Partial<EditableGuideListingBlock>,
  setBlocks: (update: (current: EditableGuideListingBlock[]) => EditableGuideListingBlock[]) => void,
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

function toPayload(blocks: EditableGuideListingBlock[]): GuideListingBlock[] {
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
          .filter((item) => item.title && item.href);

        if (customItems.length > 0) {
          payloadBlock.customItems = customItems;
        }
      } else {
        const itemIds = Array.from(new Set(block.itemIds || []));

        if (itemIds.length > 0) {
          payloadBlock.itemIds = itemIds;
        }
      }

      return payloadBlock;
    })
    .filter((block): block is GuideListingBlock => Boolean(block));
}
