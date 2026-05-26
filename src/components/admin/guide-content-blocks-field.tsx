"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
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

type SelectorItems = {
  destinations: SelectableItem[];
  cities: SelectableItem[];
  countries: SelectableItem[];
  guides: SelectableItem[];
  restaurants: SelectableItem[];
  activities: SelectableItem[];
};

const manualBlockTypes: Array<{ value: GuideContentBlockType; label: string }> = [
  { value: "hero", label: "Hero" },
  { value: "intro", label: "Intro" },
  { value: "overview", label: "Overview" },
  { value: "travel-tips", label: "Tips" },
  { value: "warnings", label: "Warnings" },
  { value: "best-time-to-visit", label: "Best time to visit" },
  { value: "cta", label: "CTA text" },
  { value: "car-rental-cta", label: "Car rental CTA" },
  { value: "newsletter-cta", label: "Newsletter CTA" },
  { value: "quick-info", label: "Quick info" },
  { value: "map", label: "Map" },
  { value: "faq", label: "FAQ" },
];

const entityBlockTypes: Array<{ value: GuideContentBlockType; label: string }> = [
  { value: "selected-destinations", label: "Destinations" },
  { value: "selected-cities", label: "Cities" },
  { value: "selected-countries", label: "Countries" },
  { value: "selected-restaurants", label: "Restaurants" },
  { value: "selected-activities", label: "Activities" },
  { value: "related-guides", label: "Guides" },
];

const blockTypes = [...manualBlockTypes, ...entityBlockTypes];
const selectorBlockTypes = entityBlockTypes.map((type) => type.value);
const listTextBlockTypes: GuideContentBlockType[] = ["travel-tips", "warnings", "best-time-to-visit"];
const ctaBlockTypes: GuideContentBlockType[] = ["cta", "car-rental-cta", "newsletter-cta"];

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
    () => ({ destinations, cities, countries, guides, restaurants, activities }),
    [destinations, cities, countries, guides, restaurants, activities],
  );
  const validationMessages = useMemo(
    () => blocks.map((block) => blockValidation(block, selectorItems)),
    [blocks, selectorItems],
  );
  const serializedBlocks = useMemo(() => JSON.stringify(toPayload(blocks)), [blocks]);
  const invalidCount = validationMessages.filter(Boolean).length;

  useEffect(() => {
    const handleImport = (event: Event) => {
      const detail = (event as CustomEvent<{ blocks?: GuideContentBlock[] }>).detail;

      if (!Array.isArray(detail?.blocks)) {
        return;
      }

      setBlocks(detail.blocks.map(normalizeEditableBlock));
      setCollapsedBlockIds([]);
    };

    window.addEventListener("guide-builder-import", handleImport);
    return () => window.removeEventListener("guide-builder-import", handleImport);
  }, []);

  return (
    <div className="grid gap-4">
      <input type="hidden" name="contentBlocks" value={serializedBlocks} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">Reusable content blocks</p>
          <p className="text-xs leading-5 text-slate-500">
            Build this guide from ordered manual and entity blocks. Move up/down keeps it lightweight.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2A66] shadow-sm transition hover:border-[#2563EB] hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
          onClick={() => setBlocks((current) => [...current, newBlock()])}
        >
          Add block
        </button>
      </div>

      {invalidCount > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {invalidCount} {invalidCount === 1 ? "block needs" : "blocks need"} attention. Invalid blocks are not saved
          until the highlighted fields are completed.
        </div>
      ) : null}

      {blocks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
          No page-builder blocks yet. Existing paragraph content and listing blocks will continue to render.
        </div>
      ) : null}

      <div className="grid gap-4">
        {blocks.map((block, blockIndex) => {
          const isCollapsed = collapsedBlockIds.includes(block.id);
          const validation = validationMessages[blockIndex];

          return (
            <section key={block.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
                    Block {blockIndex + 1}
                  </p>
                  <h4 className="mt-1 text-sm font-semibold text-slate-800">
                    {block.title?.trim() || blockTypeLabel(block.type)}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    {blockTypeLabel(block.type)} - {blockSummary(block)}
                  </p>
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
                  {validation ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      {validation}
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
                    <SmallField
                      label="Block title"
                      value={block.title || ""}
                      onChange={(title) => updateBlock(blockIndex, { title }, setBlocks)}
                      placeholder={titlePlaceholder(block.type)}
                    />
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold text-slate-600">Block type</span>
                      <select
                        value={block.type}
                        onChange={(event) =>
                          updateBlock(blockIndex, blockDefaultsForType(event.target.value as GuideContentBlockType), setBlocks)
                        }
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                      >
                        <optgroup label="Manual text blocks">
                          {manualBlockTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Entity blocks">
                          {entityBlockTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </label>
                  </div>

                  <BlockEditor
                    block={block}
                    blockIndex={blockIndex}
                    selectorItems={selectorItems}
                    setBlocks={setBlocks}
                  />
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function normalizeEditableBlock(block: GuideContentBlock): GuideContentBlock {
  return {
    ...block,
    itemIds: uniqueStrings(block.itemIds || []),
    quickInfo: block.quickInfo || [],
    tips: block.tips || [],
    faqs: block.faqs || [],
  };
}

function BlockEditor({
  block,
  blockIndex,
  selectorItems,
  setBlocks,
}: {
  block: GuideContentBlock;
  blockIndex: number;
  selectorItems: SelectorItems;
  setBlocks: Dispatch<SetStateAction<GuideContentBlock[]>>;
}) {
  if (selectorBlockTypes.includes(block.type)) {
    return (
      <ItemSelector
        type={block.type}
        items={itemsForType(block.type, selectorItems)}
        selectedIds={block.itemIds || []}
        onChange={(itemIds) => updateBlock(blockIndex, { itemIds }, setBlocks)}
      />
    );
  }

  if (block.type === "faq") {
    return (
      <KeyValueTextarea
        label="FAQ"
        value={formatFaqs(block.faqs)}
        onChange={(faqs) => updateBlock(blockIndex, { faqs: parseFaqs(faqs) }, setBlocks)}
        helperText="Use one Question/Answer pair per FAQ."
        placeholder={"Question: Is this guide suitable for first-time visitors?\nAnswer: Yes, it is written for simple planning."}
      />
    );
  }

  if (block.type === "quick-info") {
    return (
      <KeyValueTextarea
        label="Quick info"
        value={formatQuickInfo(block.quickInfo)}
        onChange={(quickInfo) => updateBlock(blockIndex, { quickInfo: parseQuickInfo(quickInfo) }, setBlocks)}
        helperText="Use Label | Value on each line."
        placeholder={"Duration | 2 to 3 days\nBest for | First-time visitors"}
      />
    );
  }

  if (listTextBlockTypes.includes(block.type)) {
    return (
      <div className="grid gap-4">
        <LargeTextField
          label={manualBodyLabel(block.type)}
          value={block.body || ""}
          onChange={(body) => updateBlock(blockIndex, { body }, setBlocks)}
          placeholder={manualBodyPlaceholder(block.type)}
        />
        <KeyValueTextarea
          label={listFieldLabel(block.type)}
          value={(block.tips || []).join("\n")}
          onChange={(tips) => updateBlock(blockIndex, { tips: lines(tips) }, setBlocks)}
          helperText="Optional. Add one line per item."
        />
      </div>
    );
  }

  if (ctaBlockTypes.includes(block.type)) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <LargeTextField
            label="CTA text"
            value={block.body || ""}
            onChange={(body) => updateBlock(blockIndex, { body }, setBlocks)}
            placeholder="Invite readers to book, enquire, subscribe, or continue planning."
          />
        </div>
        <SmallField
          label="Button text"
          value={block.ctaLabel || ""}
          onChange={(ctaLabel) => updateBlock(blockIndex, { ctaLabel }, setBlocks)}
          placeholder="Start planning"
        />
        <SmallField
          label="Button link"
          value={block.ctaHref || ""}
          onChange={(ctaHref) => updateBlock(blockIndex, { ctaHref }, setBlocks)}
          placeholder="/contact"
        />
      </div>
    );
  }

  if (block.type === "map") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <SmallField
          label="Map embed URL"
          value={block.mapEmbedUrl || ""}
          onChange={(mapEmbedUrl) => updateBlock(blockIndex, { mapEmbedUrl }, setBlocks)}
          placeholder="https://www.google.com/maps/embed?..."
        />
        <SmallField
          label="Map label"
          value={block.mapLabel || ""}
          onChange={(mapLabel) => updateBlock(blockIndex, { mapLabel }, setBlocks)}
          placeholder="Map of Muscat highlights"
        />
        <div className="md:col-span-2">
          <LargeTextField
            label="Intro text"
            value={block.body || ""}
            onChange={(body) => updateBlock(blockIndex, { body }, setBlocks)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <LargeTextField
        label={block.type === "intro" ? "Intro" : "Text"}
        value={block.body || ""}
        onChange={(body) => updateBlock(blockIndex, { body }, setBlocks)}
        placeholder={block.type === "intro" ? "Write the opening intro for this guide." : "Write the block text."}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <SmallField
          label="Eyebrow"
          value={block.eyebrow || ""}
          onChange={(eyebrow) => updateBlock(blockIndex, { eyebrow }, setBlocks)}
          placeholder="Travel guide"
        />
        <SmallField
          label="Image URL"
          value={block.image || ""}
          onChange={(image) => updateBlock(blockIndex, { image }, setBlocks)}
          placeholder="/uploads/guides/example.jpg"
        />
        <SmallField
          label="Image alt text"
          value={block.imageAlt || ""}
          onChange={(imageAlt) => updateBlock(blockIndex, { imageAlt }, setBlocks)}
          placeholder="Scenic travel image"
        />
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
  const [query, setQuery] = useState("");
  const selectedIdSet = new Set(selectedIds);
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) =>
      [item.label, item.meta].some((value) => value?.toLowerCase().includes(normalizedQuery)),
    );
  }, [items, query]);

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <label className="text-xs font-semibold text-slate-600" htmlFor={`builder-search-${type}`}>
          Select {blockTypeLabel(type).toLowerCase()}
        </label>
        <input
          id={`builder-search-${type}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${blockTypeLabel(type).toLowerCase()}...`}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <div className="grid max-h-72 gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const checked = selectedIdSet.has(item.id);

            return (
              <label key={item.id} className="flex gap-3 rounded-lg border border-slate-100 bg-white p-3 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(checked ? selectedIds.filter((id) => id !== item.id) : uniqueStrings([...selectedIds, item.id]))
                  }
                  className="mt-1"
                />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-800">{item.label}</span>
                  {item.meta ? <span className="mt-1 block text-xs text-slate-500">{item.meta}</span> : null}
                </span>
              </label>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            No records match this search.
          </div>
        )}
      </div>
    </div>
  );
}

function SmallField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function LargeTextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function KeyValueTextarea({
  label,
  value,
  onChange,
  helperText,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={5}
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
      />
      {helperText ? <span className="text-xs leading-5 text-slate-500">{helperText}</span> : null}
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

function newBlock(): GuideContentBlock {
  return {
    id: `guide-block-${Date.now()}`,
    type: "intro",
    title: "",
    body: "",
    itemIds: [],
  };
}

function blockDefaultsForType(type: GuideContentBlockType): Partial<GuideContentBlock> {
  return {
    type,
    itemIds: [],
    quickInfo: [],
    tips: [],
    faqs: [],
    mapEmbedUrl: "",
    ctaLabel: "",
    ctaHref: "",
  };
}

function itemsForType(type: GuideContentBlockType, items: SelectorItems) {
  if (type === "selected-destinations") return items.destinations;
  if (type === "selected-cities") return items.cities;
  if (type === "selected-countries") return items.countries;
  if (type === "selected-restaurants") return items.restaurants;
  if (type === "selected-activities") return items.activities;
  if (type === "related-guides") return items.guides;
  return [];
}

function blockValidation(block: GuideContentBlock, selectorItems: SelectorItems) {
  if (selectorBlockTypes.includes(block.type)) {
    const availableIds = new Set(itemsForType(block.type, selectorItems).map((item) => item.id));
    const selectedAvailableIds = uniqueStrings(block.itemIds || []).filter((id) => availableIds.has(id));
    return selectedAvailableIds.length > 0 ? "" : `Select at least one ${blockTypeLabel(block.type).toLowerCase()} record.`;
  }

  if (block.type === "faq") {
    return block.faqs?.length ? "" : "Add at least one FAQ using Question and Answer lines.";
  }

  if (block.type === "quick-info") {
    return block.quickInfo?.length ? "" : "Add at least one quick info row using Label | Value.";
  }

  if (block.type === "map") {
    return block.mapEmbedUrl?.trim() ? "" : "Add a map embed URL.";
  }

  if (listTextBlockTypes.includes(block.type)) {
    return block.body?.trim() || block.tips?.length ? "" : `Add ${manualBodyLabel(block.type).toLowerCase()} text or at least one list item.`;
  }

  if (ctaBlockTypes.includes(block.type)) {
    return block.body?.trim() || block.ctaLabel?.trim() || block.ctaHref?.trim() ? "" : "Add CTA text, button text, or a button link.";
  }

  return block.title?.trim() || block.body?.trim() || block.image?.trim() ? "" : "Add a title, text, or image for this block.";
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
          block.ctaHref ||
          block.ctaLabel,
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

function blockSummary(block: GuideContentBlock) {
  if (selectorBlockTypes.includes(block.type)) {
    const count = uniqueStrings(block.itemIds || []).length;
    return `${count} selected`;
  }

  if (block.type === "faq") {
    return `${block.faqs?.length || 0} FAQs`;
  }

  if (listTextBlockTypes.includes(block.type)) {
    return `${block.tips?.length || 0} list items`;
  }

  return block.body?.trim() ? "Text added" : "Draft";
}

function blockTypeLabel(type: GuideContentBlockType) {
  return blockTypes.find((blockType) => blockType.value === type)?.label || "Guide block";
}

function titlePlaceholder(type: GuideContentBlockType) {
  if (type === "intro") return "Introduction";
  if (type === "warnings") return "What to know before you go";
  if (type === "best-time-to-visit") return "Best time to visit";
  if (type === "cta") return "Plan your trip";
  return blockTypeLabel(type);
}

function manualBodyLabel(type: GuideContentBlockType) {
  if (type === "travel-tips") return "Tips";
  if (type === "warnings") return "Warnings";
  if (type === "best-time-to-visit") return "Best time to visit";
  return "Text";
}

function manualBodyPlaceholder(type: GuideContentBlockType) {
  if (type === "travel-tips") return "Write practical tips for this guide.";
  if (type === "warnings") return "Add cautions, closures, booking notes, or safety context.";
  if (type === "best-time-to-visit") return "Explain the best months, seasons, or times of day.";
  return "Write the block text.";
}

function listFieldLabel(type: GuideContentBlockType) {
  if (type === "warnings") return "Warnings, one per line";
  if (type === "best-time-to-visit") return "Season notes, one per line";
  return "Tips, one per line";
}
