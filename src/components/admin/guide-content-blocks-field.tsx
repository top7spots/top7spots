"use client";

import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import type {
  GuideContentBlock,
  GuideContentBlockType,
  GuideFaq,
  GuideQuickInfoItem,
} from "@/lib/types";

type SelectableItem = {
  id: string;
  label: string;
  meta?: string;
};

type GuideContentBlocksFieldProps = {
  defaultBlocks?: GuideContentBlock[];
  destinations: SelectableItem[];
  cities: SelectableItem[];
  countries: SelectableItem[];
  guides: SelectableItem[];
  restaurants: SelectableItem[];
  activities: SelectableItem[];
};

const blockTypes: Array<{ value: GuideContentBlockType; label: string }> = [
  { value: "hero", label: "Hero" },
  { value: "overview", label: "Overview" },
  { value: "selected-destinations", label: "Selected destinations" },
  { value: "selected-cities", label: "Selected cities" },
  { value: "selected-countries", label: "Selected countries" },
  { value: "selected-restaurants", label: "Selected restaurants" },
  { value: "selected-activities", label: "Selected activities" },
  { value: "quick-info", label: "Quick info" },
  { value: "map", label: "Map" },
  { value: "travel-tips", label: "Travel tips" },
  { value: "best-time-to-visit", label: "Best time to visit" },
  { value: "car-rental-cta", label: "Car rental CTA" },
  { value: "related-guides", label: "Related guides" },
  { value: "faq", label: "FAQ" },
  { value: "newsletter-cta", label: "Newsletter CTA" },
];

const selectorBlockTypes: GuideContentBlockType[] = [
  "selected-destinations",
  "selected-cities",
  "selected-countries",
  "selected-restaurants",
  "selected-activities",
  "related-guides",
];

export function GuideContentBlocksField({
  defaultBlocks = [],
  destinations,
  cities,
  countries,
  guides,
  restaurants,
  activities,
}: GuideContentBlocksFieldProps) {
  const [blocks, setBlocks] = useState<GuideContentBlock[]>(() =>
    defaultBlocks.map((block) => ({
      ...block,
      itemIds: uniqueStrings(block.itemIds || []),
      quickInfo: block.quickInfo || [],
      tips: block.tips || [],
      faqs: block.faqs || [],
    })),
  );
  const [collapsedBlockIds, setCollapsedBlockIds] = useState<string[]>([]);
  const selectorItems = useMemo(
    () => ({ destinations, cities, countries, restaurants, activities, guides }),
    [destinations, cities, countries, restaurants, activities, guides],
  );
  const serializedBlocks = useMemo(() => JSON.stringify(toPayload(blocks)), [blocks]);

  return (
    <div className="grid gap-4">
      <input type="hidden" name="contentBlocks" value={serializedBlocks} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">Block-based guide layout</p>
          <p className="text-xs leading-5 text-slate-500">
            Optional. When blocks are added, the guide page renders this ordered layout and keeps legacy content as fallback.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2A66] shadow-sm transition hover:border-[#2563EB] hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
          onClick={() =>
            setBlocks((current) => [
              ...current,
              {
                id: `guide-block-${Date.now()}`,
                type: "overview",
                title: "",
                body: "",
                itemIds: [],
              },
            ])
          }
        >
          Add page block
        </button>
      </div>

      {blocks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
          No page blocks yet. Existing paragraph content and listing blocks will continue to render.
        </div>
      ) : null}

      <div className="grid gap-4">
        {blocks.map((block, blockIndex) => {
          const isCollapsed = collapsedBlockIds.includes(block.id);

          return (
            <section key={block.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
                    Page block {blockIndex + 1}
                  </p>
                  <h4 className="mt-1 text-sm font-semibold text-slate-800">
                    {block.title?.trim() || blockTypeLabel(block.type)}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">{blockTypeLabel(block.type)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <BlockButton disabled={blockIndex === 0} onClick={() => setBlocks((current) => moveBlock(current, blockIndex, blockIndex - 1))}>
                    Move up
                  </BlockButton>
                  <BlockButton disabled={blockIndex === blocks.length - 1} onClick={() => setBlocks((current) => moveBlock(current, blockIndex, blockIndex + 1))}>
                    Move down
                  </BlockButton>
                  <BlockButton onClick={() => toggleCollapsedBlock(block.id, setCollapsedBlockIds)}>
                    {isCollapsed ? "Expand" : "Collapse"}
                  </BlockButton>
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
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
                    <SmallField
                      label="Title"
                      value={block.title || ""}
                      onChange={(title) => updateBlock(blockIndex, { title }, setBlocks)}
                    />
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold text-slate-600">Block type</span>
                      <select
                        value={block.type}
                        onChange={(event) =>
                          updateBlock(
                            blockIndex,
                            {
                              type: event.target.value as GuideContentBlockType,
                              itemIds: [],
                            },
                            setBlocks,
                          )
                        }
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                      >
                        {blockTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <SmallField label="Eyebrow" value={block.eyebrow || ""} onChange={(eyebrow) => updateBlock(blockIndex, { eyebrow }, setBlocks)} />
                    <SmallField label="Image URL" value={block.image || ""} onChange={(image) => updateBlock(blockIndex, { image }, setBlocks)} />
                    <SmallField label="Image alt text" value={block.imageAlt || ""} onChange={(imageAlt) => updateBlock(blockIndex, { imageAlt }, setBlocks)} />
                    <SmallField label="CTA label" value={block.ctaLabel || ""} onChange={(ctaLabel) => updateBlock(blockIndex, { ctaLabel }, setBlocks)} />
                    <SmallField label="CTA href" value={block.ctaHref || ""} onChange={(ctaHref) => updateBlock(blockIndex, { ctaHref }, setBlocks)} />
                    <SmallField label="Map embed URL" value={block.mapEmbedUrl || ""} onChange={(mapEmbedUrl) => updateBlock(blockIndex, { mapEmbedUrl }, setBlocks)} />
                  </div>

                  <label className="grid gap-2">
                    <span className="text-xs font-semibold text-slate-600">Body</span>
                    <textarea
                      value={block.body || ""}
                      onChange={(event) => updateBlock(blockIndex, { body: event.target.value }, setBlocks)}
                      rows={4}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                    />
                  </label>

                  {selectorBlockTypes.includes(block.type) ? (
                    <ItemSelector
                      type={block.type}
                      items={itemsForType(block.type, selectorItems)}
                      selectedIds={block.itemIds || []}
                      onChange={(itemIds) => updateBlock(blockIndex, { itemIds }, setBlocks)}
                    />
                  ) : null}

                  {block.type === "quick-info" ? (
                    <KeyValueTextarea
                      label="Quick info"
                      value={formatQuickInfo(block.quickInfo)}
                      onChange={(quickInfo) => updateBlock(blockIndex, { quickInfo: parseQuickInfo(quickInfo) }, setBlocks)}
                    />
                  ) : null}

                  {(block.type === "travel-tips" || block.type === "best-time-to-visit") ? (
                    <KeyValueTextarea
                      label="Tips, one per line"
                      value={(block.tips || []).join("\n")}
                      onChange={(tips) => updateBlock(blockIndex, { tips: lines(tips) }, setBlocks)}
                    />
                  ) : null}

                  {block.type === "faq" ? (
                    <KeyValueTextarea
                      label="FAQs"
                      value={formatFaqs(block.faqs)}
                      onChange={(faqs) => updateBlock(blockIndex, { faqs: parseFaqs(faqs) }, setBlocks)}
                    />
                  ) : null}
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
  type,
  items,
  selectedIds,
  onChange,
}: {
  type: GuideContentBlockType;
  items: SelectableItem[];
  selectedIds: string[];
  onChange: (itemIds: string[]) => void;
}) {
  const selectedIdSet = new Set(selectedIds);

  return (
    <div className="grid gap-2">
      <p className="text-xs font-semibold text-slate-600">{blockTypeLabel(type)} records</p>
      <div className="grid max-h-72 gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
        {items.map((item) => {
          const checked = selectedIdSet.has(item.id);

          return (
            <label key={item.id} className="flex gap-3 rounded-lg border border-slate-100 bg-white p-3 text-sm">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(checked ? selectedIds.filter((id) => id !== item.id) : uniqueStrings([...selectedIds, item.id]))}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold text-slate-800">{item.label}</span>
                {item.meta ? <span className="mt-1 block text-xs text-slate-500">{item.meta}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function SmallField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
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

function KeyValueTextarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function BlockButton({ children, disabled, onClick }: { children: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function updateBlock(
  blockIndex: number,
  patch: Partial<GuideContentBlock>,
  setBlocks: Dispatch<SetStateAction<GuideContentBlock[]>>,
) {
  setBlocks((current) =>
    current.map((block, index) => (index === blockIndex ? { ...block, ...patch } : block)),
  );
}

function toggleCollapsedBlock(blockId: string, setCollapsedBlockIds: Dispatch<SetStateAction<string[]>>) {
  setCollapsedBlockIds((current) =>
    current.includes(blockId) ? current.filter((id) => id !== blockId) : [...current, blockId],
  );
}

function moveBlock(blocks: GuideContentBlock[], fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= blocks.length || fromIndex === toIndex) {
    return blocks;
  }

  const nextBlocks = [...blocks];
  const [movedBlock] = nextBlocks.splice(fromIndex, 1);
  nextBlocks.splice(toIndex, 0, movedBlock);
  return nextBlocks;
}

function itemsForType(
  type: GuideContentBlockType,
  items: {
    destinations: SelectableItem[];
    cities: SelectableItem[];
    countries: SelectableItem[];
    restaurants: SelectableItem[];
    activities: SelectableItem[];
    guides: SelectableItem[];
  },
) {
  if (type === "selected-destinations") return items.destinations;
  if (type === "selected-cities") return items.cities;
  if (type === "selected-countries") return items.countries;
  if (type === "selected-restaurants") return items.restaurants;
  if (type === "selected-activities") return items.activities;
  if (type === "related-guides") return items.guides;
  return [];
}

function toPayload(blocks: GuideContentBlock[]): GuideContentBlock[] {
  return blocks
    .map((block, index) => ({
      id: block.id || `guide-block-${index + 1}`,
      type: block.type,
      title: clean(block.title),
      eyebrow: clean(block.eyebrow),
      body: clean(block.body),
      image: clean(block.image),
      imageAlt: clean(block.imageAlt),
      itemIds: uniqueStrings(block.itemIds || []),
      quickInfo: block.quickInfo || [],
      tips: uniqueStrings(block.tips || []),
      faqs: block.faqs || [],
      mapEmbedUrl: clean(block.mapEmbedUrl),
      mapLabel: clean(block.mapLabel),
      ctaLabel: clean(block.ctaLabel),
      ctaHref: clean(block.ctaHref),
    }))
    .filter((block) =>
      Boolean(
        block.title ||
          block.body ||
          block.image ||
          block.itemIds.length ||
          block.quickInfo.length ||
          block.tips.length ||
          block.faqs.length ||
          block.mapEmbedUrl ||
          block.ctaHref,
      ),
    );
}

function parseQuickInfo(value: string): GuideQuickInfoItem[] {
  return value
    .split("\n")
    .map((line) => {
      const [label, ...rest] = line.split("|");
      return { label: clean(label), value: clean(rest.join("|")) };
    })
    .filter((item): item is GuideQuickInfoItem => Boolean(item.label && item.value));
}

function formatQuickInfo(items?: GuideQuickInfoItem[]) {
  return (items || []).map((item) => `${item.label} | ${item.value}`).join("\n");
}

function parseFaqs(value: string): GuideFaq[] {
  return value
    .split(/\n\s*\n/)
    .map((block) => {
      const questionMatch = block.match(/(?:^|\n)\s*Question:\s*(.+)/i);
      const answerMatch = block.match(/(?:^|\n)\s*Answer:\s*([\s\S]+)/i);
      return {
        question: clean(questionMatch?.[1]),
        answer: clean(answerMatch?.[1]),
      };
    })
    .filter((faq): faq is GuideFaq => Boolean(faq.question && faq.answer));
}

function formatFaqs(faqs?: GuideFaq[]) {
  return (faqs || []).map((faq) => `Question: ${faq.question}\nAnswer: ${faq.answer}`).join("\n\n");
}

function lines(value: string) {
  return uniqueStrings(value.split("\n"));
}

function clean(value?: string) {
  return value?.trim() || undefined;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function blockTypeLabel(type: GuideContentBlockType) {
  return blockTypes.find((blockType) => blockType.value === type)?.label || "Guide block";
}
