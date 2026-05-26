import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock,
  Hash,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";
import { BreadcrumbTrail } from "@/components/breadcrumb-trail";
import {
  GuideArticleToc,
  GuideFaqAccordion,
  ReadingProgress,
  type GuideFaqItem,
  type GuideTocItem,
} from "@/components/guides/guide-article-enhancements";
import { GuideEntityCard, type GuideEntityCardItem } from "@/components/guides/guide-entity-card";
import {
  buildGuideArticleJsonLd,
  buildGuideBreadcrumbJsonLd,
  buildGuideFaqJsonLd,
  JsonLd,
} from "@/components/seo-json-ld";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCanonicalDestinationPath } from "@/lib/city-intelligence";
import { countryPath } from "@/lib/country-hubs";
import {
  resolveGuideListingBlocks,
  type ResolvedGuideListingBlock,
  type ResolvedGuideListingBlockItem,
} from "@/lib/guide-listing-blocks";
import { resolveImagePath } from "@/lib/images";
import { citySeoPath, cityTopicPages } from "@/lib/programmatic-seo";
import type { Attraction, City, Destination, Guide, GuideFaq, Restaurant } from "@/lib/types";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type GuideDetailArticleProps = {
  guide: Guide;
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

type RelatedPlace = {
  key: string;
  href: string;
  name: string;
  description: string;
  label: string;
  image?: string;
};

type GuideContentBlock =
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

type EntityMention = {
  entity: ContextualEntity;
  start: number;
  end: number;
  text: string;
};

export function GuideDetailArticle({
  guide,
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
  const image = resolveImagePath(guide.coverImage || guide.image);
  const imageAlt = guide.coverImageAlt || guide.title;
  const relatedGuides = resolveRelatedGuides(guide.relatedGuideSlugs, guides, guide.id);
  const relatedPlaces = resolveRelatedPlaces(guide.relatedPlaceSlugs, destinations, attractions, city);
  const similarGuides = resolveSimilarGuides(guide, guides, city).slice(0, 10);
  const listingBlocks = resolveGuideListingBlocks({
    blocks: guide.listingBlocks,
    cities,
    destinations: listingDestinations ?? destinations,
    guides,
    restaurants,
    currentGuideId: guide.id,
  });
  const ctaDestinations = destinations
    .filter((destination) => !guide.relatedPlaceSlugs.includes(destination.slug))
    .slice(0, 4);
  const contentBlocks = buildGuideContentBlocks(
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
  const faqItems = mergeFaqItems(guide.faqs, extractFaqsFromContent(guide.content));
  const tocItems = buildTocItems(contentBlocks, faqItems);
  const articleLayoutClass =
    tocItems.length > 0
      ? "mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8 xl:grid-cols-[240px_minmax(0,1fr)] xl:items-start"
      : "mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8";
  const jsonLd = [
    buildGuideArticleJsonLd({ guide, canonicalPath }),
    buildGuideBreadcrumbJsonLd({
      guide,
      canonicalPath,
      city,
      includeCity: includeCityInBreadcrumbJson,
    }),
    buildGuideFaqJsonLd({ faqs: faqItems }),
  ].filter((item): item is Record<string, unknown> => Boolean(item));

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <ReadingProgress />
      {jsonLd.map((data) => (
        <JsonLd key={String(data["@type"])} data={data} />
      ))}
      <SiteHeader />
      <main>
        <section className="bg-white px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <BreadcrumbTrail items={breadcrumbItems} />
            <Link
              href={backHref}
              className={buttonVariants({
                variant: "ghost",
                className: "mb-5 rounded-full px-0 text-slate-600 hover:bg-transparent",
              })}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {backLabel}
            </Link>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-end">
              <div>
                <Badge className="rounded-full bg-blue-50 px-3 py-1 text-[#1D4ED8] hover:bg-blue-50">
                  {guide.category || "Travel guide"}
                </Badge>
                <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-[#111827] md:text-6xl">
                  {guide.title}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                  {guide.excerpt || descriptionFallback}
                </p>
                <ArticleMeta guide={guide} city={city} />
              </div>
              {(guide.coverImage || guide.image) ? (
                <div className="relative min-h-72 overflow-hidden rounded-3xl bg-slate-200 shadow-2xl shadow-slate-200/80">
                  <Image
                    src={image}
                    alt={imageAlt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 430px, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <GuidePlanningCta city={city} destinations={ctaDestinations} />

        <article className={articleLayoutClass}>
          <GuideArticleToc items={tocItems} />
          <div className="min-w-0">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10 lg:p-12">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
                Travel guide
              </p>
              <div className="mt-8 grid gap-8 md:gap-9">
                {contentBlocks.map((block) => (
                  <ArticleBlockGroup
                    key={block.key}
                    block={block}
                    entities={contextualEntities}
                    contextualSection={contextualSections.get(block.key)}
                  />
                ))}
              </div>
            </div>

            {listingBlocks.length > 0 ? (
              <section className="mt-10 grid gap-8" aria-label="Guide listing blocks">
                {listingBlocks.map((block) => (
                  <GuideListingBlockSection key={block.id} block={block} />
                ))}
              </section>
            ) : null}

            <GuideFaqAccordion faqs={faqItems} />

            {(relatedGuides.length > 0 || relatedPlaces.length > 0) ? (
              <section className="mt-10 grid gap-8">
                {relatedGuides.length > 0 ? (
                  <RelatedGuides guides={relatedGuides} />
                ) : null}
                {relatedPlaces.length > 0 ? (
                  <RelatedPlaces places={relatedPlaces} />
                ) : null}
              </section>
            ) : null}
          </div>
        </article>

        {similarGuides.length > 0 ? <SimilarGuidesCarousel guides={similarGuides} /> : null}
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
      <div className="mx-auto grid max-w-6xl gap-5 rounded-3xl bg-[#0A2A66] p-6 text-white shadow-xl shadow-blue-950/10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center lg:p-7">
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
      className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 hover:text-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
    >
      {children}
    </Link>
  );
}

function GuideListingBlockSection({ block }: { block: ResolvedGuideListingBlock }) {
  const blockHeadingId = `listing-block-${slugify(block.id || block.title)}`;

  return (
    <section aria-labelledby={blockHeadingId} className="min-w-0">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">In this guide</p>
        <h2 id={blockHeadingId} className="mt-2 text-2xl font-semibold tracking-tight text-[#111827]">
          {block.title}
        </h2>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto scroll-smooth px-4 pb-3 [scrollbar-width:thin] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {block.items.map((item) => (
          <GuideEntityCard
            key={item.key}
            item={listingBlockItemToEntityCard(item)}
            className="sm:min-w-0"
          />
        ))}
      </div>
    </section>
  );
}

function ArticleMeta({ guide, city }: { guide: Guide; city?: City }) {
  const date = formatDate(guide.updatedAt || guide.createdAt);
  const meta: Array<{ label: string; icon: ReactNode }> = [
    {
      label: guide.readTime || "Quick read",
      icon: guide.readTime ? (
        <Clock className="size-4 text-[#1D4ED8]" aria-hidden="true" />
      ) : (
        <BookOpen className="size-4 text-[#1D4ED8]" aria-hidden="true" />
      ),
    },
  ];

  if (guide.author) {
    meta.unshift({
      label: guide.author,
      icon: <UserRound className="size-4 text-[#1D4ED8]" aria-hidden="true" />,
    });
  }

  if (city) {
    meta.push({
      label: city.name,
      icon: <MapPin className="size-4 text-[#1D4ED8]" aria-hidden="true" />,
    });
  }

  if (date) {
    meta.push({
      label: `Updated ${date}`,
      icon: <CalendarDays className="size-4 text-[#1D4ED8]" aria-hidden="true" />,
    });
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium text-slate-600">
      {meta.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
          {item.icon}
          {item.label}
        </span>
      ))}
    </div>
  );
}

function ArticleBlockGroup({
  block,
  entities,
  contextualSection,
}: {
  block: GuideContentBlock;
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

function ContentBlock({ block, entities }: { block: GuideContentBlock; entities: ContextualEntity[] }) {
  if (block.kind === "heading") {
    const HeadingTag = block.level === 2 ? "h2" : "h3";
    const headingClassName =
      block.level === 2
        ? "group flex max-w-4xl scroll-mt-24 items-center gap-2 border-t border-slate-200 pt-8 text-3xl font-semibold tracking-tight text-[#111827] first:border-t-0 first:pt-0"
        : "group flex max-w-4xl scroll-mt-24 items-center gap-2 pt-1 text-2xl font-semibold tracking-tight text-[#111827]";

    return (
      <HeadingTag id={block.id} className={headingClassName}>
        <span>{block.title}</span>
        <a
          href={`#${block.id}`}
          className="hidden rounded-full p-1 text-slate-300 transition hover:bg-slate-100 hover:text-[#1D4ED8] focus-visible:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] group-hover:inline-flex"
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

  return (
    <p className="max-w-3xl text-base leading-8 text-slate-600 md:text-lg md:leading-9">
      {renderLinkedText(block.text, entities)}
    </p>
  );
}

function RelatedGuides({ guides }: { guides: Guide[] }) {
  const items = guides.map(guideToEntityCardItem);

  return (
    <div>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">Keep reading</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#111827]">Related guides</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <GuideEntityCard key={item.key} item={item} className="w-auto" />
        ))}
      </div>
    </div>
  );
}

function RelatedPlaces({ places }: { places: RelatedPlace[] }) {
  const items = places.map((place) => ({
    key: place.key,
    href: place.href,
    title: place.name,
    description: place.description,
    image: place.image,
    type: place.label,
  }));

  return (
    <div>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">Explore nearby</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#111827]">Places mentioned in this guide</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <GuideEntityCard key={item.key} item={item} className="w-auto" />
        ))}
      </div>
    </div>
  );
}

function InlineCardListSection({ id, section }: { id: string; section: InlineListSection }) {
  return (
    <section className="scroll-mt-24 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6" aria-labelledby={id}>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">Quick notes</p>
        <h2 id={id} className="group flex items-center gap-2 text-2xl font-semibold tracking-tight text-[#111827]">
          <span>{section.title}</span>
          <a
            href={`#${id}`}
            className="hidden rounded-full p-1 text-slate-300 transition hover:bg-white hover:text-[#1D4ED8] focus-visible:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] group-hover:inline-flex"
            aria-label={`Link to ${section.title}`}
          >
            <Hash className="size-4" aria-hidden="true" />
          </a>
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {section.items.map((item, index) => (
          <div key={`${item}-${index}`} className="min-h-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold leading-6 text-[#111827]">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContextualEntitySectionCards({ section }: { section: ContextualEntitySection }) {
  return (
    <section className="rounded-3xl border border-blue-100 bg-blue-50/40 p-5 md:p-6" aria-label={section.title}>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">Connected travel ideas</p>
        <h3 className="text-xl font-semibold tracking-tight text-[#111827]">{section.title}</h3>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:thin] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {section.items.map((item) => (
          <GuideEntityCard
            key={item.key}
            item={item}
            className="h-80 sm:h-80 sm:min-w-0"
            imageSizes="(min-width: 1024px) 260px, (min-width: 640px) 45vw, 78vw"
          />
        ))}
      </div>
    </section>
  );
}

function renderLinkedText(text: string, entities: ContextualEntity[]) {
  const mentions = firstMentionPerEntity(findEntityMentions(text, entities));

  if (mentions.length === 0) {
    return text;
  }

  const nodes: ReactNode[] = [];
  let cursor = 0;

  mentions.forEach((mention, index) => {
    if (mention.start > cursor) {
      nodes.push(text.slice(cursor, mention.start));
    }

    nodes.push(
      <Link
        key={`${mention.entity.key}-${mention.start}-${index}`}
        href={mention.entity.href}
        className="rounded-md bg-blue-50/70 px-1 py-0.5 font-medium text-[#1D4ED8] transition hover:bg-blue-100 hover:text-[#0A2A66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
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

function SimilarGuidesCarousel({ guides }: { guides: Guide[] }) {
  return (
    <section className="bg-white px-4 pb-14 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">Keep planning</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#111827]">
            More travel guides you may like
          </h2>
        </div>
        <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto scroll-smooth px-4 pb-4 [scrollbar-width:thin] sm:mx-0 sm:px-0">
          {guides.map((guide) => (
            <GuideEntityCard
              key={guide.id}
              item={guideToEntityCardItem(guide)}
              imageSizes="(min-width: 1024px) 270px, 78vw"
              className="grow-0 !w-[18rem] !max-w-[82vw] sm:!w-[18.5rem] sm:!min-w-[18.5rem] sm:!max-w-[18.5rem]"
            />
          ))}
        </div>
      </div>
    </section>
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
  blocks: GuideContentBlock[];
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

function blockSearchText(block: GuideContentBlock) {
  if (block.kind === "heading") {
    return block.title;
  }

  if (block.kind === "list") {
    return `${block.section.title}\n${block.section.items.join("\n")}`;
  }

  return block.text;
}

function buildGuideContentBlocks(content: string[], tableOfContents: Guide["tableOfContents"]): GuideContentBlock[] {
  const idCounts = new Map<string, number>();
  const blocks: GuideContentBlock[] = [];

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

function buildTocItems(blocks: GuideContentBlock[], faqs: GuideFaqItem[]): GuideTocItem[] {
  const items = blocks
    .map((block): GuideTocItem | undefined => {
      if (block.kind === "heading") {
        return {
          id: block.id,
          title: block.title,
          level: block.level,
        };
      }

      if (block.kind === "list") {
        return {
          id: block.id,
          title: block.section.title,
          level: 2,
        };
      }

      return undefined;
    })
    .filter((item): item is GuideTocItem => Boolean(item));

  if (faqs.length > 0) {
    items.push({
      id: "guide-faq-heading",
      title: "Common questions",
      level: 2,
    });
  }

  return items;
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

function resolveRelatedGuides(slugs: string[], guides: Guide[], currentGuideId: string) {
  if (!slugs.length) {
    return [];
  }

  return slugs
    .map((slug) =>
      guides.find((guide) => guide.slug === slug && guide.id !== currentGuideId && isSafeGuideSlug(guide.slug)),
    )
    .filter((guide): guide is Guide => Boolean(guide));
}

function resolveRelatedPlaces(
  slugs: string[],
  destinations: Destination[],
  attractions: Attraction[],
  city?: City,
): RelatedPlace[] {
  if (!slugs.length) {
    return [];
  }

  const places = slugs
    .map((slug): RelatedPlace | undefined => {
      const destination = destinations.find((item) => item.slug === slug);

      if (destination) {
        return {
          key: `destination-${destination.id}`,
          href: getCanonicalDestinationPath(destination, city),
          name: destination.name,
          description: destination.summary || destination.description,
          label: destination.category || "Destination",
          image: destination.image,
        };
      }

      const attraction = attractions.find((item) => item.slug === slug);

      if (attraction) {
        return {
          key: `attraction-${attraction.id}`,
          href: `/${attraction.citySlug}/attractions/${attraction.slug}`,
          name: attraction.name,
          description: attraction.summary || attraction.description,
          label: attraction.category || attraction.type || "Attraction",
          image: attraction.image,
        };
      }

      return undefined;
    })
    .filter((place): place is RelatedPlace => Boolean(place));

  return places;
}

function resolveSimilarGuides(currentGuide: Guide, guides: Guide[], city?: City) {
  const selected = new Map<string, Guide>();
  const sameCitySlug = currentGuide.citySlug || city?.slug;
  const sameCountryId = currentGuide.countryId;

  const addGuides = (items: Guide[]) => {
    for (const guide of items) {
      if (guide.id !== currentGuide.id && isSafeGuideSlug(guide.slug) && !selected.has(guide.id)) {
        selected.set(guide.id, guide);
      }
    }
  };

  if (sameCitySlug) {
    addGuides(guides.filter((guide) => guide.citySlug === sameCitySlug));
  }

  if (sameCountryId) {
    addGuides(guides.filter((guide) => guide.countryId === sameCountryId));
  }

  addGuides(guides);

  return Array.from(selected.values()).sort(sortGuidesNewestFirst);
}

function sortGuidesNewestFirst(a: Guide, b: Guide) {
  const aTime = new Date(a.updatedAt || a.createdAt).getTime();
  const bTime = new Date(b.updatedAt || b.createdAt).getTime();
  return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
}

function guideToEntityCardItem(guide: Guide): GuideEntityCardItem {
  return {
    key: `guide-${guide.id}`,
    href:
      guide.targetType === "city" && guide.citySlug
        ? `/${guide.citySlug}/guides/${guide.slug}`
        : `/guides/${guide.slug}`,
    title: guide.title,
    description: guide.excerpt || guide.seoDescription,
    image: guide.coverImage || guide.image,
    type: guide.category || "Guide",
    badge: guide.readTime || undefined,
    imageAlt: guide.coverImageAlt || `${guide.title} travel guide`,
  };
}

function isSafeGuideSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function listingBlockItemToEntityCard(item: ResolvedGuideListingBlockItem): GuideEntityCardItem {
  return {
    key: item.key,
    href: item.href,
    title: item.title,
    description: item.description,
    image: item.image,
    type: item.badge || "Guide",
  };
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
