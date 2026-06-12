import type {
  CarRentalBenefit,
  CarRentalDirectoryGroup,
  CarRentalDirectoryLink,
  CarRentalFaq,
  CarRentalLanguage,
  CarRentalLinkCard,
  CarRentalPage,
  CarRentalVehicleCategoryCard,
  ContentStatus,
} from "@/lib/types";
import { cleanPath, siteBaseUrl } from "@/lib/seo";

export const defaultDiscoverCarsAffiliateLink =
  "https://www.discovercars.com/?a_aid=top7spots&chan=locations";

export const defaultDiscoverCarsWidgetCode =
  '<div><script id="dchwidget" src="https://www.discovercars.com/widget.js?v1" data-dev-env="com" data-location="" data-utm-source="top7spots" data-utm-medium="widget" data-aff-code="a_aid" data-aff-channel="locations" data-autocomplete="on" data-style-submit-bg-color="#005b96" data-style-submit-font-color="#ffffff" data-style-form-bg-color="#fff7e6" data-style-form-font-color="#1f2937" data-style-submit-text="Find my cars" data-style-title-color="#111827" async="async" data-style_rounded_corners="on" data-localization_currency_box="on" data-layout_logo_style="on dark" data-layout_style_form_bg_color="#007ac2"></script></div>';

export const globalCarRentalSlug = "carrental";
export const globalCarRentalPath = "/carrental";

export function getDefaultCarRentalPath() {
  return globalCarRentalPath;
}

export type CarRentalImportInput = {
  language?: unknown;
  slug?: unknown;
  translationGroup?: unknown;
  countryName?: unknown;
  countrySlug?: unknown;
  cityName?: unknown;
  citySlug?: unknown;
  pageType?: unknown;
  status?: unknown;
  pageTitle?: unknown;
  seoTitle?: unknown;
  metaDescription?: unknown;
  canonicalUrl?: unknown;
  ogImage?: unknown;
  hero?: {
    title?: unknown;
    subtitle?: unknown;
    chips?: unknown;
  };
  widget?: {
    heading?: unknown;
    introText?: unknown;
    discovercarsWidgetCode?: unknown;
    discovercarsAffiliateLink?: unknown;
    discovercarsAffiliateId?: unknown;
    discovercarsChannel?: unknown;
  };
  benefits?: unknown;
  vehicleCategoryCards?: unknown;
  description?: {
    title?: unknown;
    previewText?: unknown;
    fullText?: unknown;
    image?: unknown;
  };
  popularLocations?: unknown;
  guides?: unknown;
  destinations?: unknown;
  directoryGroups?: unknown;
  faqs?: unknown;
};

export type CarRentalImportResult =
  | { ok: true; page: CarRentalPage; widgetCodeDefaulted: boolean }
  | { ok: false; errors: string[] };

export function carRentalPublicPath(page: Pick<CarRentalPage, "language" | "slug">) {
  return page.language === "ar" ? `/ar/${page.slug}` : `/${page.slug}`;
}

export function carRentalCanonicalUrl(page: Pick<CarRentalPage, "language" | "slug" | "canonicalUrl">) {
  return page.canonicalUrl.trim() || new URL(cleanPath(carRentalPublicPath(page)), siteBaseUrl).toString();
}

export function normalizeCarRentalImport(input: CarRentalImportInput, existingId?: string): CarRentalImportResult {
  const errors: string[] = [];
  const language = normalizeLanguage(input.language);
  const slug = slugValue(input.slug);
  const translationGroup = slugValue(input.translationGroup);
  const status = normalizeStatus(input.status);
  const pageTitle = textValue(input.pageTitle);
  const heroTitle = textValue(input.hero?.title);
  const widgetCode = textValue(input.widget?.discovercarsWidgetCode);

  if (!language) {
    errors.push('Language must be "en" or "ar".');
  }

  if (!slug) {
    errors.push("Slug is required.");
  }

  if (!translationGroup) {
    errors.push("Translation group is required.");
  }

  if (!pageTitle) {
    errors.push("Page title is required.");
  }

  if (!heroTitle) {
    errors.push("Hero title is required.");
  }

  if (!status) {
    errors.push('Status must be "draft" or "published".');
  }

  if (errors.length > 0 || !language || !status) {
    return { ok: false, errors };
  }

  const now = new Date().toISOString();
  const page: CarRentalPage = {
    id: existingId || crypto.randomUUID(),
    language,
    slug,
    translationGroup,
    countryName: textValue(input.countryName),
    countrySlug: slugValue(input.countrySlug) || slugValue(input.countryName),
    cityName: textValue(input.cityName),
    citySlug: slugValue(input.citySlug) || slugValue(input.cityName),
    pageType: normalizePageType(input.pageType),
    status,
    pageTitle,
    seoTitle: textValue(input.seoTitle),
    metaDescription: textValue(input.metaDescription),
    canonicalUrl: textValue(input.canonicalUrl),
    ogImage: textValue(input.ogImage),
    heroTitle,
    heroSubtitle: textValue(input.hero?.subtitle),
    heroChips: stringArray(input.hero?.chips),
    widgetHeading: textValue(input.widget?.heading),
    widgetIntroText: textValue(input.widget?.introText),
    discovercarsWidgetCode: widgetCode || defaultDiscoverCarsWidgetCode,
    discovercarsAffiliateLink: textValue(input.widget?.discovercarsAffiliateLink) || defaultDiscoverCarsAffiliateLink,
    discovercarsAffiliateId: textValue(input.widget?.discovercarsAffiliateId) || "top7spots",
    discovercarsChannel: textValue(input.widget?.discovercarsChannel) || "locations",
    benefits: normalizeBenefits(input.benefits),
    vehicleCategoryCards: normalizeVehicleCategoryCards(input.vehicleCategoryCards),
    descriptionTitle: textValue(input.description?.title),
    descriptionPreviewText: textValue(input.description?.previewText),
    descriptionFullText: textValue(input.description?.fullText),
    descriptionImage: textValue(input.description?.image),
    popularLocationCards: normalizeCards(input.popularLocations),
    guideCards: normalizeCards(input.guides),
    destinationCards: normalizeCards(input.destinations),
    directoryGroups: normalizeDirectoryGroups(input.directoryGroups),
    faqs: normalizeFaqs(input.faqs),
    createdAt: now,
    updatedAt: now,
  };

  return { ok: true, page, widgetCodeDefaulted: !widgetCode };
}

export function parseJsonArray<T>(value: FormDataEntryValue | null, fallback: T[] = []): T[] {
  const text = String(value ?? "").trim();

  if (!text) {
    return fallback;
  }

  const parsed = JSON.parse(text);

  if (!Array.isArray(parsed)) {
    throw new Error("JSON value must be an array.");
  }

  return parsed;
}

export function prettyJson(value: unknown) {
  return JSON.stringify(value ?? [], null, 2);
}

export function normalizeCarRentalPageDraft(page: CarRentalPage): CarRentalPage {
  return {
    ...page,
    language: normalizeLanguage(page.language) || "en",
    slug: slugValue(page.slug),
    translationGroup: slugValue(page.translationGroup),
    countryName: page.countryName.trim(),
    countrySlug: slugValue(page.countrySlug) || slugValue(page.countryName),
    cityName: page.cityName.trim(),
    citySlug: slugValue(page.citySlug) || slugValue(page.cityName),
    pageType: normalizePageType(page.pageType),
    status: normalizeStatus(page.status) || "draft",
    heroChips: stringArray(page.heroChips),
    benefits: normalizeBenefits(page.benefits),
    vehicleCategoryCards: normalizeVehicleCategoryCards(page.vehicleCategoryCards),
    popularLocationCards: normalizeCards(page.popularLocationCards),
    guideCards: normalizeCards(page.guideCards),
    destinationCards: normalizeCards(page.destinationCards),
    directoryGroups: normalizeDirectoryGroups(page.directoryGroups),
    faqs: normalizeFaqs(page.faqs),
    discovercarsWidgetCode: page.discovercarsWidgetCode || defaultDiscoverCarsWidgetCode,
    discovercarsAffiliateLink: page.discovercarsAffiliateLink || defaultDiscoverCarsAffiliateLink,
    discovercarsAffiliateId: page.discovercarsAffiliateId || "top7spots",
    discovercarsChannel: page.discovercarsChannel || "locations",
  };
}

function normalizeLanguage(value: unknown): CarRentalLanguage | null {
  return value === "en" || value === "ar" ? value : null;
}

function normalizeStatus(value: unknown): ContentStatus | null {
  return value === "draft" || value === "published" ? value : null;
}

function normalizePageType(value: unknown) {
  return value === "global" || value === "country" || value === "city" || value === "airport" ? value : "";
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function slugValue(value: unknown) {
  return textValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function visibleValue(value: unknown) {
  return typeof value === "boolean" ? value : String(value ?? "true").toLowerCase() !== "false";
}

function stringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => textValue(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .flatMap((line) => line.split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null && !Array.isArray(item))
    : [];
}

function normalizeBenefits(value: unknown): CarRentalBenefit[] {
  return records(value)
    .map((item, index) => ({
      title: textValue(item.title),
      description: textValue(item.description),
      icon: textValue(item.icon) || textValue(item.key),
      sortOrder: numberValue(item.sortOrder, index),
    }))
    .filter((item) => item.title || item.description)
    .sort(sortByOrder);
}

function normalizeCards(value: unknown): CarRentalLinkCard[] {
  return records(value)
    .map((item, index) => ({
      title: textValue(item.title),
      url: textValue(item.url),
      description: textValue(item.description) || textValue(item.shortDescription),
      image: textValue(item.image) || textValue(item.icon),
      label: textValue(item.label) || textValue(item.category) || textValue(item.subtitle),
      sortOrder: numberValue(item.sortOrder, index),
      visible: visibleValue(item.visible),
    }))
    .filter((item) => item.title && item.url && item.visible)
    .sort(sortByOrder);
}

function normalizeVehicleCategoryCards(value: unknown): CarRentalVehicleCategoryCard[] {
  return records(value)
    .map((item, index) => ({
      title: textValue(item.title),
      image: textValue(item.image),
      startingPrice: textValue(item.startingPrice) || textValue(item.price),
      buttonText: textValue(item.buttonText) || "Find Available Cars",
      sortOrder: numberValue(item.sortOrder, index),
      visible: visibleValue(item.visible),
    }))
    .filter((item) => item.title && item.visible)
    .sort(sortByOrder);
}

function normalizeDirectoryGroups(value: unknown): CarRentalDirectoryGroup[] {
  return records(value)
    .map((item, index) => ({
      title: textValue(item.title) || textValue(item.name),
      sortOrder: numberValue(item.sortOrder, index),
      links: normalizeDirectoryLinks(item.links),
    }))
    .filter((item) => item.title && item.links.length > 0)
    .sort(sortByOrder);
}

function normalizeDirectoryLinks(value: unknown): CarRentalDirectoryLink[] {
  return records(value)
    .map((item, index) => ({
      text: textValue(item.text) || textValue(item.title) || textValue(item.label),
      url: textValue(item.url),
      sortOrder: numberValue(item.sortOrder, index),
    }))
    .filter((item) => item.text && item.url)
    .sort(sortByOrder);
}

function normalizeFaqs(value: unknown): CarRentalFaq[] {
  return records(value)
    .map((item, index) => ({
      question: textValue(item.question),
      answer: textValue(item.answer),
      sortOrder: numberValue(item.sortOrder, index),
      visible: visibleValue(item.visible),
    }))
    .filter((item) => item.question && item.answer && item.visible)
    .sort(sortByOrder);
}

function sortByOrder<T extends { sortOrder: number }>(a: T, b: T) {
  return a.sortOrder - b.sortOrder;
}
