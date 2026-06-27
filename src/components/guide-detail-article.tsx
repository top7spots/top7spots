import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock,
  Globe2,
  Hash,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { VehicleCategoryCardsBlock } from "@/components/car-rental/vehicle-category-cards-block";
import {
  GuideArticleToc,
  ReadingProgress,
  type GuideTocItem,
} from "@/components/guides/guide-article-enhancements";
import { GuideEntityCard, type GuideEntityCardItem } from "@/components/guides/guide-entity-card";
import {
  buildGuideArticleJsonLd,
  buildGuideBreadcrumbJsonLd,
  buildGuideFaqJsonLd,
  buildGuideItemListJsonLd,
  JsonLd,
} from "@/components/seo-json-ld";
import { Badge } from "@/components/ui/badge";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCanonicalDestinationPath } from "@/lib/city-intelligence";
import { countryPath } from "@/lib/country-hubs";
import {
  resolveGuideListingBlocks,
  type ResolvedGuideListingBlock,
  type ResolvedGuideListingBlockItem,
} from "@/lib/guide-listing-blocks";
import { getGuideHref } from "@/lib/guide-routes";
import {
  attractionImageAlt,
  cityImageAlt,
  destinationImageAlt,
  guideImageAlt,
  restaurantImageAlt,
} from "@/lib/image-seo";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/image-performance";
import { resolveImagePath } from "@/lib/images";
import { citySeoPath, cityTopicPages } from "@/lib/programmatic-seo";
import type {
  Attraction,
  Author,
  City,
  Destination,
  Guide,
  GuideContentBlock as GuideCmsBlock,
  GuideItineraryItem,
  GuideFaq,
  GuideQuickInfoItem,
  GuideRouteData,
  GuideSelectedItem,
  Restaurant,
} from "@/lib/types";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type GuideFaqItem = {
  question: string;
  answer: string;
};

type GuideDetailArticleProps = {
  guide: Guide;
  author?: Author;
  city?: City;
  canonicalPath: string;
  breadcrumbItems: BreadcrumbItem[];
  includeCityInBreadcrumbJson?: boolean;
  backHref: string;
  backLabel: string;
  guides: Guide[];
  cities: City[];
  destinations: Destination[];
  listingDestinations?: Destination[];
  restaurants?: Restaurant[];
  attractions: Attraction[];
  descriptionFallback: string;
};

type GuideArticleContentBlock =
  | {
      kind: "heading";
      key: string;
      id: string;
      level: 2 | 3;
      title: string;
    }
  | {
      kind: "paragraph";
      key: string;
      text: string;
    }
  | {
      kind: "list";
      key: string;
      id: string;
      section: InlineListSection;
    }
  | {
      kind: "bullets";
      key: string;
      items: string[];
    }
  | {
      kind: "divider";
      key: string;
    };

type ContextualEntityType = "destination" | "attraction" | "restaurant" | "city" | "country" | "guide";

type ContextualEntity = GuideEntityCardItem & {
  entityType: ContextualEntityType;
  aliases: string[];
  citySlug?: string;
  countrySlug?: string;
  keywords: string[];
};

type ContextualEntitySection = {
  title: string;
  items: ContextualEntity[];
};

type StructuredSelectedItem = ResolvedGuideListingBlockItem & {
  itemType: GuideSelectedItem["type"];
  displayOrder: number;
  bestFor?: string;
  suggestedTime?: string;
  nearbyPlaces: string[];
  readMoreLabel?: string;
};

type EntityMention = {
  entity: ContextualEntity;
  start: number;
  end: number;
  text: string;
};

export function GuideDetailArticle({
  guide,
  author,
  city,
  canonicalPath,
  breadcrumbItems,
  includeCityInBreadcrumbJson = false,
  backHref,
  backLabel,
  guides,
  cities,
  destinations,
  listingDestinations,
  restaurants = [],
  attractions,
  descriptionFallback,
}: GuideDetailArticleProps) {
  const heroBlock = guide.contentBlocks.find((block) => block.type === "hero");
  const storedPageBlocks = guide.contentBlocks.filter((block) => block.type !== "hero");
  const heroTitle = heroBlock?.title || guide.title;
  const splitHeroDescription = splitQuickAnswerFromText(heroBlock?.body || guide.excerpt || descriptionFallback);
  const heroDescription = splitHeroDescription.description;
  const quickAnswerFallbackBlock: GuideCmsBlock | undefined =
    splitHeroDescription.quickAnswer && !storedPageBlocks.some((block) => block.type === "quick-answer")
      ? {
          id: "quick-answer",
          type: "quick-answer",
          title: "Quick Answer",
          body: splitHeroDescription.quickAnswer,
        }
      : undefined;
  const pageBlocks = quickAnswerFallbackBlock ? [quickAnswerFallbackBlock, ...storedPageBlocks] : storedPageBlocks;
  const cleanCategory = cleanGuideDisplayLabel(guide.category);
  const cleanHeroEyebrow = cleanGuideDisplayLabel(heroBlock?.eyebrow);
  const heroImage = heroBlock?.image || guide.coverImage || guide.image;
  const image = resolveImagePath(heroImage);
  const imageAlt = heroBlock?.imageAlt || guideImageAlt(guide);
  const updatedDate = formatDate(guide.updatedAt || guide.createdAt);
  const similarGuides = resolveSimilarGuides(guide, guides, city).slice(0, 10);
  const listingBlocks = resolveGuideListingBlocks({
    blocks: guide.listingBlocks,
    cities,
    destinations: listingDestinations ?? destinations,
    guides,
    restaurants,
    attractions,
    currentGuideId: guide.id,
  });
  const hasPageBlocks = pageBlocks.length > 0;
  const mainPageBlocks = pageBlocks;
  const ctaDestinations = destinations
    .filter((destination) => !guide.relatedPlaceSlugs.includes(destination.slug))
    .slice(0, 4);
  const contentBlocks = buildGuideArticleContentBlocks(
    guide.content.length > 0 ? guide.content : ["More travel notes are being shaped for this guide."],
    guide.tableOfContents,
  );
  const contextualEntities = buildContextualEntityIndex({
    currentGuide: guide,
    city,
    cities,
    destinations: listingDestinations ?? destinations,
    attractions,
    restaurants,
    guides,
  });
  const contextualSections = buildContextualEntitySections({
    blocks: contentBlocks,
    entities: contextualEntities,
    currentCitySlug: guide.citySlug || city?.slug,
    currentCountrySlug: guide.countryId || city?.country,
  });
  const legacyFaqItems = mergeFaqItems(guide.faqs, extractFaqsFromContent(guide.content));
  const structuredSelectedItems = resolveStructuredSelectedItems({
    selectedItems: guide.guideSelectedItems,
    cities,
    destinations: listingDestinations ?? destinations,
    attractions,
    restaurants,
    guides,
  });
  const displayPageBlocks =
    structuredSelectedItems.length > 0
      ? mainPageBlocks.filter((block) => !isSelectedReusableContentBlock(block.type))
      : guide.guideType === "best_places"
        ? mainPageBlocks.filter((block) => block.type !== "selected-countries")
        : mainPageBlocks;
  const renderPageBlocks = dedupeEstimatedCostBlocks(displayPageBlocks).filter(isRenderableGuidePageBlock);
  const faqPageBlocks = hasPageBlocks ? renderPageBlocks.filter((block) => block.type === "faq") : [];
  const blockFaqItems = mergeFaqItems(faqPageBlocks.flatMap((block) => block.faqs || []));
  const visibleFaqItems = faqPageBlocks.length > 0 ? blockFaqItems : legacyFaqItems;
  const contentListingBlocks = renderPageBlocks
    .map((block) =>
      listingBlockForContentBlock(block, {
        guide,
        listingBlocks,
        cities,
        destinations: listingDestinations ?? destinations,
        attractions,
        restaurants,
        guides,
      }),
    )
    .filter((block): block is ResolvedGuideListingBlock => Boolean(block));
  const allListingBlocks = [...listingBlocks, ...contentListingBlocks];
  const primaryPageBlocks = hasPageBlocks ? renderPageBlocks.filter((block) => block.type !== "faq") : [];
  const bestPlacesIntroBlocks = guide.guideType === "best_places"
    ? primaryPageBlocks.filter((block) => block.type === "quick-answer" || block.type === "intro" || block.type === "overview")
    : [];
  const bestPlacesLaterBlocks = guide.guideType === "best_places"
    ? primaryPageBlocks.filter((block) => block.type !== "quick-answer" && block.type !== "intro" && block.type !== "overview")
    : primaryPageBlocks;
  const structuredGuideSections = (
    <GuideTypeSections
      guide={guide}
      selectedItems={structuredSelectedItems}
      destinations={listingDestinations ?? destinations}
    />
  );
  const selectedItemListItems = guideItemListEntries(allListingBlocks);
  const structuredItemListItems = structuredGuideItemListEntries(
    guide,
    structuredSelectedItems,
    listingDestinations ?? destinations,
  );
  const renderedListingBlocks = hasPageBlocks ? contentListingBlocks : listingBlocks;
  const tocItems = buildGuideTocItems({
    city,
    guide,
    hasPageBlocks,
    pageBlocks: renderPageBlocks,
    legacyBlocks: contentBlocks,
    renderedListingBlocks,
    hasStructuredSelectedItems: structuredSelectedItems.length > 0,
    visibleFaqItems,
  });
  const guideArticleBody = hasPageBlocks ? (
    <>
      {guide.guideType === "best_places" && bestPlacesIntroBlocks.length > 0 ? (
        <div className="grid gap-5">
          <GuidePageBlocks
            guide={guide}
            blocks={bestPlacesIntroBlocks}
            listingBlocks={listingBlocks}
            cities={cities}
            destinations={listingDestinations ?? destinations}
            attractions={attractions}
            restaurants={restaurants}
            guides={guides}
          />
        </div>
      ) : null}
      {structuredGuideSections}
      <div className="grid gap-5">
        <div className="grid min-w-0 gap-5">
          <GuidePageBlocks
            guide={guide}
            blocks={bestPlacesLaterBlocks}
            listingBlocks={listingBlocks}
            cities={cities}
            destinations={listingDestinations ?? destinations}
            attractions={attractions}
            restaurants={restaurants}
            guides={guides}
          />
        </div>
      </div>
      {faqPageBlocks.length > 0 ? (
        <div className="mt-6 grid gap-5">
          <GuidePageBlocks
            guide={guide}
            blocks={faqPageBlocks}
            listingBlocks={listingBlocks}
            cities={cities}
            destinations={listingDestinations ?? destinations}
            attractions={attractions}
            restaurants={restaurants}
            guides={guides}
          />
        </div>
      ) : legacyFaqItems.length > 0 ? (
        <div className="mt-6 grid gap-5">
          <ServerGuideFaqAccordion faqs={legacyFaqItems} />
        </div>
      ) : null}
    </>
  ) : (
    <div className="mx-auto grid min-w-0 max-w-3xl gap-5">
      {structuredGuideSections}
      <WhyVisitSection guide={guide} city={city} description={heroDescription} />
      {contentBlocks.map((block) => (
        <ArticleBlockGroup
          key={block.key}
          block={block}
          entities={contextualEntities}
          contextualSection={contextualSections.get(block.key)}
        />
      ))}
      {listingBlocks.map((block) => (
        <GuideListingBlockSection key={block.id} block={block} />
      ))}
      <ServerGuideFaqAccordion faqs={legacyFaqItems} />
    </div>
  );
  const jsonLd = [
    buildGuideArticleJsonLd({ guide, canonicalPath, author }),
    buildGuideBreadcrumbJsonLd({
      guide,
      canonicalPath,
      city,
      includeCity: includeCityInBreadcrumbJson,
    }),
    buildGuideFaqJsonLd({ faqs: visibleFaqItems }),
    buildGuideItemListJsonLd({
      canonicalPath,
      name: `${guide.title} selected places`,
      items: dedupeItemListEntries([...structuredItemListItems, ...selectedItemListItems]),
    }),
  ].filter((item): item is Record<string, unknown> => Boolean(item));

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#111827]">
      <ReadingProgress />
      {jsonLd.map((data) => (
        <JsonLd key={String(data["@id"] || data["@type"])} data={data} />
      ))}
      <SiteHeader />
      <GuideInfoBar
        breadcrumbItems={breadcrumbItems}
        backHref={backHref}
        backLabel={backLabel}
        readTime={guide.readTime}
        updatedDate={updatedDate}
      />
      <main>
        <section className="pb-10">
          <div className="relative isolate min-h-[27rem] overflow-hidden bg-[#0A2A66] shadow-[0_24px_70px_rgba(15,23,42,0.18)] md:min-h-[37rem]">
            {heroImage ? (
              <SafeImage
                src={image}
                alt={imageAlt}
                fill
                priority
                sizes={IMAGE_SIZES.fullHero}
                quality={IMAGE_QUALITY.hero}
                className="object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-[#071E45]/20" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,30,69,0.84)_0%,rgba(7,30,69,0.58)_36%,rgba(7,30,69,0.16)_68%,rgba(7,30,69,0)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(0deg,rgba(7,30,69,0.58)_0%,rgba(7,30,69,0)_100%)]" />
            <div className="relative z-10 mx-auto flex min-h-[27rem] max-w-7xl items-end px-4 py-6 sm:px-6 md:min-h-[37rem] md:py-8 lg:px-8 lg:py-12">
              <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {guide.isFeatured ? (
                      <Badge className="rounded-full bg-[#FF6B00] px-3 py-1 text-white hover:bg-[#FF6B00]">
                        Featured guide
                      </Badge>
                    ) : null}
                    <Badge className="rounded-full border border-white/20 bg-white/12 px-3 py-1 text-white backdrop-blur hover:bg-white/12">
                      {cleanHeroEyebrow || cleanCategory || guideTypeLabel(guide.guideType)}
                    </Badge>
                  </div>
                  <h1 className="mt-5 text-[2.1rem] font-semibold leading-[1.06] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                    {heroTitle}
                  </h1>
                  <p className="mt-5 max-w-2xl text-base leading-7 text-white/84 md:text-[1.0625rem] md:leading-8">
                    {heroDescription}
                  </p>
                  <GuideAuthorByline guide={guide} author={author} tone="dark" />
                  <HeroQuickChips guide={guide} city={city} updatedDate={updatedDate} tone="dark" />
              </div>
            </div>
          </div>
        </section>

        <article className="mx-auto max-w-7xl px-4 pb-10 pt-1 sm:px-6 lg:px-8">
          {tocItems.length > 0 ? (
            <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
              <GuideArticleToc items={tocItems} />
              <div className="min-w-0 xl:self-start">{guideArticleBody}</div>
            </div>
          ) : (
            guideArticleBody
          )}
        </article>

        <VehicleCategoryCardsBlock
          title="Need a Rental Car for Your Trip?"
          subtitle="Compare popular vehicle categories and choose a rental car that fits your route, luggage, and travel style."
          label="CAR RENTAL"
          variant="full"
          className="pt-0"
        />

        <article className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <GuideAuthorBioCard guide={guide} author={author} />
        </article>

        <GuidePlanningCta city={city} destinations={ctaDestinations} />

        {similarGuides.length > 0 ? <SimilarGuidesGrid guides={similarGuides.slice(0, 6)} /> : null}
      </main>
      <SiteFooter />
    </div>
  );
}

function GuidePlanningCta({ city, destinations }: { city?: City; destinations: Destination[] }) {
  if (!city && destinations.length === 0) {
    return null;
  }

  return (
    <section className="border-y border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 rounded-[2rem] bg-[#0A2A66] p-6 text-white shadow-xl shadow-blue-950/10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center lg:p-8">
        <div>
          <Sparkles className="size-7 text-orange-300" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">Use this guide to shape a route</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-50">
            Top7Spots is built for discovery and inspiration, keeping travel planning fast,
            visual, and easy to revisit.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {city ? (
            <>
              <GuideCtaLink href={`/${city.slug}`}>Explore {city.name}</GuideCtaLink>
              {cityTopicPages.slice(0, 3).map((topic) => (
                <GuideCtaLink key={topic.slug} href={citySeoPath(city.slug, topic.slug)}>
                  {topic.title(city)}
                </GuideCtaLink>
              ))}
            </>
          ) : null}
          {destinations.slice(0, 4).map((destination) => (
            <GuideCtaLink key={destination.id} href={getCanonicalDestinationPath(destination, city)}>
              {destination.name}
            </GuideCtaLink>
          ))}
        </div>
      </div>
    </section>
  );
}

function GuideCtaLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15 hover:text-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
    >
      {children}
    </Link>
  );
}

function GuideInfoBar({
  breadcrumbItems,
  backHref,
  backLabel,
  readTime,
  updatedDate,
}: {
  breadcrumbItems: BreadcrumbItem[];
  backHref: string;
  backLabel: string;
  readTime: string;
  updatedDate: string;
}) {
  const pathItems = [{ label: "Home", href: "/" }, ...breadcrumbItems];

  return (
    <div className="hidden border-b border-white/50 bg-[#F8F5EE]/82 px-4 py-3 shadow-[0_14px_35px_rgba(15,23,42,0.07)] backdrop-blur-xl md:sticky md:top-16 md:z-30 md:block sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-white text-[#0A2A66] shadow-sm transition hover:border-[#FF6B00] hover:text-[#FF6B00]"
            aria-label={backLabel}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            {pathItems.map((item, index) => (
              <span key={`${item.label}-${item.href || "current"}`} className="flex min-w-0 items-center gap-2">
                {index > 0 ? <span className="text-slate-300">/</span> : null}
                {item.href ? (
                  <Link href={item.href} className="max-w-[12rem] truncate transition hover:text-[#FF6B00] md:max-w-[16rem]">
                    {item.label}
                  </Link>
                ) : (
                  <span className="max-w-[14rem] truncate text-slate-700 md:max-w-[22rem]">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          {readTime ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 shadow-sm">
              <Clock className="size-3.5 text-[#FF6B00]" aria-hidden="true" />
              {readTime}
            </span>
          ) : null}
          {updatedDate ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 shadow-sm">
              <CalendarDays className="size-3.5 text-[#FF6B00]" aria-hidden="true" />
              Updated {updatedDate}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GuideAuthorByline({
  guide,
  author,
  tone = "light",
}: {
  guide: Guide;
  author?: Author;
  tone?: "light" | "dark";
}) {
  const authorName = author?.name || guide.author;

  if (!authorName) {
    return null;
  }
  const isDark = tone === "dark";

  const byline = (
    <div className={`mt-5 flex items-center gap-3 text-sm ${isDark ? "text-white/78" : "text-slate-600"}`}>
      <AuthorAvatar author={author} fallbackName={authorName} size="sm" />
      <div>
        <p className={`font-semibold ${isDark ? "text-white" : "text-[#1F2937]"}`}>{authorName}</p>
        <p className={`mt-0.5 text-xs leading-5 ${isDark ? "text-white/66" : "text-slate-500"}`}>
          {author?.role || "Top7Spots editorial"}
        </p>
      </div>
    </div>
  );

  return author ? (
    <Link href={`/authors/${author.slug}`} className="inline-flex rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]">
      {byline}
    </Link>
  ) : (
    byline
  );
}

function GuideAuthorBioCard({ guide, author }: { guide: Guide; author?: Author }) {
  const authorName = author?.name || guide.author;

  if (!authorName) {
    return null;
  }

  return (
    <section className="mt-8 rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)] md:p-7" aria-label="About the author">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <AuthorAvatar author={author} fallbackName={authorName} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#FF6B00]">Written by</p>
          <h2 className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-[#111827]">
            {authorName}
          </h2>
          {author?.role || author?.location ? (
            <p className="mt-1 text-sm font-medium text-slate-500">
              {[author.role, author.location].filter(Boolean).join(" - ")}
            </p>
          ) : null}
          {author?.shortBio ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base md:leading-7">
              {author.shortBio}
            </p>
          ) : (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base md:leading-7">
              Top7Spots editorial guides focus on practical, easy-to-scan travel planning.
            </p>
          )}
          {author?.expertise?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {author.expertise.slice(0, 5).map((item) => (
                <span key={item} className="rounded-full border border-orange-100 bg-[#FCFBF8] px-3 py-1 text-xs font-semibold text-slate-600">
                  {item}
                </span>
              ))}
            </div>
          ) : null}
          {author ? (
            <Link
              href={`/authors/${author.slug}`}
              className="mt-5 inline-flex rounded-full border border-orange-100 bg-[#FCFBF8] px-4 py-2.5 text-sm font-semibold text-[#0A2A66] transition-colors hover:border-[#FF6B00] hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
            >
              View author profile
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function AuthorAvatar({
  author,
  fallbackName,
  size,
}: {
  author?: Author;
  fallbackName: string;
  size: "sm" | "lg";
}) {
  const image = author?.profileImage ? resolveImagePath(author.profileImage) : "";
  const className = size === "sm" ? "size-11" : "size-20";
  const iconClassName = size === "sm" ? "size-5" : "size-8";

  return (
    <span className={`relative inline-flex shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 ${className}`}>
      {image ? (
        <SafeImage
          src={image}
          alt={author?.profileImageAlt || fallbackName}
          fill
          sizes={size === "sm" ? "44px" : "80px"}
          quality={IMAGE_QUALITY.thumbnail}
          className="object-cover"
        />
      ) : (
        <span className="flex size-full items-center justify-center text-slate-400">
          <UserRound className={iconClassName} aria-hidden="true" />
        </span>
      )}
    </span>
  );
}

function buildGuideTocItems({
  city,
  guide,
  hasPageBlocks,
  pageBlocks,
  legacyBlocks,
  renderedListingBlocks,
  hasStructuredSelectedItems,
  visibleFaqItems,
}: {
  city?: City;
  guide: Guide;
  hasPageBlocks: boolean;
  pageBlocks: GuideCmsBlock[];
  legacyBlocks: GuideArticleContentBlock[];
  renderedListingBlocks: ResolvedGuideListingBlock[];
  hasStructuredSelectedItems: boolean;
  visibleFaqItems: GuideFaqItem[];
}) {
  const tocItems: GuideTocItem[] = [];
  const usedIds = new Set<string>();

  const addItem = (id: string, title: string, level: 2 | 3 = 2) => {
    const normalizedId = id.trim();
    const normalizedTitle = title.trim();

    if (!normalizedId || !normalizedTitle || usedIds.has(normalizedId)) {
      return;
    }

    usedIds.add(normalizedId);
    tocItems.push({ id: normalizedId, title: normalizedTitle, level });
  };

  const addPageBlock = (block: GuideCmsBlock) => {
      if (block.type === "faq") {
        if ((block.faqs || []).length > 0) {
          addItem("guide-faq-heading", "FAQs");
        }
        return;
      }

      const title = guideContentBlockTocTitle(block);
      if (!title) {
        return;
      }

      addItem(guideContentBlockTocId(block, title), title);
  };

  if (hasPageBlocks) {
    if (guide.guideType === "best_places" && hasStructuredSelectedItems) {
      pageBlocks
        .filter((block) => block.type === "quick-answer" || block.type === "intro" || block.type === "overview")
        .forEach(addPageBlock);
      addItem(selectedItemsSectionId(guide.guideType), selectedItemsTocLabel(guide.guideType));
      pageBlocks
        .filter((block) => block.type !== "quick-answer" && block.type !== "intro" && block.type !== "overview")
        .forEach(addPageBlock);
    } else {
      pageBlocks.forEach(addPageBlock);
    }
  } else {
    addItem("why-visit", city ? `Why visit ${city.name}` : "Why this guide matters");

    legacyBlocks.forEach((block) => {
      if (block.kind === "heading") {
        addItem(block.id, block.title, block.level);
      }

      if (block.kind === "list") {
        addItem(block.id, block.section.title);
      }
    });
  }

  if (hasStructuredSelectedItems && !(guide.guideType === "best_places" && hasPageBlocks)) {
    addItem(selectedItemsSectionId(guide.guideType), selectedItemsTocLabel(guide.guideType));
  }

  renderedListingBlocks.forEach((block) => {
    addItem(`listing-block-${slugify(block.id || block.title)}`, block.title);
  });

  if (visibleFaqItems.length > 0) {
    addItem("guide-faq-heading", "FAQs");
  }

  return tocItems.length >= 2 ? tocItems : [];
}

function ServerGuideFaqAccordion({ faqs }: { faqs: GuideFaqItem[] }) {
  const validFaqs = faqs.filter((faq) => faq.question.trim() && faq.answer.trim());

  if (validFaqs.length === 0) {
    return null;
  }

  return (
    <section className="scroll-mt-32 rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)] [content-visibility:auto] [contain-intrinsic-size:1px_520px] md:p-7" aria-labelledby="guide-faq-heading">
      <p className="text-sm font-semibold text-[#FF6B00]">FAQs</p>
      <h2 id="guide-faq-heading" className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight text-[#111827] md:text-[1.7rem]">
        Common questions
      </h2>
      <div className="mt-5 grid gap-3">
        {validFaqs.map((faq, index) => (
          <details key={faq.question} open={index === 0} className="group rounded-2xl border border-slate-200 bg-[#FCFBF8] shadow-sm">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3.5 text-left text-sm font-semibold leading-6 text-[#111827] transition-colors hover:text-[#C24A00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF6B00] [&::-webkit-details-marker]:hidden md:text-base">
              <span>{faq.question}</span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[#FF6B00] shadow-sm">
                <span className="text-lg leading-none group-open:hidden">+</span>
                <span className="hidden text-xl leading-none group-open:block">-</span>
              </span>
            </summary>
            <p className="px-5 pb-4 text-sm leading-6 text-slate-600 md:leading-7">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function GuideListingBlockSection({ block }: { block: ResolvedGuideListingBlock }) {
  const blockHeadingId = `listing-block-${slugify(block.id || block.title)}`;

  return (
    <section aria-labelledby={blockHeadingId} className="min-w-0 scroll-mt-32 [content-visibility:auto] [contain-intrinsic-size:1px_720px]">
      <div className="mb-5">
        <p className="text-sm font-semibold text-[#FF6B00]">Selected places</p>
        <h2 id={blockHeadingId} className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight text-[#111827] md:text-[1.7rem]">
          {block.title}
        </h2>
      </div>
      <div className="grid gap-3.5">
        {block.items.map((item, index) => (
          <GuideListingRowCard
            key={item.key}
            item={item}
            index={index}
            imageSizes="(max-width: 768px) 100vw, 50vw"
          />
        ))}
      </div>
    </section>
  );
}

function GuideListingRowCard({
  item,
  index,
  imageSizes,
}: {
  item: ResolvedGuideListingBlockItem;
  index: number;
  imageSizes: string;
}) {
  const image = item.image ? resolveImagePath(item.image) : "";

  return (
    <article className="group grid overflow-hidden rounded-[1.35rem] bg-white/92 shadow-[0_10px_28px_rgba(15,23,42,0.055)] ring-1 ring-slate-200/70 transition-[transform,box-shadow] duration-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.075)] motion-safe:hover:-translate-y-0.5 md:grid-cols-[minmax(220px,36%)_minmax(0,1fr)]">
      <Link href={item.href} className="relative block aspect-[16/10] overflow-hidden bg-slate-100 md:aspect-auto md:min-h-56" aria-label={`Explore ${item.title}`}>
        {image ? (
          <SafeImage
            src={image}
            alt={item.imageAlt || item.title}
            fill
            sizes={imageSizes}
            quality={IMAGE_QUALITY.card}
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-orange-50 text-sm font-semibold text-[#C24A00]">
            {item.badge || "Guide"}
          </div>
        )}
        <span className="absolute left-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-white text-sm font-bold text-[#FF6B00] shadow-md">
          {String(index + 1).padStart(2, "0")}
        </span>
      </Link>
      <div className="flex min-w-0 flex-col p-5">
        {item.badge ? (
          <p className="text-sm font-semibold text-[#FF6B00]">{item.badge}</p>
        ) : null}
        <h3 className="mt-2 text-xl font-semibold leading-7 tracking-tight text-[#111827] md:text-[1.35rem]">
          <Link href={item.href} className="hover:text-[#C24A00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]">
            {item.title}
          </Link>
        </h3>
        {item.description ? (
          <p className="mt-2 text-[0.95rem] leading-6 text-slate-600">{item.description}</p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          {item.badge ? (
            <span className="rounded-full border border-orange-100 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {item.badge}
            </span>
          ) : null}
          <span className="rounded-full border border-orange-100 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            Selected stop
          </span>
        </div>
        <Link
          href={item.href}
          className="mt-6 inline-flex w-fit rounded-full bg-[#0A2A66] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#123A7A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
        >
          Explore
        </Link>
      </div>
    </article>
  );
}

function GuideTypeSections({
  guide,
  selectedItems,
  destinations,
}: {
  guide: Guide;
  selectedItems: StructuredSelectedItem[];
  destinations: Destination[];
}) {
  const itinerary = guide.guideData.itinerary || [];
  const route = guide.guideData.route;

  if (guide.guideType === "best_places" && selectedItems.length > 0) {
    return (
      <StructuredSelectedItemsSection
        id="best-places"
        title="Best places in this guide"
        eyebrow="Curated picks"
        items={selectedItems}
      />
    );
  }

  if (guide.guideType === "things_to_do" && selectedItems.length > 0) {
    return (
      <StructuredSelectedItemsSection
        id="things-to-do"
        title="Things to do in this guide"
        eyebrow="Curated picks"
        items={selectedItems}
      />
    );
  }

  if (guide.guideType === "itinerary" && itinerary.length > 0) {
    return <ItineraryTimelineSection items={itinerary} destinations={destinations} />;
  }

  if ((guide.guideType === "day_trip" || guide.guideType === "road_trip") && (hasRouteData(route) || selectedItems.length > 0)) {
    return (
      <div className="grid gap-5">
        {hasRouteData(route) ? <RouteSummarySection route={route} guideType={guide.guideType} /> : null}
        {selectedItems.length > 0 ? (
          <StructuredSelectedItemsSection
            id="stops"
            title={guide.guideType === "day_trip" ? "Suggested day trip stops" : "Suggested road trip stops"}
            eyebrow={guide.guideType === "day_trip" ? "Day trip route" : "Road trip route"}
            items={selectedItems}
          />
        ) : null}
      </div>
    );
  }

  if (guide.guideType === "practical" && selectedItems.length > 0) {
    return (
      <StructuredSelectedItemsSection
        id="selected-places"
        title="Selected places"
        eyebrow="Helpful links"
        items={selectedItems}
      />
    );
  }

  return null;
}

function StructuredSelectedItemsSection({
  id,
  title,
  eyebrow,
  items,
}: {
  id: string;
  title: string;
  eyebrow: string;
  items: StructuredSelectedItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section id={id} className="min-w-0 scroll-mt-32 [content-visibility:auto] [contain-intrinsic-size:1px_720px]">
      <div className="mb-5">
        <p className="text-sm font-semibold text-[#FF6B00]">{eyebrow}</p>
        <h2 className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight text-[#111827] md:text-[1.7rem]">
          {title}
        </h2>
      </div>
      <div className="grid gap-3.5">
        {items.map((item, index) => (
          <StructuredSelectedItemCard key={item.key} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}

function StructuredSelectedItemCard({
  item,
  index,
}: {
  item: StructuredSelectedItem;
  index: number;
}) {
  const image = item.image ? resolveImagePath(item.image) : "";
  const chips = [
    item.bestFor ? `Best for: ${item.bestFor}` : "",
    item.suggestedTime ? `Suggested time: ${item.suggestedTime}` : "",
    item.nearbyPlaces.length > 0 ? `Nearby: ${item.nearbyPlaces.join(", ")}` : "",
  ].filter(Boolean);

  return (
    <article className="group grid overflow-hidden rounded-[1.35rem] bg-white/92 shadow-[0_10px_28px_rgba(15,23,42,0.055)] ring-1 ring-slate-200/70 transition-[transform,box-shadow] duration-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.075)] motion-safe:hover:-translate-y-0.5 md:grid-cols-[minmax(220px,36%)_minmax(0,1fr)]">
      <Link href={item.href} className="relative block aspect-[16/10] overflow-hidden bg-slate-100 md:aspect-auto md:min-h-56" aria-label={`Explore ${item.title}`}>
        {image ? (
          <SafeImage
            src={image}
            alt={item.imageAlt || item.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            quality={IMAGE_QUALITY.card}
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-orange-50 text-sm font-semibold text-[#C24A00]">
            {item.badge || "Guide"}
          </div>
        )}
        <span className="absolute left-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-white text-sm font-bold text-[#FF6B00] shadow-md">
          {String(index + 1).padStart(2, "0")}
        </span>
      </Link>
      <div className="flex min-w-0 flex-col p-5">
        {item.badge ? <p className="text-sm font-semibold text-[#FF6B00]">{item.badge}</p> : null}
        <h3 className="mt-2 text-xl font-semibold leading-7 tracking-tight text-[#111827] md:text-[1.35rem]">
          <Link href={item.href} className="hover:text-[#C24A00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]">
            {item.title}
          </Link>
        </h3>
        {item.description ? <p className="mt-2 text-[0.95rem] leading-6 text-slate-600">{item.description}</p> : null}
        {chips.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span key={chip} className="rounded-full border border-orange-100 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                {chip}
              </span>
            ))}
          </div>
        ) : null}
        <Link
          href={item.href}
          className="mt-6 inline-flex w-fit rounded-full bg-[#0A2A66] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#123A7A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
        >
          {item.readMoreLabel || "Read more"}
        </Link>
      </div>
    </article>
  );
}

function ItineraryTimelineSection({
  items,
  destinations,
}: {
  items: GuideItineraryItem[];
  destinations: Destination[];
}) {
  const days = groupItineraryByDay(items);

  if (days.length === 0) {
    return null;
  }

  return (
    <section className="scroll-mt-32 rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)] md:p-7">
      <p className="text-sm font-semibold text-[#FF6B00]">Itinerary</p>
      <h2 className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight text-[#111827] md:text-[1.7rem]">
        Day-by-day plan
      </h2>
      <div className="mt-6 grid gap-6">
        {days.map((day) => (
          <div key={day.dayNumber} className="grid gap-3">
            <h3 className="text-lg font-semibold text-[#111827]">Day {day.dayNumber}</h3>
            <div className="grid gap-3">
              {day.items.map((item) => {
                const destination = item.destinationId
                  ? destinations.find((destinationItem) => matchesEntityId(destinationItem, item.destinationId))
                  : undefined;
                const href = destination ? getCanonicalDestinationPath(destination) : "";
                const title = item.placeTitle || destination?.name || "Itinerary stop";

                return (
                  <article key={item.id} className="rounded-2xl border border-slate-200 bg-[#FCFBF8] p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                      {item.timeSlot ? <span>{item.timeSlot}</span> : null}
                      {item.travelTime ? <span>Travel time: {item.travelTime}</span> : null}
                    </div>
                    <h4 className="mt-2 text-base font-semibold text-[#111827]">
                      {href ? (
                        <Link href={href} className="hover:text-[#C24A00]">
                          {title}
                        </Link>
                      ) : (
                        title
                      )}
                    </h4>
                    {item.details ? <p className="mt-2 text-sm leading-6 text-slate-600">{item.details}</p> : null}
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RouteSummarySection({
  route,
  guideType,
}: {
  route: GuideRouteData;
  guideType: Guide["guideType"];
}) {
  const facts = [
    ["Start", route.startingPoint],
    ["End", route.endingPoint],
    ["Distance", route.distance],
    ["Travel time", route.travelTime],
    ["Best transport", route.bestTransport],
    ["Parking", route.parkingInfo],
  ].filter(([, value]) => value);

  if (!hasRouteData(route)) {
    return null;
  }

  return (
    <section className="scroll-mt-32 rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)] md:p-7">
      <p className="text-sm font-semibold text-[#FF6B00]">
        {guideType === "road_trip" ? "Road trip route" : "Day trip route"}
      </p>
      <h2 className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight text-[#111827] md:text-[1.7rem]">
        Route summary
      </h2>
      {facts.length > 0 ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {facts.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-[#FCFBF8] p-4 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-1.5 text-sm font-semibold leading-6 text-[#1F2937]">{value}</p>
            </div>
          ))}
        </div>
      ) : null}
      {route.routeNotes ? <p className="mt-5 text-sm leading-7 text-slate-600">{route.routeNotes}</p> : null}
    </section>
  );
}

function HeroQuickChips({
  guide,
  city,
  updatedDate,
  tone = "light",
}: {
  guide: Guide;
  city?: City;
  updatedDate?: string;
  tone?: "light" | "dark";
}) {
  const date = updatedDate || formatDate(guide.updatedAt || guide.createdAt);
  const iconClassName = tone === "dark" ? "size-4 text-[#FFB36B]" : "size-4 text-[#FF6B00]";
  const categoryLabel = cleanGuideDisplayLabel(guide.category) || guideTypeLabel(guide.guideType);
  const chips: Array<{ label: string; icon: ReactNode } | undefined> = [
    city
      ? { label: city.name, icon: <MapPin className={iconClassName} aria-hidden="true" /> }
      : undefined,
    city?.country || guide.countryId
      ? { label: city?.country || guide.countryId, icon: <Globe2 className={iconClassName} aria-hidden="true" /> }
      : undefined,
    { label: categoryLabel, icon: <BookOpen className={iconClassName} aria-hidden="true" /> },
    guide.readTime
      ? { label: guide.readTime, icon: <Clock className={iconClassName} aria-hidden="true" /> }
      : undefined,
    date
      ? { label: `Updated ${date}`, icon: <CalendarDays className={iconClassName} aria-hidden="true" /> }
      : undefined,
  ];
  const visibleChips = chips.filter((item): item is { label: string; icon: ReactNode } => Boolean(item));
  const chipClassName =
    tone === "dark"
      ? "inline-flex min-h-9 items-center gap-2 rounded-full border border-white/18 bg-white/12 px-3 py-1.5 text-white/88 shadow-sm backdrop-blur sm:min-h-10 sm:px-3.5 sm:py-2"
      : "inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm sm:min-h-10 sm:px-3.5 sm:py-2";

  return (
    <div className={`mt-6 flex flex-wrap gap-2 text-xs font-medium sm:gap-2.5 sm:text-sm ${tone === "dark" ? "text-white/86" : "text-slate-600"}`}>
      {visibleChips.map((item) => (
        <span key={item.label} className={chipClassName}>
          {item.icon}
          {item.label}
        </span>
      ))}
    </div>
  );
}

function WhyVisitSection({
  guide,
  city,
  description,
}: {
  guide: Guide;
  city?: City;
  description: string;
}) {
  const title = city ? `Why visit ${city.name}` : "Why this guide matters";
  const text =
    description ||
    guide.excerpt ||
    "Use this guide as a focused starting point for planning the best places, practical stops, and next steps.";

  return (
    <section id="why-visit" className="min-w-0 scroll-mt-32">
      <p className="text-sm font-semibold text-[#FF6B00]">Why visit</p>
      <h2 className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight text-[#111827] md:text-[1.7rem]">{title}</h2>
      <p className="mt-3 max-w-[48rem] text-base leading-7 text-slate-600">{text}</p>
    </section>
  );
}

function GuidePageBlocks({
  guide,
  blocks,
  listingBlocks,
  cities,
  destinations,
  attractions,
  restaurants,
  guides,
}: {
  guide: Guide;
  blocks: GuideCmsBlock[];
  listingBlocks: ResolvedGuideListingBlock[];
  cities: City[];
  destinations: Destination[];
  attractions: Attraction[];
  restaurants: Restaurant[];
  guides: Guide[];
}) {
  return (
    <>
      {blocks.map((block) => (
        <GuidePageBlock
          key={block.id}
          guide={guide}
          block={block}
          listingBlocks={listingBlocks}
          cities={cities}
          destinations={destinations}
          attractions={attractions}
          restaurants={restaurants}
          guides={guides}
        />
      ))}
    </>
  );
}

function GuidePageBlock({
  guide,
  block,
  listingBlocks,
  cities,
  destinations,
  attractions,
  restaurants,
  guides,
}: {
  guide: Guide;
  block: GuideCmsBlock;
  listingBlocks: ResolvedGuideListingBlock[];
  cities: City[];
  destinations: Destination[];
  attractions: Attraction[];
  restaurants: Restaurant[];
  guides: Guide[];
}) {
  if (block.type === "faq") {
    return <ServerGuideFaqAccordion faqs={block.faqs || []} />;
  }

  const listingBlock = listingBlockForContentBlock(block, {
    guide,
    listingBlocks,
    cities,
    destinations,
    attractions,
    restaurants,
    guides,
  });

  if (listingBlock) {
    return <GuideListingBlockSection block={listingBlock} />;
  }

  if (block.type === "quick-info") {
    return <QuickInfoBlock block={block} />;
  }

  if (block.type === "quick-answer") {
    return <QuickAnswerBlock block={block} />;
  }

  if (block.type === "map") {
    return <MapBlock block={block} />;
  }

  if (block.type === "estimated-cost") {
    return <EstimatedCostBlock block={block} />;
  }

  if (block.type === "travel-tips" || block.type === "warnings" || block.type === "best-time-to-visit") {
    return <TipsBlock block={block} />;
  }

  if (block.type === "cta" || block.type === "car-rental-cta" || block.type === "newsletter-cta") {
    return <GuideCtaBlock block={block} />;
  }

  return <EditorialBlock block={block} guideTitle={guide.title} />;
}

function isRenderableGuidePageBlock(block: GuideCmsBlock) {
  if (block.type === "faq") {
    return (block.faqs || []).some((faq) => faq.question.trim() && faq.answer.trim());
  }

  if (isSelectedEntityBlock(block.type)) {
    return (block.itemIds || []).length > 0;
  }

  if (block.type === "quick-info") {
    return (block.quickInfo || []).some((item) => item.label && item.value && !isPlaceholderQuickInfo(item));
  }

  if (block.type === "estimated-cost") {
    return estimatedCostItemsForBlock(block).length > 0 || Boolean(estimatedCostPlainText(block));
  }

  if (block.type === "quick-answer") {
    return Boolean(block.body?.trim());
  }

  if (block.type === "map") {
    return Boolean(block.mapEmbedUrl?.trim());
  }

  if (block.type === "travel-tips" || block.type === "warnings" || block.type === "best-time-to-visit") {
    return Boolean(block.body?.trim() || block.tips?.length);
  }

  if (block.type === "cta" || block.type === "car-rental-cta" || block.type === "newsletter-cta") {
    return Boolean(block.body?.trim() || (block.ctaLabel?.trim() && block.ctaHref?.trim()));
  }

  return Boolean(block.title?.trim() || block.body?.trim() || block.image?.trim());
}

function EditorialBlock({ block, guideTitle }: { block: GuideCmsBlock; guideTitle?: string }) {
  const image = resolveImagePath(block.image || "");

  return (
    <section id={block.id} className="scroll-mt-32 [content-visibility:auto] [contain-intrinsic-size:1px_520px]">
      {block.eyebrow ? <p className="text-sm font-semibold text-[#FF6B00]">{block.eyebrow}</p> : null}
      {block.title ? (
        <h2 className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight text-[#111827] md:text-[1.7rem]">{block.title}</h2>
      ) : null}
      {block.body ? (
        <MarkdownContent content={block.body} className="mt-3" />
      ) : null}
      {block.image ? (
        <div className="relative mt-5 aspect-[16/10] min-h-64 overflow-hidden rounded-[1.5rem] bg-slate-100 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
          <SafeImage
            src={image}
            alt={block.imageAlt || block.title || `${guideTitle || "Top7Spots guide"} supporting image`}
            fill
            sizes={IMAGE_SIZES.guideInline}
            quality={IMAGE_QUALITY.inline}
            className="object-cover"
          />
        </div>
      ) : null}
    </section>
  );
}

function QuickInfoBlock({ block }: { block: GuideCmsBlock }) {
  const items = (block.quickInfo || []).filter((item) => !isPlaceholderQuickInfo(item));

  if (items.length === 0) {
    return block.body || block.image ? <EditorialBlock block={block} /> : null;
  }

  return (
    <section id={block.id} className="scroll-mt-32 rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)] md:p-7">
      <BlockHeading block={block} fallbackTitle="Quick info" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-slate-200 bg-[#FCFBF8] p-4 shadow-sm ring-1 ring-orange-100/40">
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-1.5 text-sm font-semibold leading-6 text-[#1F2937]">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickAnswerBlock({ block }: { block: GuideCmsBlock }) {
  if (!block.body) {
    return null;
  }

  return (
    <section id={block.id} className="scroll-mt-32 rounded-[1.75rem] border border-orange-100 bg-orange-50/70 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.045)] md:p-7">
      <p className="text-sm font-semibold text-[#C24A00]">Quick Answer</p>
      <h2 className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight text-[#111827] md:text-[1.7rem]">
        {block.title || "Quick Answer"}
      </h2>
      <MarkdownContent content={block.body} className="mt-3" />
    </section>
  );
}

function EstimatedCostBlock({ block }: { block: GuideCmsBlock }) {
  const items = estimatedCostItemsForBlock(block);

  if (items.length > 0) {
    return (
      <section id={block.id} className="scroll-mt-32 rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] [content-visibility:auto] [contain-intrinsic-size:1px_420px] md:p-7">
        <BlockHeading block={block} fallbackTitle="Estimated cost" />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {items.map((item) => (
            <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-orange-100 bg-[#FCFBF8] p-4 shadow-sm">
              <p className="text-sm font-semibold text-[#C24A00]">{item.label}</p>
              <MarkdownContent content={item.value} className="mt-2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const fallbackText = estimatedCostPlainText(block);
  if (!fallbackText) {
    return null;
  }

  return (
    <section id={block.id} className="scroll-mt-32 rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] [content-visibility:auto] [contain-intrinsic-size:1px_320px] md:p-7">
      <BlockHeading block={block} fallbackTitle="Estimated cost" />
      <MarkdownContent content={fallbackText} className="mt-4" />
    </section>
  );
}

function TipsBlock({ block }: { block: GuideCmsBlock }) {
  const tips = block.type === "warnings" ? commonMistakesForBlock(block) : block.tips || [];
  const body = block.type === "warnings" && tips.length > 0 ? "" : block.body;

  return (
    <section id={block.id} className="scroll-mt-32 rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] [content-visibility:auto] [contain-intrinsic-size:1px_420px] md:p-7">
      <BlockHeading block={block} fallbackTitle={tipsFallbackTitle(block.type)} />
      {body ? <MarkdownContent content={body} className="mt-4" /> : null}
      {tips.length > 0 ? (
        <div className="mt-4 grid gap-2.5">
          {tips.map((tip) => (
            <div key={tip} className="rounded-2xl border border-orange-100 bg-[#FCFBF8] p-4 text-sm font-semibold leading-6 text-[#1F2937] shadow-sm">
              {tip}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function MapBlock({ block }: { block: GuideCmsBlock }) {
  if (!block.mapEmbedUrl) {
    return <EditorialBlock block={block} />;
  }

  return (
    <section id={block.id} className="scroll-mt-32 rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)] [content-visibility:auto] [contain-intrinsic-size:1px_620px] md:p-7">
      <BlockHeading block={block} fallbackTitle="Map" />
      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#EEF3F8] shadow-sm">
        <iframe
          src={block.mapEmbedUrl}
          title={block.mapLabel || block.title || "Guide map"}
          className="h-[26rem] w-full md:h-[32rem]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
}

function GuideCtaBlock({ block }: { block: GuideCmsBlock }) {
  return (
    <section id={block.id} className="scroll-mt-32 rounded-[1.75rem] bg-[#0A2A66] p-5 text-white shadow-[0_20px_50px_rgba(10,42,102,0.2)] [content-visibility:auto] [contain-intrinsic-size:1px_280px] md:p-7">
      {block.eyebrow ? <p className="text-sm font-medium text-orange-200">{block.eyebrow}</p> : null}
      <h2 className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight md:text-[1.7rem]">{block.title || ctaFallbackTitle(block.type)}</h2>
      {block.body ? <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50 md:leading-7">{renderInlineContent(block.body)}</p> : null}
      {block.ctaHref ? (
        <Link
          href={block.ctaHref}
          target={block.ctaTargetBlank ? "_blank" : undefined}
          rel={ctaRelAttribute(block)}
          className="mt-5 inline-flex rounded-full bg-[#FF6B00] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E85F00]"
        >
          {block.ctaLabel || "Learn more"}
        </Link>
      ) : null}
    </section>
  );
}

function ctaRelAttribute(block: GuideCmsBlock) {
  const relValues = new Set<string>();

  if (block.ctaTargetBlank) {
    relValues.add("noopener");
    relValues.add("noreferrer");
  }

  if (block.ctaRel === "nofollow") {
    relValues.add("nofollow");
  }

  if (block.ctaRel === "sponsored") {
    relValues.add("sponsored");
    relValues.add("nofollow");
  }

  return relValues.size > 0 ? Array.from(relValues).join(" ") : undefined;
}

function BlockHeading({ block, fallbackTitle }: { block: GuideCmsBlock; fallbackTitle: string }) {
  return (
    <div>
      {block.eyebrow ? <p className="text-sm font-semibold text-[#FF6B00]">{block.eyebrow}</p> : null}
      <h2 className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight text-[#111827] md:text-[1.7rem]">{block.title || fallbackTitle}</h2>
    </div>
  );
}

function ArticleBlockGroup({
  block,
  entities,
  contextualSection,
}: {
  block: GuideArticleContentBlock;
  entities: ContextualEntity[];
  contextualSection?: ContextualEntitySection;
}) {
  return (
    <>
      <ContentBlock block={block} entities={entities} />
      {contextualSection ? <ContextualEntitySectionCards section={contextualSection} /> : null}
    </>
  );
}

function ContentBlock({ block, entities }: { block: GuideArticleContentBlock; entities: ContextualEntity[] }) {
  if (block.kind === "heading") {
    const HeadingTag = block.level === 2 ? "h2" : "h3";
    const headingClassName =
      block.level === 2
        ? "group flex max-w-4xl scroll-mt-24 items-center gap-2 border-t border-slate-200/70 pt-7 text-2xl font-semibold leading-tight tracking-tight text-[#111827] first:border-t-0 first:pt-0 md:text-[1.7rem]"
        : "group flex max-w-3xl scroll-mt-24 items-center gap-2 pt-0 text-xl font-semibold leading-tight tracking-tight text-[#1F2937] md:text-[1.35rem]";

    return (
      <HeadingTag id={block.id} className={headingClassName}>
        <span>{block.title}</span>
        <a
          href={`#${block.id}`}
          className="hidden rounded-full p-1 text-slate-300 transition-colors hover:bg-orange-50 hover:text-[#C24A00] focus-visible:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] group-hover:inline-flex"
          aria-label={`Link to ${block.title}`}
        >
          <Hash className="size-4" aria-hidden="true" />
        </a>
      </HeadingTag>
    );
  }

  if (block.kind === "list") {
    return <InlineCardListSection id={block.id} section={block.section} />;
  }

  if (block.kind === "bullets") {
    return (
      <ul className="max-w-[48rem] list-disc space-y-1.5 pl-6 text-base leading-7 text-slate-600">
        {block.items.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInlineContent(item, entities)}</li>
        ))}
      </ul>
    );
  }

  if (block.kind === "divider") {
    return <hr className="my-1 border-slate-200" />;
  }

  return (
    <p className="max-w-[48rem] text-base leading-7 text-slate-600">
      {renderInlineContent(block.text, entities)}
    </p>
  );
}

function InlineCardListSection({ id, section }: { id: string; section: InlineListSection }) {
  return (
    <section className="scroll-mt-32 rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] md:p-7" aria-labelledby={id}>
      <div className="mb-3.5">
        <p className="text-sm font-semibold text-[#FF6B00]">Quick notes</p>
        <h2 id={id} className="group mt-1.5 flex items-center gap-2 text-2xl font-semibold leading-tight tracking-tight text-[#111827] md:text-[1.7rem]">
          <span>{section.title}</span>
          <a
            href={`#${id}`}
            className="hidden rounded-full p-1 text-slate-300 transition-colors hover:bg-white hover:text-[#C24A00] focus-visible:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] group-hover:inline-flex"
            aria-label={`Link to ${section.title}`}
          >
            <Hash className="size-4" aria-hidden="true" />
          </a>
        </h2>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {section.items.map((item, index) => (
          <div key={`${item}-${index}`} className="min-h-20 rounded-2xl border border-orange-100 bg-[#FCFBF8] p-4 shadow-sm">
            <p className="text-sm font-semibold leading-6 text-[#1F2937]">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContextualEntitySectionCards({ section }: { section: ContextualEntitySection }) {
  return (
    <section className="min-w-0 rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] md:p-7" aria-label={section.title}>
      <div className="mb-4">
        <p className="text-sm font-semibold text-[#FF6B00]">Connected travel ideas</p>
        <h3 className="mt-1.5 text-xl font-semibold leading-tight tracking-tight text-[#111827] md:text-[1.35rem]">{section.title}</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {section.items.map((item) => (
          <GuideEntityCard
            key={item.key}
            item={item}
            className="!w-full !max-w-none h-[26.5rem] sm:h-[26.5rem] sm:min-w-0"
            imageSizes="(max-width: 768px) 100vw, 360px"
          />
        ))}
      </div>
    </section>
  );
}

type ParsedMarkdownBlock =
  | { kind: "heading"; key: string; level: 2 | 3; text: string }
  | { kind: "paragraph"; key: string; text: string }
  | { kind: "list"; key: string; items: string[] }
  | { kind: "divider"; key: string };

function MarkdownContent({
  content,
  className = "",
  entities = [],
}: {
  content: string;
  className?: string;
  entities?: ContextualEntity[];
}) {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className={`grid gap-4 ${className}`}>
      {blocks.map((block) => {
        if (block.kind === "heading") {
          const HeadingTag = block.level === 2 ? "h2" : "h3";
          const headingClassName =
            block.level === 2
              ? "mt-1 max-w-4xl scroll-mt-24 text-2xl font-semibold leading-tight tracking-tight text-[#111827] md:text-[1.7rem]"
              : "max-w-3xl scroll-mt-24 text-xl font-semibold leading-tight tracking-tight text-[#1F2937] md:text-[1.35rem]";

          return (
            <HeadingTag key={block.key} className={headingClassName}>
              {renderInlineContent(block.text, entities)}
            </HeadingTag>
          );
        }

        if (block.kind === "list") {
          return (
            <ul key={block.key} className="max-w-[48rem] list-disc space-y-1.5 pl-6 text-base leading-7 text-slate-600">
              {block.items.map((item, index) => (
                <li key={`${item}-${index}`}>{renderInlineContent(item, entities)}</li>
              ))}
            </ul>
          );
        }

        if (block.kind === "divider") {
          return <hr key={block.key} className="border-slate-200" />;
        }

        return (
          <p key={block.key} className="max-w-[48rem] text-base leading-7 text-slate-600">
            {renderInlineContent(block.text, entities)}
          </p>
        );
      })}
    </div>
  );
}

function parseMarkdownBlocks(content: string): ParsedMarkdownBlock[] {
  const blocks: ParsedMarkdownBlock[] = [];
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    const text = paragraphLines.join(" ").replace(/\s+/g, " ").trim();

    if (text) {
      blocks.push({ kind: "paragraph", key: `paragraph-${blocks.length}`, text });
    }

    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ kind: "list", key: `list-${blocks.length}`, items: listItems });
    }

    listItems = [];
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    const heading = headingFromText(trimmedLine);

    if (!trimmedLine) {
      flushParagraph();
      flushList();
      return;
    }

    if (/^-{3,}$/.test(trimmedLine)) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "divider", key: `divider-${blocks.length}` });
      return;
    }

    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        kind: "heading",
        key: `heading-${blocks.length}`,
        level: heading.level,
        text: heading.title,
      });
      return;
    }

    const bulletMatch = trimmedLine.match(/^[-*]\s+(.+)$/);

    if (bulletMatch) {
      flushParagraph();
      listItems.push(bulletMatch[1].trim());
      return;
    }

    flushList();
    paragraphLines.push(trimmedLine);
  });

  flushParagraph();
  flushList();

  return blocks;
}

function renderInlineContent(text: string, entities: ContextualEntity[] = []): ReactNode[] {
  const nodes: ReactNode[] = [];

  text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((part) => part.length > 0)
    .forEach((part, index) => {
      const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);

      if (boldMatch) {
        nodes.push(
          <strong key={`bold-${index}`} className="font-semibold text-[#111827]">
            {boldMatch[1]}
          </strong>,
        );
        return;
      }

      nodes.push(...renderMarkdownAndEntityLinks(part, entities, `text-${index}`));
    });

  return nodes;
}

function renderMarkdownAndEntityLinks(text: string, entities: ContextualEntity[], keyPrefix: string): ReactNode[] {
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(...renderEntityLinks(text.slice(cursor, match.index), entities, `${keyPrefix}-text-${index}`));
    }

    const label = match[1].trim();
    const href = match[2].trim();

    if (label && isSafeInlineHref(href)) {
      nodes.push(
        <Link
          key={`${keyPrefix}-link-${index}-${href}`}
          href={href}
          target={isExternalHref(href) ? "_blank" : undefined}
          rel={isExternalHref(href) ? "noopener noreferrer" : undefined}
          className="font-medium text-[#C24A00] underline decoration-orange-200 underline-offset-4 transition hover:text-[#0A2A66] hover:decoration-[#0A2A66]"
        >
          {label}
        </Link>,
      );
    } else {
      nodes.push(match[0]);
    }

    cursor = match.index + match[0].length;
    index += 1;
  }

  if (cursor < text.length) {
    nodes.push(...renderEntityLinks(text.slice(cursor), entities, `${keyPrefix}-text-end`));
  }

  return nodes.length > 0 ? nodes : renderEntityLinks(text, entities, keyPrefix);
}

function renderEntityLinks(text: string, entities: ContextualEntity[], keyPrefix: string): ReactNode[] {
  const mentions = entities.length > 0 ? firstMentionPerEntity(findEntityMentions(text, entities)) : [];

  if (mentions.length === 0) {
    return [text];
  }

  const nodes: ReactNode[] = [];
  let cursor = 0;

  mentions.forEach((mention, index) => {
    if (mention.start > cursor) {
      nodes.push(text.slice(cursor, mention.start));
    }

    nodes.push(
      <Link
        key={`${keyPrefix}-${mention.entity.key}-${mention.start}-${index}`}
        href={mention.entity.href}
        className="rounded-md bg-orange-50/80 px-1 py-0.5 font-medium text-[#C24A00] transition-colors hover:bg-orange-100 hover:text-[#0A2A66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
        aria-label={`Open ${mention.entity.title}`}
      >
        {text.slice(mention.start, mention.end)}
      </Link>,
    );
    cursor = mention.end;
  });

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

function isSafeInlineHref(href: string) {
  return href.startsWith("/") || /^https?:\/\//i.test(href);
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function SimilarGuidesGrid({ guides }: { guides: Guide[] }) {
  return (
    <section className="bg-[#FBFAF7] px-4 pb-14 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-semibold text-[#FF6B00]">Keep planning</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#111827]">
            More travel guides you may like
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {guides.map((guide) => (
            <SimilarGuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SimilarGuideCard({ guide }: { guide: Guide }) {
  const href = getGuideHref(guide);
  const image = guide.coverImage || guide.image ? resolveImagePath(guide.coverImage || guide.image) : "";

  return (
    <article className="group grid overflow-hidden rounded-[1.35rem] bg-white/95 shadow-[0_10px_28px_rgba(15,23,42,0.055)] ring-1 ring-slate-200/70 transition-[transform,box-shadow] duration-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.075)] motion-safe:hover:-translate-y-0.5 sm:grid-cols-[10.5rem_minmax(0,1fr)]">
      <Link href={href} className="relative block aspect-[16/10] overflow-hidden bg-slate-100 sm:aspect-auto" aria-label={`Explore ${guide.title}`}>
        {image ? (
          <SafeImage
            src={image}
            alt={guideImageAlt(guide)}
            fill
            sizes="(max-width: 640px) 100vw, 180px"
            quality={IMAGE_QUALITY.thumbnail}
            className="object-cover"
          />
        ) : (
          <div className="flex size-full min-h-40 items-center justify-center bg-orange-50 text-sm font-semibold text-[#C24A00]">
            {guide.category || "Guide"}
          </div>
        )}
      </Link>
      <div className="flex min-w-0 flex-col p-5">
        <p className="text-sm font-semibold text-[#FF6B00]">{[guide.category, guide.readTime].filter(Boolean).join(" - ") || "Travel guide"}</p>
        <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-7 tracking-tight text-[#111827]">
          <Link href={href} className="hover:text-[#C24A00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]">
            {guide.title}
          </Link>
        </h3>
        {guide.excerpt || guide.seoDescription ? (
          <p className="mt-3 line-clamp-3 text-[0.95rem] leading-6 text-slate-600">{guide.excerpt || guide.seoDescription}</p>
        ) : null}
        <Link
          href={href}
          className="mt-5 inline-flex w-fit rounded-full border border-orange-100 bg-[#FCFBF8] px-4 py-2.5 text-sm font-semibold text-[#0A2A66] transition-colors hover:border-[#FF6B00] hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
        >
          Explore
        </Link>
      </div>
    </article>
  );
}

function buildContextualEntityIndex({
  currentGuide,
  city,
  cities,
  destinations,
  attractions,
  restaurants,
  guides,
}: {
  currentGuide: Guide;
  city?: City;
  cities: City[];
  destinations: Destination[];
  attractions: Attraction[];
  restaurants: Restaurant[];
  guides: Guide[];
}) {
  const cityBySlug = new Map(cities.map((item) => [item.slug, item]));
  const entities: ContextualEntity[] = [];

  destinations.forEach((destination) => {
    const destinationCity = cityBySlug.get(destination.citySlug);

    entities.push({
      key: `destination-${destination.id}`,
      href: getCanonicalDestinationPath(destination, destinationCity || city),
      title: destination.name,
      description: destination.summary || destination.location || destination.city,
      image: destination.image,
      imageAlt: destination.imageAlt || destinationImageAlt({ ...destination, country: destinationCity?.country }),
      type: destination.category || "Destination",
      entityType: "destination",
      citySlug: destination.citySlug,
      countrySlug: destinationCity?.country,
      aliases: entityAliases(destination.name, destination.slug, destination.location),
      keywords: keywordList(destination.category, destination.summary, destination.description, destination.location),
    });
  });

  attractions.forEach((attraction) => {
    const attractionCity = cityBySlug.get(attraction.citySlug);

    entities.push({
      key: `attraction-${attraction.id}`,
      href: `/${attraction.citySlug}/attractions/${attraction.slug}`,
      title: attraction.name,
      description: attraction.summary || attraction.description,
      image: attraction.image,
      imageAlt: attraction.imageAlt || attractionImageAlt({ ...attraction, country: attractionCity?.country }),
      type: attraction.category || attraction.type || "Attraction",
      entityType: "attraction",
      citySlug: attraction.citySlug,
      countrySlug: attractionCity?.country,
      aliases: entityAliases(attraction.name, attraction.slug, attraction.category),
      keywords: keywordList(attraction.category, attraction.type, attraction.summary, attraction.description),
    });
  });

  restaurants.forEach((restaurant) => {
    const restaurantCity =
      cityBySlug.get(restaurant.cityId) || cities.find((item) => item.id === restaurant.cityId);

    entities.push({
      key: `restaurant-${restaurant.id}`,
      href: `/restaurants/${restaurant.slug}`,
      title: restaurant.name,
      description: restaurant.shortDescription || restaurant.address,
      image: restaurant.image,
      imageAlt: restaurant.imageAlt || restaurantImageAlt({ ...restaurant, city: restaurantCity?.name, country: restaurantCity?.country }),
      type: restaurant.cuisineType || restaurant.priceRange || "Restaurant",
      entityType: "restaurant",
      citySlug: restaurantCity?.slug || restaurant.cityId,
      countrySlug: restaurant.countrySlug || restaurantCity?.country,
      aliases: entityAliases(restaurant.name, restaurant.slug, restaurant.cuisineType),
      keywords: keywordList(restaurant.cuisineType, restaurant.shortDescription, restaurant.longDescription, restaurant.tags.join(" ")),
    });
  });

  cities.forEach((item) => {
    entities.push({
      key: `city-${item.id}`,
      href: `/${item.slug}`,
      title: item.name,
      description: item.shortDescription || item.region || item.country,
      image: item.cardImage || item.featuredImage || item.heroImage,
      imageAlt: item.cardImageAlt || item.featuredImageAlt || item.heroImageAlt || cityImageAlt(item, "card"),
      type: item.country || "City",
      entityType: "city",
      citySlug: item.slug,
      countrySlug: item.country,
      aliases: entityAliases(item.name, item.slug),
      keywords: keywordList(item.region, item.country, item.shortDescription, item.longDescription),
    });
  });

  buildCountryEntities(cities).forEach((countryEntity) => entities.push(countryEntity));

  guides.forEach((item) => {
    if (item.id === currentGuide.id || !isSafeGuideSlug(item.slug)) {
      return;
    }

    entities.push({
      ...guideToEntityCardItem(item),
      entityType: "guide",
      citySlug: item.citySlug,
      countrySlug: item.countryId,
      aliases: entityAliases(item.title, item.slug),
      keywords: keywordList(item.category, item.excerpt, item.seoDescription),
    });
  });

  return dedupeContextualEntities(entities);
}

function buildCountryEntities(cities: City[]): ContextualEntity[] {
  const countryMap = new Map<string, ContextualEntity>();

  cities.forEach((city) => {
    const countrySlug = slugify(city.country);

    if (!countrySlug || countryMap.has(countrySlug)) {
      return;
    }

    countryMap.set(countrySlug, {
      key: `country-${countrySlug}`,
      href: countryPath(countrySlug),
      title: city.country,
      description: `Explore cities, destinations, and travel guides across ${city.country}.`,
      image: city.featuredImage || city.heroImage || city.cardImage,
      imageAlt: `${city.country} travel inspiration`,
      type: "Country",
      entityType: "country",
      countrySlug: city.country,
      aliases: entityAliases(city.country, countrySlug, city.countryCode),
      keywords: keywordList(city.country, city.region),
    });
  });

  return Array.from(countryMap.values());
}

function buildContextualEntitySections({
  blocks,
  entities,
  currentCitySlug,
  currentCountrySlug,
}: {
  blocks: GuideArticleContentBlock[];
  entities: ContextualEntity[];
  currentCitySlug?: string;
  currentCountrySlug?: string;
}) {
  const sections = new Map<string, ContextualEntitySection>();
  const usedEntityKeys = new Set<string>();
  let currentSectionTitle = "";
  let currentSectionText = "";
  let currentSectionEndKey = "";
  let hasMajorSection = false;

  const flushSection = () => {
    if (!currentSectionEndKey || !currentSectionText.trim()) {
      return;
    }

    const items = scoreEntitiesForText({
      text: `${currentSectionTitle}\n${currentSectionText}`,
      sectionTitle: currentSectionTitle,
      entities,
      currentCitySlug,
      currentCountrySlug,
      usedEntityKeys,
    }).slice(0, 6);

    if (items.length > 0) {
      items.forEach((item) => usedEntityKeys.add(item.key));
      sections.set(currentSectionEndKey, {
        title: contextualSectionTitle(currentSectionTitle, items),
        items,
      });
    }
  };

  blocks.forEach((block) => {
    if (block.kind === "heading" && block.level === 2) {
      flushSection();
      hasMajorSection = true;
      currentSectionTitle = block.title;
      currentSectionText = "";
      currentSectionEndKey = "";
      return;
    }

    if (hasMajorSection) {
      currentSectionText = `${currentSectionText}\n${blockSearchText(block)}`;
      currentSectionEndKey = block.key;
    }

    if (block.kind === "list") {
      const listItems = scoreEntitiesForText({
        text: blockSearchText(block),
        sectionTitle: block.section.title,
        entities,
        currentCitySlug,
        currentCountrySlug,
        usedEntityKeys,
      }).slice(0, 4);

      if (listItems.length > 0) {
        listItems.forEach((item) => usedEntityKeys.add(item.key));
        sections.set(block.key, {
          title: contextualSectionTitle(block.section.title, listItems),
          items: listItems,
        });
      }
    }
  });

  flushSection();

  if (!hasMajorSection && blocks.length > 0) {
    const text = blocks.map(blockSearchText).join("\n");
    const items = scoreEntitiesForText({
      text,
      sectionTitle: "guide",
      entities,
      currentCitySlug,
      currentCountrySlug,
      usedEntityKeys,
    }).slice(0, 6);
    const placementBlock = [...blocks].reverse().find((block) => block.kind !== "heading");

    if (items.length > 0 && placementBlock) {
      sections.set(placementBlock.key, {
        title: "Places mentioned in this guide",
        items,
      });
    }
  }

  return sections;
}

function scoreEntitiesForText({
  text,
  sectionTitle,
  entities,
  currentCitySlug,
  currentCountrySlug,
  usedEntityKeys,
}: {
  text: string;
  sectionTitle: string;
  entities: ContextualEntity[];
  currentCitySlug?: string;
  currentCountrySlug?: string;
  usedEntityKeys: Set<string>;
}) {
  const titleTokens = new Set(keywordList(sectionTitle));
  const normalizedCurrentCountry = currentCountrySlug ? slugify(currentCountrySlug) : "";

  return entities
    .map((entity) => {
      if (usedEntityKeys.has(entity.key)) {
        return { entity, score: 0 };
      }

      const mentions = findEntityMentions(text, [entity]);

      if (mentions.length === 0) {
        return { entity, score: 0 };
      }

      const cityBonus = currentCitySlug && entity.citySlug === currentCitySlug ? 3 : 0;
      const countryBonus =
        normalizedCurrentCountry && entity.countrySlug && slugify(entity.countrySlug) === normalizedCurrentCountry ? 2 : 0;
      const keywordBonus = entity.keywords.some((keyword) => titleTokens.has(keyword)) ? 2 : 0;
      const typeBonus = sectionEntityTypeBonus(sectionTitle, entity.entityType);

      return {
        entity,
        score: mentions.length * 5 + cityBonus + countryBonus + keywordBonus + typeBonus,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || entityTypePriority(a.entity.entityType) - entityTypePriority(b.entity.entityType))
    .map((item) => item.entity);
}

function findEntityMentions(text: string, entities: ContextualEntity[]): EntityMention[] {
  const mentions: EntityMention[] = [];

  entities.forEach((entity) => {
    entity.aliases.forEach((alias) => {
      const matcher = entityAliasMatcher(alias);
      let match = matcher.exec(text);

      while (match) {
        const prefix = match[1] || "";
        const matchedText = match[2] || "";
        const start = match.index + prefix.length;

        mentions.push({
          entity,
          start,
          end: start + matchedText.length,
          text: matchedText,
        });

        match = matcher.exec(text);
      }
    });
  });

  return nonOverlappingMentions(mentions);
}

function nonOverlappingMentions(mentions: EntityMention[]) {
  const selectedMentions: EntityMention[] = [];

  mentions
    .sort((a, b) => a.start - b.start || b.text.length - a.text.length || entityTypePriority(a.entity.entityType) - entityTypePriority(b.entity.entityType))
    .forEach((mention) => {
      const overlaps = selectedMentions.some(
        (selected) => mention.start < selected.end && mention.end > selected.start,
      );

      if (!overlaps) {
        selectedMentions.push(mention);
      }
    });

  return selectedMentions.sort((a, b) => a.start - b.start);
}

function firstMentionPerEntity(mentions: EntityMention[]) {
  const usedEntityKeys = new Set<string>();

  return mentions.filter((mention) => {
    if (usedEntityKeys.has(mention.entity.key)) {
      return false;
    }

    usedEntityKeys.add(mention.entity.key);
    return true;
  });
}

function entityAliasMatcher(alias: string) {
  return new RegExp(`(^|[^A-Za-z0-9])(${escapeRegExp(alias)})(?=$|[^A-Za-z0-9])`, "gi");
}

function sectionEntityTypeBonus(sectionTitle: string, entityType: ContextualEntityType) {
  const title = sectionTitle.toLowerCase();

  if (entityType === "restaurant" && /\b(food|eat|restaurant|cafe|dining|coffee)\b/.test(title)) {
    return 5;
  }

  if ((entityType === "destination" || entityType === "attraction") && /\b(place|spot|attraction|visit|day|itinerary|route|beach|wadi|mountain|fort|souq)\b/.test(title)) {
    return 4;
  }

  if (entityType === "guide" && /\b(tip|guide|plan|itinerary|travel)\b/.test(title)) {
    return 3;
  }

  return 0;
}

function entityTypePriority(type: ContextualEntityType) {
  const priority: Record<ContextualEntityType, number> = {
    destination: 1,
    attraction: 2,
    restaurant: 3,
    city: 4,
    country: 5,
    guide: 6,
  };

  return priority[type];
}

function contextualSectionTitle(sectionTitle: string, items: ContextualEntity[]) {
  const title = sectionTitle.toLowerCase();

  if (items.some((item) => item.entityType === "restaurant") || /\b(food|eat|restaurant|cafe|dining)\b/.test(title)) {
    return "Where to eat nearby";
  }

  if (/\b(nearby|route|day|itinerary|stop|visit|beach|wadi|mountain|fort|souq)\b/.test(title)) {
    return "Recommended spots nearby";
  }

  if (items.some((item) => item.entityType === "guide" || item.entityType === "city" || item.entityType === "country")) {
    return "Explore more";
  }

  return "Places mentioned in this section";
}

function blockSearchText(block: GuideArticleContentBlock) {
  if (block.kind === "heading") {
    return block.title;
  }

  if (block.kind === "list") {
    return `${block.section.title}\n${block.section.items.join("\n")}`;
  }

  if (block.kind === "bullets") {
    return block.items.join("\n");
  }

  if (block.kind === "divider") {
    return "";
  }

  return block.text;
}

function buildGuideArticleContentBlocks(content: string[], tableOfContents: Guide["tableOfContents"]): GuideArticleContentBlock[] {
  if (containsMarkdown(content)) {
    return buildMarkdownArticleContentBlocks(content, tableOfContents);
  }

  const idCounts = new Map<string, number>();
  const blocks: GuideArticleContentBlock[] = [];

  content.forEach((text, index) => {
    const trimmedText = text.trim();

    if (!trimmedText || isFaqLikeContentBlock(trimmedText)) {
      return;
    }

    const heading = headingFromText(trimmedText);

    if (heading) {
      const id = uniqueId(headingId(heading.title, tableOfContents, index), idCounts);
      blocks.push({
        kind: "heading",
        key: `heading-${id}`,
        id,
        level: heading.level,
        title: heading.title,
      });
      return;
    }

    const listSection = parseListSection(trimmedText);

    if (listSection) {
      const id = uniqueId(slugify(listSection.title) || `list-${index + 1}`, idCounts);
      blocks.push({
        kind: "list",
        key: `list-${id}`,
        id,
        section: listSection,
      });
      return;
    }

    splitLongParagraph(trimmedText).forEach((paragraph, paragraphIndex) => {
      blocks.push({
        kind: "paragraph",
        key: `paragraph-${index}-${paragraphIndex}`,
        text: paragraph,
      });
    });
  });

  return blocks;
}

function containsMarkdown(content: string[]) {
  return content.some((item) => /(^|\n)\s*(#{2,3}\s+|[-*]\s+|---+\s*$)|\*\*[^*]+\*\*/m.test(item));
}

function buildMarkdownArticleContentBlocks(
  content: string[],
  tableOfContents: Guide["tableOfContents"],
): GuideArticleContentBlock[] {
  const idCounts = new Map<string, number>();
  const blocks: GuideArticleContentBlock[] = [];
  const markdownBlocks = parseMarkdownBlocks(content.join("\n"));

  markdownBlocks.forEach((block, index) => {
    if (block.kind === "heading") {
      const id = uniqueId(headingId(block.text, tableOfContents, index), idCounts);
      blocks.push({
        kind: "heading",
        key: `heading-${id}`,
        id,
        level: block.level,
        title: block.text,
      });
      return;
    }

    if (block.kind === "list") {
      blocks.push({
        kind: "bullets",
        key: `bullets-${index}`,
        items: block.items,
      });
      return;
    }

    if (block.kind === "divider") {
      blocks.push({
        kind: "divider",
        key: `divider-${index}`,
      });
      return;
    }

    splitLongParagraph(block.text).forEach((paragraph, paragraphIndex) => {
      blocks.push({
        kind: "paragraph",
        key: `paragraph-${index}-${paragraphIndex}`,
        text: paragraph,
      });
    });
  });

  return blocks;
}

function headingFromText(text: string): { level: 2 | 3; title: string } | undefined {
  if (text.startsWith("## ")) {
    return {
      level: 2,
      title: text.replace(/^##\s+/, "").trim(),
    };
  }

  if (text.startsWith("### ")) {
    return {
      level: 3,
      title: text.replace(/^###\s+/, "").trim(),
    };
  }

  return undefined;
}

function splitLongParagraph(text: string) {
  if (text.length < 520) {
    return [text];
  }

  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g);

  if (!sentences || sentences.length < 4) {
    return [text];
  }

  const paragraphs: string[] = [];
  let currentParagraph = "";

  for (const sentence of sentences) {
    const nextParagraph = `${currentParagraph}${sentence}`.trim();

    if (nextParagraph.length > 360 && currentParagraph) {
      paragraphs.push(currentParagraph.trim());
      currentParagraph = sentence;
    } else {
      currentParagraph = nextParagraph;
    }
  }

  if (currentParagraph.trim()) {
    paragraphs.push(currentParagraph.trim());
  }

  return paragraphs.length > 1 ? paragraphs : [text];
}

function uniqueId(baseId: string, idCounts: Map<string, number>) {
  const fallbackId = baseId || "section";
  const count = idCounts.get(fallbackId) || 0;
  idCounts.set(fallbackId, count + 1);
  return count === 0 ? fallbackId : `${fallbackId}-${count + 1}`;
}

function resolveSimilarGuides(currentGuide: Guide, guides: Guide[], city?: City) {
  const selected = new Map<string, Guide>();
  const sameCitySlug = currentGuide.citySlug || city?.slug;
  const sameCountryId = guideCountryKey(currentGuide, city);
  const currentPlaceKeys = guidePlaceKeys(currentGuide);

  const eligibleGuides = guides.filter((guide) => guide.id !== currentGuide.id && isSafeGuideSlug(guide.slug));
  const addGuides = (items: Guide[]) => {
    for (const guide of items) {
      if (!selected.has(guide.id)) {
        selected.set(guide.id, guide);
      }
    }
  };

  addGuides(
    guideStringListValues(currentGuide.relatedGuideSlugs)
      .map((slug) => eligibleGuides.find((guide) => guide.slug === slugify(slug) || guide.id === slug))
      .filter((guide): guide is Guide => Boolean(guide)),
  );

  if (sameCitySlug) {
    addGuides(sortGuidesNewestFirstList(eligibleGuides.filter((guide) => guide.citySlug === sameCitySlug)));
  }

  if (sameCountryId) {
    addGuides(sortGuidesNewestFirstList(eligibleGuides.filter((guide) => guideCountryKey(guide) === sameCountryId)));
  }

  if (currentPlaceKeys.size > 0) {
    addGuides(
      sortGuidesNewestFirstList(
        eligibleGuides.filter(
          (guide) => isGuideContextCompatible(currentGuide, guide, city) && hasSharedGuidePlace(currentPlaceKeys, guide),
        ),
      ),
    );
  }

  addGuides(
    sortGuidesNewestFirstList(
      eligibleGuides.filter(
        (guide) =>
          isGuideContextCompatible(currentGuide, guide, city) &&
          isRelatedGuideTypeOrCategory(currentGuide, guide),
      ),
    ),
  );

  const contextualFallbacks = eligibleGuides.filter((guide) => isGuideContextCompatible(currentGuide, guide, city));
  if (selected.size < 6) {
    addGuides(sortGuidesNewestFirstList(contextualFallbacks));
  }

  if (selected.size < 3) {
    addGuides(sortGuidesNewestFirstList(eligibleGuides.filter((guide) => !hasConflictingGuideCountry(currentGuide, guide, city))));
  }

  return Array.from(selected.values());
}

function sortGuidesNewestFirstList(guides: Guide[]) {
  return [...guides].sort(sortGuidesNewestFirst);
}

function sortGuidesNewestFirst(a: Guide, b: Guide) {
  const aTime = new Date(a.updatedAt || a.createdAt).getTime();
  const bTime = new Date(b.updatedAt || b.createdAt).getTime();
  return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
}

function guideCountryKey(guide: Guide, city?: City) {
  return slugify(guide.countryId || city?.country || "");
}

function guidePlaceKeys(guide: Guide) {
  const keys = new Set<string>();
  const add = (value?: string) => {
    const key = slugify(value || "");
    if (key) {
      keys.add(key);
    }
  };

  add(guide.citySlug);
  add(guide.destinationId);
  guideStringListValues(guide.relatedPlaceSlugs).forEach(add);
  guide.guideSelectedItems.forEach((item) => {
    add(item.itemId);
    add(item.itemSlug);
    add(item.itemName);
    add(item.city);
  });
  guide.guideData.itinerary?.forEach((item) => {
    add(item.destinationId);
    add(item.placeTitle);
  });

  return keys;
}

function guideStringListValues(values: string[]) {
  return values.flatMap((value) => String(value || "").split(/\r?\n|,|;/)).map((value) => value.trim()).filter(Boolean);
}

function hasSharedGuidePlace(currentPlaceKeys: Set<string>, guide: Guide) {
  for (const key of guidePlaceKeys(guide)) {
    if (currentPlaceKeys.has(key)) {
      return true;
    }
  }

  return false;
}

function isRelatedGuideTypeOrCategory(currentGuide: Guide, guide: Guide) {
  return (
    currentGuide.guideType === guide.guideType ||
    guideTypeFamily(currentGuide.guideType) === guideTypeFamily(guide.guideType) ||
    Boolean(currentGuide.category && guide.category && slugify(currentGuide.category) === slugify(guide.category))
  );
}

function guideTypeFamily(type: Guide["guideType"]) {
  if (type === "best_places" || type === "things_to_do" || type === "itinerary" || type === "day_trip" || type === "road_trip") {
    return "planning";
  }

  return type;
}

function isGuideContextCompatible(currentGuide: Guide, guide: Guide, city?: City) {
  if (guide.citySlug && currentGuide.citySlug && guide.citySlug === currentGuide.citySlug) {
    return true;
  }

  const currentCountry = guideCountryKey(currentGuide, city);
  const candidateCountry = guideCountryKey(guide);

  if (currentCountry && candidateCountry) {
    return currentCountry === candidateCountry;
  }

  if (guide.citySlug && currentGuide.citySlug && guide.citySlug !== currentGuide.citySlug) {
    return false;
  }

  return !candidateCountry;
}

function hasConflictingGuideCountry(currentGuide: Guide, guide: Guide, city?: City) {
  const currentCountry = guideCountryKey(currentGuide, city);
  const candidateCountry = guideCountryKey(guide);
  return Boolean(
    (currentGuide.citySlug && guide.citySlug && currentGuide.citySlug !== guide.citySlug) ||
      (currentCountry && candidateCountry && currentCountry !== candidateCountry),
  );
}

function guideToEntityCardItem(guide: Guide): GuideEntityCardItem {
  return {
    key: `guide-${guide.id}`,
    href: getGuideHref(guide),
    title: guide.title,
    description: guide.excerpt || guide.seoDescription,
    image: guide.coverImage || guide.image,
    imageAlt: guideImageAlt(guide),
    type: guide.category || "Guide",
    badge: guide.readTime || undefined,
  };
}

function isSafeGuideSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function resolveStructuredSelectedItems({
  selectedItems,
  cities,
  destinations,
  attractions,
  restaurants,
  guides,
}: {
  selectedItems: GuideSelectedItem[];
  cities: City[];
  destinations: Destination[];
  attractions: Attraction[];
  restaurants: Restaurant[];
  guides: Guide[];
}): StructuredSelectedItem[] {
  return selectedItems
    .filter((selectedItem) => selectedItem.type !== "country" && !isPlaceholderSelectedItem(selectedItem))
    .map((selectedItem, index): StructuredSelectedItem | undefined => {
      const fallbackTitle =
        selectedItem.customTitle || selectedItem.itemName || selectedItem.itemSlug || selectedItem.itemId;
      const base = resolveStructuredSelectedItemBase({
        selectedItem,
        cities,
        destinations,
        attractions,
        restaurants,
        guides,
      });

      if (!base && !fallbackTitle) {
        return undefined;
      }

      if (!base && selectedItem.type !== "custom") {
        return undefined;
      }

      return {
        key: `structured-${selectedItem.id || index}`,
        href: base?.href || (selectedItem.type === "custom" ? selectedItem.itemId : "#"),
        title: selectedItem.customTitle || base?.title || fallbackTitle || "Selected item",
        description: selectedItem.customSummary,
        image: base?.image,
        imageAlt: base?.imageAlt,
        badge: base?.badge || selectedItem.type,
        itemType: selectedItem.type,
        displayOrder: selectedItem.displayOrder || index + 1,
        bestFor: selectedItem.bestFor,
        suggestedTime: selectedItem.suggestedTime,
        nearbyPlaces: selectedItem.nearbyPlaces || [],
        readMoreLabel: selectedItem.readMoreLabel,
      };
    })
    .filter((item): item is StructuredSelectedItem => Boolean(item))
    .filter((item) => item.href !== "#")
    .sort((a, b) => a.displayOrder - b.displayOrder || a.title.localeCompare(b.title));
}

function resolveStructuredSelectedItemBase({
  selectedItem,
  cities,
  destinations,
  attractions,
  restaurants,
  guides,
}: {
  selectedItem: GuideSelectedItem;
  cities: City[];
  destinations: Destination[];
  attractions: Attraction[];
  restaurants: Restaurant[];
  guides: Guide[];
}): ResolvedGuideListingBlockItem | undefined {
  const candidates = [selectedItem.itemId, selectedItem.itemSlug, selectedItem.itemName].filter(
    (candidate): candidate is string => Boolean(candidate),
  );

  if (selectedItem.type === "destination") {
    const destination = destinations.find((item) => candidates.some((candidate) => matchesEntityId(item, candidate)));
    const city = cities.find((item) => item.slug === destination?.citySlug);
    return destination
      ? {
          key: `destination-${destination.id}`,
          href: getCanonicalDestinationPath(destination),
          title: destination.name,
          image: destination.image,
          imageAlt: destination.imageAlt || destinationImageAlt({ ...destination, country: city?.country }),
          badge: destination.category || "Destination",
        }
      : undefined;
  }

  if (selectedItem.type === "city") {
    const city = cities.find((item) => candidates.some((candidate) => matchesEntityId(item, candidate)));
    return city
      ? {
          key: `city-${city.id}`,
          href: `/${city.slug}`,
          title: city.name,
          image: city.cardImage || city.featuredImage || city.heroImage,
          imageAlt: city.cardImageAlt || city.featuredImageAlt || city.heroImageAlt || cityImageAlt(city, "card"),
          badge: city.country || "City",
        }
      : undefined;
  }

  if (selectedItem.type === "country") {
    const city = cities.find((item) => candidates.some((candidate) => slugify(item.country) === slugify(candidate)));
    return city
      ? {
          key: `country-${slugify(city.country)}`,
          href: countryPath(city.country),
          title: city.country,
          image: city.featuredImage || city.heroImage || city.cardImage,
          imageAlt: `${city.country} travel inspiration`,
          badge: "Country",
        }
      : undefined;
  }

  if (selectedItem.type === "restaurant") {
    const restaurant = restaurants.find((item) => candidates.some((candidate) => matchesEntityId(item, candidate)));
    const city = cities.find((item) => item.id === restaurant?.cityId);
    return restaurant
      ? {
          key: `restaurant-${restaurant.id}`,
          href: `/restaurants/${restaurant.slug}`,
          title: restaurant.name,
          image: restaurant.image,
          imageAlt: restaurant.imageAlt || restaurantImageAlt({ ...restaurant, city: city?.name, country: city?.country }),
          badge: restaurant.priceRange || restaurant.cuisineType || "Restaurant",
        }
      : undefined;
  }

  if (selectedItem.type === "activity") {
    const attraction = attractions.find((item) => candidates.some((candidate) => matchesEntityId(item, candidate)));
    const city = cities.find((item) => item.slug === attraction?.citySlug);
    return attraction
      ? {
          key: `activity-${attraction.id}`,
          href: `/${attraction.citySlug}/attractions/${attraction.slug}`,
          title: attraction.name,
          image: attraction.image,
          imageAlt: attraction.imageAlt || attractionImageAlt({ ...attraction, country: city?.country }),
          badge: attraction.category || attraction.type || "Activity",
        }
      : undefined;
  }

  if (selectedItem.type === "guide") {
    const guide = guides.find((item) => candidates.some((candidate) => matchesEntityId(item, candidate)));
    return guide
      ? {
          key: `guide-${guide.id}`,
          href: getGuideHref(guide),
          title: guide.title,
          image: guide.coverImage || guide.image,
          imageAlt: guideImageAlt(guide),
          badge: guide.category || "Guide",
        }
      : undefined;
  }

  if (selectedItem.type === "custom" && selectedItem.itemId) {
    return {
      key: `custom-${selectedItem.id}`,
      href: selectedItem.itemId,
      title: selectedItem.customTitle || selectedItem.itemId,
      description: selectedItem.customSummary,
      badge: "Custom",
    };
  }

  return undefined;
}

function structuredGuideItemListEntries(
  guide: Guide,
  selectedItems: StructuredSelectedItem[],
  destinations: Destination[],
) {
  if (guide.guideType === "best_places" || guide.guideType === "day_trip" || guide.guideType === "road_trip") {
    return selectedItems.map((item) => ({
      href: item.href,
      title: item.title,
      description: item.description,
      image: item.image,
      badge: item.badge,
    }));
  }

  if (guide.guideType === "itinerary") {
    return (guide.guideData.itinerary || [])
      .map((item) => {
        const destination = item.destinationId
          ? destinations.find((destinationItem) => matchesEntityId(destinationItem, item.destinationId))
          : undefined;
        return {
          href: destination ? getCanonicalDestinationPath(destination) : "",
          title: item.placeTitle || destination?.name || "",
          description: item.details,
          image: destination?.image,
          badge: item.timeSlot || `Day ${item.dayNumber}`,
        };
      })
      .filter((item) => item.href && item.title);
  }

  return [];
}

function dedupeItemListEntries(items: Array<{ href: string; title: string; description?: string; image?: string; badge?: string }>) {
  return items.filter((item, index, list) => item.href && item.title && list.findIndex((candidate) => candidate.href === item.href) === index);
}

function groupItineraryByDay(items: GuideItineraryItem[]) {
  const days = new Map<number, GuideItineraryItem[]>();

  for (const item of items) {
    const day = item.dayNumber || 1;
    days.set(day, [...(days.get(day) || []), item]);
  }

  return Array.from(days.entries())
    .sort(([dayA], [dayB]) => dayA - dayB)
    .map(([dayNumber, dayItems]) => ({
      dayNumber,
      items: [...dayItems].sort((a, b) => a.displayOrder - b.displayOrder),
    }));
}

function hasRouteData(route?: GuideRouteData) {
  return Boolean(
    route?.startingPoint ||
      route?.endingPoint ||
      route?.distance ||
      route?.travelTime ||
      route?.bestTransport ||
      route?.routeNotes ||
      route?.parkingInfo,
  );
}

function guideItemListEntries(blocks: ResolvedGuideListingBlock[]) {
  const eligibleTypes = new Set<ResolvedGuideListingBlock["type"]>([
    "destinations",
    "restaurants",
    "activities",
  ]);

  return blocks
    .filter((block) => eligibleTypes.has(block.type))
    .flatMap((block) => block.items)
    .filter((item, index, items) => items.findIndex((candidate) => candidate.href === item.href) === index)
    .map((item) => ({
      href: item.href,
      title: item.title,
      description: item.description,
      image: item.image,
      badge: item.badge,
    }));
}

function listingBlockForContentBlock(
  block: GuideCmsBlock,
  context: {
    guide: Guide;
    listingBlocks: ResolvedGuideListingBlock[];
    cities: City[];
    destinations: Destination[];
    attractions: Attraction[];
    restaurants: Restaurant[];
    guides: Guide[];
  },
): ResolvedGuideListingBlock | undefined {
  const existingBlock = context.listingBlocks.find((listingBlock) => listingBlock.id === block.id);

  if (existingBlock) {
    return existingBlock;
  }

  const title = block.title || selectedBlockFallbackTitle(block.type);
  const itemIds = block.itemIds || [];

  if (!title || itemIds.length === 0) {
    return undefined;
  }

  const items = selectedBlockItems(block, context);

  if (items.length === 0) {
    return undefined;
  }

  return {
    id: block.id,
    title,
    type: selectedBlockListingType(block.type),
    items,
  };
}

function selectedBlockItems(
  block: GuideCmsBlock,
  context: {
    guide: Guide;
    cities: City[];
    destinations: Destination[];
    attractions: Attraction[];
    restaurants: Restaurant[];
    guides: Guide[];
  },
): ResolvedGuideListingBlockItem[] {
  const itemIds = block.itemIds || [];

  if (block.type === "selected-destinations") {
    return itemIds
      .map((id) => context.destinations.find((item) => matchesEntityId(item, id)))
      .filter((item): item is Destination => Boolean(item))
      .map((destination) => {
        const city = context.cities.find((item) => item.slug === destination.citySlug);

        return {
          key: `destination-${destination.id}`,
          href: getCanonicalDestinationPath(destination),
          title: destination.name,
          description: destination.summary || destination.location || destination.city,
          image: destination.image,
          imageAlt: destination.imageAlt || destinationImageAlt({ ...destination, country: city?.country }),
          badge: destination.category || "Destination",
        };
      });
  }

  if (block.type === "selected-cities") {
    return itemIds
      .map((id) => context.cities.find((item) => matchesEntityId(item, id)))
      .filter((item): item is City => Boolean(item))
      .map((city) => ({
        key: `city-${city.id}`,
        href: `/${city.slug}`,
        title: city.name,
        description: city.shortDescription || city.region || city.country,
        image: city.cardImage || city.featuredImage || city.heroImage,
        imageAlt: city.cardImageAlt || city.featuredImageAlt || city.heroImageAlt || cityImageAlt(city, "card"),
        badge: city.country || "City",
      }));
  }

  if (block.type === "selected-countries") {
    return itemIds
      .map((id) => context.cities.find((city) => slugify(city.country) === slugify(id)))
      .filter((item): item is City => Boolean(item))
      .map((city) => ({
        key: `country-${slugify(city.country)}`,
        href: countryPath(city.country),
        title: city.country,
        description: `Explore cities, destinations, and travel guides across ${city.country}.`,
        image: city.featuredImage || city.heroImage || city.cardImage,
        imageAlt: `${city.country} travel inspiration`,
        badge: "Country",
      }));
  }

  if (block.type === "selected-restaurants") {
    return itemIds
      .map((id) => context.restaurants.find((item) => matchesEntityId(item, id)))
      .filter((item): item is Restaurant => Boolean(item))
      .map((restaurant) => {
        const city = context.cities.find((item) => item.id === restaurant.cityId);

        return {
          key: `restaurant-${restaurant.id}`,
          href: `/restaurants/${restaurant.slug}`,
          title: restaurant.name,
          description: restaurant.shortDescription || restaurant.address,
          image: restaurant.image,
          imageAlt: restaurant.imageAlt || restaurantImageAlt({ ...restaurant, city: city?.name, country: city?.country }),
          badge: restaurant.priceRange || restaurant.cuisineType || "Restaurant",
        };
      });
  }

  if (block.type === "selected-activities") {
    return itemIds
      .map((id) => context.attractions.find((item) => matchesEntityId(item, id)))
      .filter((item): item is Attraction => Boolean(item))
      .map((attraction) => {
        const city = context.cities.find((item) => item.slug === attraction.citySlug);

        return {
          key: `activity-${attraction.id}`,
          href: `/${attraction.citySlug}/attractions/${attraction.slug}`,
          title: attraction.name,
          description: attraction.summary || attraction.description,
          image: attraction.image,
          imageAlt: attraction.imageAlt || attractionImageAlt({ ...attraction, country: city?.country }),
          badge: attraction.category || attraction.type || "Activity",
        };
      });
  }

  if (block.type === "related-guides") {
    return itemIds
      .map((id) => context.guides.find((item) => matchesEntityId(item, id)))
      .filter((item): item is Guide => Boolean(item))
      .filter((guide) => guide.id !== context.guide.id)
      .map((guide) => ({
        key: `guide-${guide.id}`,
        href: getGuideHref(guide),
        title: guide.title,
        description: guide.excerpt || guide.seoDescription,
        image: guide.coverImage || guide.image,
        imageAlt: guideImageAlt(guide),
        badge: guide.category || "Guide",
      }));
  }

  return [];
}

function selectedBlockListingType(type: GuideCmsBlock["type"]): ResolvedGuideListingBlock["type"] {
  if (type === "selected-destinations") return "destinations";
  if (type === "selected-cities") return "cities";
  if (type === "selected-countries") return "countries";
  if (type === "selected-restaurants") return "restaurants";
  if (type === "selected-activities") return "activities";
  return "guides";
}

function selectedBlockFallbackTitle(type: GuideCmsBlock["type"]) {
  if (type === "selected-destinations") return "Selected places";
  if (type === "selected-cities") return "Selected cities";
  if (type === "selected-countries") return "Selected places";
  if (type === "selected-restaurants") return "Selected restaurants";
  if (type === "selected-activities") return "Selected activities";
  if (type === "related-guides") return "Related guides";
  return "";
}

function guideContentBlockTocId(block: GuideCmsBlock, title: string) {
  return isSelectedEntityBlock(block.type)
    ? `listing-block-${slugify(block.id || title)}`
    : block.id;
}

function guideContentBlockTocTitle(block: GuideCmsBlock) {
  if (isSelectedEntityBlock(block.type)) {
    return block.title || selectedBlockFallbackTitle(block.type);
  }

  if (block.type === "quick-info") {
    return block.title || "Quick info";
  }

  if (block.type === "quick-answer") {
    return block.title || "Quick Answer";
  }

  if (block.type === "map") {
    return block.title || "Map";
  }

  if (block.type === "travel-tips" || block.type === "warnings" || block.type === "best-time-to-visit" || block.type === "estimated-cost") {
    return block.title || tipsFallbackTitle(block.type);
  }

  if (block.type === "cta" || block.type === "car-rental-cta" || block.type === "newsletter-cta") {
    return block.title || ctaFallbackTitle(block.type);
  }

  if (block.type === "intro") {
    return block.title || "Introduction";
  }

  if (block.type === "overview") {
    return block.title || "Overview";
  }

  return block.title || "";
}

function isSelectedEntityBlock(type: GuideCmsBlock["type"]) {
  return (
    type === "selected-destinations" ||
    type === "selected-cities" ||
    type === "selected-countries" ||
    type === "selected-restaurants" ||
    type === "selected-activities" ||
    type === "related-guides"
  );
}

function commonMistakesForBlock(block: GuideCmsBlock) {
  const seen = new Set<string>();
  const values = [...(block.tips || []), ...splitCommonMistakeLines(block.body || "")];

  return values.filter((value) => {
    const normalized = normalizeDisplayKey(value);
    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function splitCommonMistakeLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function isSelectedReusableContentBlock(type: GuideCmsBlock["type"]) {
  return (
    type === "selected-destinations" ||
    type === "selected-cities" ||
    type === "selected-countries" ||
    type === "selected-restaurants" ||
    type === "selected-activities"
  );
}

function ctaFallbackTitle(type: GuideCmsBlock["type"]) {
  if (type === "newsletter-cta") {
    return "Get fresh travel ideas";
  }

  if (type === "car-rental-cta") {
    return "Plan your rental car";
  }

  return "Plan your trip";
}

function tipsFallbackTitle(type: GuideCmsBlock["type"]) {
  if (type === "best-time-to-visit") {
    return "Best time to visit";
  }

  if (type === "estimated-cost") {
    return "Estimated cost";
  }

  if (type === "warnings") {
    return "Common mistakes";
  }

  return "Travel tips";
}

function guideTypeLabel(type: Guide["guideType"]) {
  if (type === "best_places") return "Best Places";
  if (type === "things_to_do") return "Things To Do";
  if (type === "itinerary") return "Itinerary";
  if (type === "day_trip") return "Day Trip";
  if (type === "road_trip") return "Road Trip";
  if (type === "destination_combination") return "Destination Guide";
  if (type === "comparison") return "Comparison Guide";
  if (type === "seasonal") return "Seasonal Guide";
  return "Travel Guide";
}

function selectedItemsTocLabel(type: Guide["guideType"]) {
  if (type === "best_places") return "Best places";
  if (type === "things_to_do") return "Things to do";
  if (type === "itinerary") return "Itinerary";
  if (type === "day_trip" || type === "road_trip") return "Stops";
  return "Selected places";
}

function selectedItemsSectionId(type: Guide["guideType"]) {
  if (type === "best_places") return "best-places";
  if (type === "things_to_do") return "things-to-do";
  if (type === "day_trip" || type === "road_trip") return "stops";
  return "selected-places";
}

function cleanGuideDisplayLabel(value?: string) {
  const cleaned = String(value || "")
    .replace(/(?:Primary Keyword|Primary Keywords|Secondary Keyword|Secondary Keywords|SEO Title|SEO Description|SEO Keywords)\s*:[\s\S]*$/i, "")
    .replace(/(?:Quick Answer|Estimated Cost|Common Mistakes|FAQs?|Frequently Asked Questions)\s*:[\s\S]*$/i, "")
    .split("\n")[0]
    .trim();

  return cleaned.length > 48 ? "" : cleaned;
}

function splitQuickAnswerFromText(value: string) {
  const match = value.match(/([\s\S]*?)Quick Answer\s*:\s*([\s\S]+)$/i);

  if (!match) {
    return {
      description: value.trim(),
      quickAnswer: "",
    };
  }

  return {
    description: match[1].trim(),
    quickAnswer: match[2].trim(),
  };
}

function isPlaceholderQuickInfo(item: { label: string; value: string }) {
  return item.label.trim().toLowerCase() === "label" && item.value.trim().toLowerCase() === "value";
}

function dedupeEstimatedCostBlocks(blocks: GuideCmsBlock[]) {
  const estimatedCostBlocks = blocks.filter((block) => block.type === "estimated-cost");
  const preferredEstimatedCostBlock =
    estimatedCostBlocks.find((block) => estimatedCostItemsForBlock(block).length > 0) || estimatedCostBlocks[0];
  let emittedEstimatedCost = false;

  return blocks.filter((block) => {
    if (block.type !== "estimated-cost") {
      return true;
    }

    if (emittedEstimatedCost || block !== preferredEstimatedCostBlock) {
      return false;
    }

    emittedEstimatedCost = true;
    return true;
  });
}

function estimatedCostItemsForBlock(block: GuideCmsBlock): GuideQuickInfoItem[] {
  const storedItems = estimatedCostCandidateValues(block).flatMap((value) => estimatedCostValueItems(value));
  const parsedItems = storedItems.length > 0 ? storedItems : parseEstimatedCostItems(block.body || block.tips?.join("\n") || "");
  const seen = new Set<string>();

  return parsedItems.filter((item) => {
    const label = normalizeDisplayKey(item.label);
    const value = normalizeDisplayKey(item.value);
    const key = `${label}:${value}`;

    if (!label || !value || isEstimatedCostLabelOnly(item.value) || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function estimatedCostCandidateValues(block: GuideCmsBlock): unknown[] {
  const record = block as Record<string, unknown>;
  const values: unknown[] = [record.estimatedCost, record.estimated_cost];

  for (const [key, value] of Object.entries(record)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (normalizedKey.includes("estimated") && normalizedKey.includes("cost")) {
      values.push(value);
    }
  }

  return values.filter((value, index, items) => Boolean(value) && items.indexOf(value) === index);
}

function estimatedCostPlainText(block: GuideCmsBlock) {
  if (estimatedCostItemsForBlock(block).length > 0) {
    return "";
  }

  const parts = [block.body, ...(block.tips || [])]
    .map((item) => String(item || "").trim())
    .filter((item) => item && !isEstimatedCostLabelOnly(item));

  return Array.from(new Set(parts)).join("\n\n");
}

function parseEstimatedCostItems(value: string) {
  const items: GuideQuickInfoItem[] = [];
  let currentLabel = "";
  let currentLines: string[] = [];

  const flush = () => {
    if (!currentLabel) {
      return;
    }

    const sectionValue = cleanEstimatedCostText(currentLines.join("\n"));

    if (sectionValue) {
      items.push({ label: currentLabel, value: sectionValue });
    }

    currentLabel = "";
    currentLines = [];
  };

  for (const rawLine of value.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();
    const rowMatch = line.match(/^[-*]?\s*(Budget|Mid[-\s]?range|Premium)\s*(?::|\|)\s*(.*)$/i);

    if (rowMatch) {
      flush();
      currentLabel = displayEstimatedCostLabel(rowMatch[1]);
      currentLines = rowMatch[2] ? [rowMatch[2]] : [];
      continue;
    }

    if (currentLabel) {
      currentLines.push(rawLine);
    }
  }

  flush();

  return items;
}

function estimatedCostValueItems(value: unknown): GuideQuickInfoItem[] {
  if (typeof value === "string") {
    return parseEstimatedCostItems(value);
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = typeof item === "object" && item !== null ? (item as Partial<GuideQuickInfoItem>) : {};
      return {
        label: String(record.label || "").trim(),
        value: String(record.value || "").trim(),
      };
    })
    .filter((item) => item.label && item.value && !isEstimatedCostLabelOnly(item.value));
}

function cleanEstimatedCostText(value: string) {
  return value
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => line && !isEstimatedCostLabelOnly(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isEstimatedCostLabelOnly(value: string) {
  return /^(budget|mid-range|mid range|premium)\s*:?\s*$/i.test(value.trim());
}

function displayEstimatedCostLabel(value: string) {
  return normalizeDisplayKey(value).replace(/[-\s]/g, "") === "midrange"
    ? "Mid-range"
    : value.trim().replace(/^\w/, (letter) => letter.toUpperCase());
}

function normalizeDisplayKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isPlaceholderSelectedItem(item: GuideSelectedItem) {
  const values = [
    item.itemId,
    item.itemSlug,
    item.itemName,
    item.customTitle,
    item.customSummary,
    item.bestFor,
    item.suggestedTime,
    item.readMoreLabel,
    ...(item.nearbyPlaces || []),
  ].map((value) => String(value || "").trim().toLowerCase());
  const meaningfulValues = values.filter(Boolean);

  if (meaningfulValues.length === 0) {
    return true;
  }

  return meaningfulValues.every((value) =>
    [
      "custom title",
      "custom summary",
      "fresh summary",
      "best for",
      "suggested time",
      "nearby places",
      "read more label",
      "label",
      "value",
    ].includes(value),
  );
}

function matchesEntityId(item: { id: string; slug?: string; name?: string; title?: string }, id: string) {
  const normalizedId = slugify(id);
  return (
    item.id === id ||
    slugify(item.id) === normalizedId ||
    (item.slug ? slugify(item.slug) === normalizedId : false) ||
    (item.name ? slugify(item.name) === normalizedId : false) ||
    (item.title ? slugify(item.title) === normalizedId : false)
  );
}

function dedupeContextualEntities(entities: ContextualEntity[]) {
  return Array.from(new Map(entities.filter((entity) => entity.href && entity.title).map((entity) => [entity.key, entity])).values());
}

function entityAliases(...values: Array<string | undefined>) {
  const aliases = values
    .flatMap((value) => {
      const normalizedValue = String(value || "").trim();

      if (!normalizedValue) {
        return [];
      }

      return [normalizedValue, normalizedValue.replace(/-/g, " ")];
    })
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter((value) => value.length >= 3 && !genericAliasWords.has(value.toLowerCase()));

  return Array.from(new Set(aliases)).sort((a, b) => b.length - a.length);
}

function keywordList(...values: Array<string | string[] | undefined>) {
  return Array.from(
    new Set(
      values
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .flatMap((value) => String(value || "").toLowerCase().match(/[a-z0-9]+/g) || [])
        .filter((word) => word.length >= 4 && !genericKeywordWords.has(word)),
    ),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type InlineListSection = {
  title: string;
  items: string[];
};

const listSectionHeadingPattern =
  /^(travel tips|recommended attractions|recommended destinations|recommended places|best areas|what to eat|where to eat|highlights|places mentioned|places to visit|things to do)\b/i;

const faqHeadingPattern = /^(#{2,3}\s*)?(faqs?|frequently asked questions)\b/i;

const genericAliasWords = new Set([
  "city",
  "guide",
  "travel",
  "place",
  "places",
  "spot",
  "spots",
  "restaurant",
  "restaurants",
  "cafe",
  "beach",
  "mountain",
  "country",
]);

const genericKeywordWords = new Set([
  "with",
  "from",
  "this",
  "that",
  "your",
  "guide",
  "travel",
  "place",
  "places",
  "city",
  "country",
  "destination",
  "attraction",
  "restaurant",
]);

function parseListSection(text: string): InlineListSection | undefined {
  const trimmedText = text.trim();
  const lines = trimmedText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  if (lines.length > 1) {
    const title = lines[0].replace(/:$/, "").trim();
    const allLinesAreItems = lines.every((line) => /^([-*]|\d+[.)])\s+/.test(line));

    if (allLinesAreItems) {
      return validInlineListSection("Key points", lines.map(cleanListItem).filter(Boolean));
    }

    if (!listSectionHeadingPattern.test(title)) {
      return undefined;
    }

    const items = lines.slice(1).map(cleanListItem).filter(Boolean);
    return validInlineListSection(title, items);
  }

  const labelMatch = trimmedText.match(/^([^:]{3,70}):\s*([\s\S]+)$/);

  if (!labelMatch) {
    return undefined;
  }

  const title = labelMatch[1].trim();

  if (!listSectionHeadingPattern.test(title)) {
    return undefined;
  }

  const items = splitInlineListItems(labelMatch[2]);
  return validInlineListSection(title, items);
}

function mergeFaqItems(...faqGroups: Array<Array<GuideFaq | GuideFaqItem>>): GuideFaqItem[] {
  const faqByQuestion = new Map<string, GuideFaqItem>();

  for (const group of faqGroups) {
    for (const faq of group) {
      const question = faq.question.trim();
      const answer = faq.answer.trim();

      if (!question || !answer) {
        continue;
      }

      const normalizedQuestion = question.toLowerCase();

      if (!faqByQuestion.has(normalizedQuestion)) {
        faqByQuestion.set(normalizedQuestion, { question, answer });
      }
    }
  }

  return Array.from(faqByQuestion.values());
}

function extractFaqsFromContent(content: string[]): GuideFaqItem[] {
  const faqs: GuideFaqItem[] = [];

  for (const block of content) {
    const text = block.trim();

    if (!isFaqLikeContentBlock(text)) {
      continue;
    }

    faqs.push(...parseFaqPairs(text));
  }

  return faqs;
}

function isFaqLikeContentBlock(text: string) {
  if (faqHeadingPattern.test(text.trim())) {
    return true;
  }

  return /(^|\n)\s*(q:|question:|###\s+.+\?)\s*/i.test(text) && /(^|\n)\s*(a:|answer:)\s*/i.test(text);
}

function parseFaqPairs(text: string): GuideFaqItem[] {
  const cleanedText = text
    .replace(/^#{2,3}\s*(faqs?|frequently asked questions)\s*:?\s*/i, "")
    .replace(/^(faqs?|frequently asked questions)\s*:?\s*/i, "")
    .trim();

  return [
    ...parseExplicitFaqPairs(cleanedText),
    ...parseMarkdownQuestionPairs(cleanedText),
  ];
}

function parseExplicitFaqPairs(text: string): GuideFaqItem[] {
  const faqs: GuideFaqItem[] = [];
  const pattern =
    /(?:^|\n)\s*(?:q:|question:)\s*([^\n]+?)\s*\n+\s*(?:a:|answer:)\s*([\s\S]*?)(?=\n+\s*(?:q:|question:|###\s+.+\?)|\s*$)/gi;

  for (const match of text.matchAll(pattern)) {
    const question = match[1]?.trim() || "";
    const answer = match[2]?.trim() || "";

    if (question && answer) {
      faqs.push({ question, answer });
    }
  }

  return faqs;
}

function parseMarkdownQuestionPairs(text: string): GuideFaqItem[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const faqs: GuideFaqItem[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const questionMatch = lines[index].match(/^###\s+(.+\?)$/);

    if (!questionMatch) {
      continue;
    }

    const answerLines: string[] = [];

    for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
      if (/^###\s+.+\?$/.test(lines[nextIndex])) {
        break;
      }

      answerLines.push(lines[nextIndex]);
      index = nextIndex;
    }

    const answer = answerLines.join(" ").trim();

    if (answer) {
      faqs.push({
        question: questionMatch[1].trim(),
        answer,
      });
    }
  }

  return faqs;
}

function splitInlineListItems(value: string) {
  return value
    .split(/\s*(?:;|\||\n| - )\s*|,\s+(?=[A-Z0-9])/)
    .map(cleanListItem)
    .filter(Boolean);
}

function cleanListItem(value: string) {
  return value
    .replace(/^[-*]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .trim();
}

function validInlineListSection(title: string, items: string[]): InlineListSection | undefined {
  const uniqueItems = Array.from(new Set(items)).filter((item) => item.length > 1);

  if (uniqueItems.length < 2 || uniqueItems.length > 12) {
    return undefined;
  }

  return {
    title,
    items: uniqueItems,
  };
}

function headingId(label: string, tableOfContents: Guide["tableOfContents"], index: number) {
  const match = tableOfContents.find((item) => item.label.toLowerCase() === label.toLowerCase());
  return match?.anchor || `${slugify(label)}-${index}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function formatDate(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
