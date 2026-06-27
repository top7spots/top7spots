import { slugify } from "@/lib/format";
import type {
  GuideContentBlock,
  GuideContentBlockType,
  GuideFaq,
  GuideQuickInfoItem,
} from "@/lib/types";

const guideContentBlockTypes: GuideContentBlockType[] = [
  "hero",
  "quick-answer",
  "intro",
  "overview",
  "selected-destinations",
  "selected-cities",
  "selected-countries",
  "selected-restaurants",
  "selected-activities",
  "quick-info",
  "map",
  "travel-tips",
  "warnings",
  "best-time-to-visit",
  "estimated-cost",
  "cta",
  "car-rental-cta",
  "related-guides",
  "faq",
  "newsletter-cta",
];

export function normalizeGuideContentBlocks(value: unknown): GuideContentBlock[] {
  const parsedValue = typeof value === "string" ? parseJson(value) : value;

  if (!Array.isArray(parsedValue)) {
    return [];
  }

  return parsedValue
    .filter(isRecord)
    .map((block, index) => normalizeGuideContentBlock(block, index))
    .filter((block): block is GuideContentBlock => Boolean(block));
}

function normalizeGuideContentBlock(block: Record<string, unknown>, index: number) {
  const type = normalizeBlockType(block.type);

  if (!type) {
    return undefined;
  }

  const id = stringValue(block.id) || `${type}-${index + 1}`;
  const normalizedBlock: GuideContentBlock = {
    id: slugify(id) || `${type}-${index + 1}`,
    type,
    title: optionalString(block.title),
    eyebrow: optionalString(block.eyebrow),
    body: optionalString(block.body),
    image: optionalString(block.image),
    imageAlt: optionalString(block.imageAlt),
    itemIds: stringArrayValue(block.itemIds),
    quickInfo: quickInfoValue(block.quickInfo ?? block.quick_info),
    estimatedCost: quickInfoValue(block.estimatedCost ?? block.estimated_cost),
    tips: stringArrayValue(block.tips),
    faqs: faqValue(block.faqs),
    mapEmbedUrl: optionalString(block.mapEmbedUrl),
    mapLabel: optionalString(block.mapLabel),
    ctaLabel: optionalString(block.ctaLabel),
    ctaHref: optionalString(block.ctaHref),
    ctaTargetBlank: booleanValue(block.ctaTargetBlank),
    ctaRel: ctaRelValue(block.ctaRel),
  };

  if (!hasBlockContent(normalizedBlock)) {
    return undefined;
  }

  return normalizedBlock;
}

function hasBlockContent(block: GuideContentBlock) {
  return Boolean(
    block.title ||
      block.body ||
      block.image ||
      block.itemIds?.length ||
      block.quickInfo?.length ||
      block.estimatedCost?.length ||
      block.tips?.length ||
      block.faqs?.length ||
      block.mapEmbedUrl ||
      block.ctaHref ||
      block.ctaLabel,
  );
}

function quickInfoValue(value: unknown): GuideQuickInfoItem[] {
  if (typeof value === "string") {
    return quickInfoStringValue(value);
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      label: stringValue(item.label),
      value: stringValue(item.value),
    }))
    .filter((item) => item.label && item.value && !isPlaceholderQuickInfo(item));
}

function quickInfoStringValue(value: string): GuideQuickInfoItem[] {
  return value
    .split(/\r?\n/)
    .map((line) => {
      const [label, ...rest] = line.split("|");
      return {
        label: stringValue(label),
        value: stringValue(rest.join("|")),
      };
    })
    .filter((item) => item.label && item.value && !isPlaceholderQuickInfo(item));
}

function faqValue(value: unknown): GuideFaq[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      question: stringValue(item.question),
      answer: stringValue(item.answer),
    }))
    .filter((item) => item.question && item.answer);
}

function normalizeBlockType(value: unknown): GuideContentBlockType | undefined {
  const type = stringValue(value) as GuideContentBlockType;
  return guideContentBlockTypes.includes(type) ? type : undefined;
}

function stringArrayValue(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.map((item) => stringValue(item)).filter(Boolean)));
}

function parseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function optionalString(value: unknown) {
  return stringValue(value) || undefined;
}

function booleanValue(value: unknown) {
  return value === true || value === "true" || value === "on";
}

function ctaRelValue(value: unknown) {
  const rel = stringValue(value);
  return rel === "nofollow" || rel === "sponsored" ? rel : "normal";
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function isPlaceholderQuickInfo(item: GuideQuickInfoItem) {
  return item.label.toLowerCase() === "label" && item.value.toLowerCase() === "value";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
