export type TopicRouteClassification = "entity" | "guide-like-topic" | "thin-or-duplicate";

export type TopicRouteConversionAction =
  | "keep-as-entity"
  | "convert-to-guide-engine"
  | "merge-or-prune";

export type TopicPageRisk =
  | "admin-control-gap"
  | "duplicate-template"
  | "keyword-only-matching"
  | "thin-content"
  | "future-entity-needed";

export type GuideEngineBlockSource =
  | "destinations"
  | "cities"
  | "countries"
  | "guides"
  | "restaurants"
  | "hotels"
  | "car-rentals"
  | "attractions"
  | "custom-links";

export type GuideEngineBlockLayout = "grid" | "carousel" | "list" | "comparison" | "callout";

export type GuideEngineBlockItemRef = {
  type: GuideEngineBlockSource;
  id?: string;
  slug?: string;
  href?: string;
  title?: string;
  description?: string;
  image?: string;
};

export type GuideEngineListingBlock = {
  id: string;
  type: "listing";
  title: string;
  source: GuideEngineBlockSource;
  layout: GuideEngineBlockLayout;
  items?: GuideEngineBlockItemRef[];
  maxItems?: number;
};

export type GuideEngineNarrativeBlock = {
  id: string;
  type: "narrative";
  title?: string;
  body: string;
};

export type GuideEngineBlock = GuideEngineListingBlock | GuideEngineNarrativeBlock;

export type TopicRouteAuditItem = {
  routePattern: string;
  examplePath: string;
  classification: TopicRouteClassification;
  conversionAction: TopicRouteConversionAction;
  adminControlled: boolean;
  preserveIndexedUrl: boolean;
  risks: TopicPageRisk[];
  notes: string;
};

export const guideLikeCityTopicSlugs = ["best-places", "things-to-do", "travel-guide"] as const;

export const thinOrDuplicateCityTopicSlugs = [
  "best-cafes",
  "best-restaurants",
  "best-beaches",
  "family-attractions",
] as const;

export type GuideLikeCityTopicSlug = (typeof guideLikeCityTopicSlugs)[number];
export type ThinOrDuplicateCityTopicSlug = (typeof thinOrDuplicateCityTopicSlugs)[number];

const guideLikeCityTopicSlugSet = new Set<string>(guideLikeCityTopicSlugs);
const thinOrDuplicateCityTopicSlugSet = new Set<string>(thinOrDuplicateCityTopicSlugs);

export function isGuideLikeCityTopicRoute(pageSlug: string) {
  return guideLikeCityTopicSlugSet.has(pageSlug);
}

export function isThinOrDuplicateCityTopicRoute(pageSlug: string) {
  return thinOrDuplicateCityTopicSlugSet.has(pageSlug);
}

export function classifyCityProgrammaticRoute(pageSlug: string): TopicRouteClassification | "unknown" {
  if (isGuideLikeCityTopicRoute(pageSlug)) {
    return "guide-like-topic";
  }

  if (isThinOrDuplicateCityTopicRoute(pageSlug)) {
    return "thin-or-duplicate";
  }

  return "unknown";
}

export function shouldPrepareCityTopicForGuideEngine(pageSlug: string) {
  const classification = classifyCityProgrammaticRoute(pageSlug);
  return classification === "guide-like-topic" || classification === "thin-or-duplicate";
}
