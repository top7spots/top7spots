import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";
import { BreadcrumbTrail } from "@/components/breadcrumb-trail";
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
import {
  resolveGuideListingBlocks,
  type ResolvedGuideListingBlock,
  type ResolvedGuideListingBlockItem,
} from "@/lib/guide-listing-blocks";
import { resolveImagePath } from "@/lib/images";
import { citySeoPath, cityTopicPages } from "@/lib/programmatic-seo";
import type { Attraction, City, Destination, Guide, Restaurant } from "@/lib/types";

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
  const jsonLd = [
    buildGuideArticleJsonLd({ guide, canonicalPath }),
    buildGuideBreadcrumbJsonLd({
      guide,
      canonicalPath,
      city,
      includeCity: includeCityInBreadcrumbJson,
    }),
    buildGuideFaqJsonLd(guide),
  ].filter((item): item is Record<string, unknown> => Boolean(item));

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
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

        <article className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="min-w-0">
            {guide.tableOfContents.length > 0 ? (
              <nav
                aria-label="Table of contents"
                className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
                  In this guide
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {guide.tableOfContents.map((item) => (
                    <Link
                      key={`${item.label}-${item.anchor}`}
                      href={`#${item.anchor}`}
                      className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-[#1D4ED8]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </nav>
            ) : null}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10 lg:p-12">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
                Travel guide
              </p>
              <div className="mt-8 grid gap-8">
                {(guide.content.length > 0
                  ? guide.content
                  : ["More travel notes are being shaped for this guide."]
                ).map((paragraph, index) => (
                  <ContentBlock
                    key={`${paragraph}-${index}`}
                    text={paragraph}
                    index={index}
                    tableOfContents={guide.tableOfContents}
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

            {guide.faqs.length > 0 ? (
              <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
                  FAQs
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827]">
                  Common questions
                </h2>
                <div className="mt-6 grid gap-4">
                  {guide.faqs.map((faq) => (
                    <div key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <h3 className="text-lg font-semibold leading-7 text-[#111827]">{faq.question}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

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
      <h2 id={blockHeadingId} className="text-2xl font-semibold tracking-tight text-[#111827]">
        {block.title}
      </h2>
      <div className="-mx-4 mt-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
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

function ContentBlock({
  text,
  index,
  tableOfContents,
}: {
  text: string;
  index: number;
  tableOfContents: Guide["tableOfContents"];
}) {
  if (text.startsWith("## ")) {
    const heading = text.replace(/^##\s+/, "").trim();
    return (
      <h2 id={headingId(heading, tableOfContents, index)} className="scroll-mt-24 text-3xl font-semibold tracking-tight text-[#111827]">
        {heading}
      </h2>
    );
  }

  if (text.startsWith("### ")) {
    const heading = text.replace(/^###\s+/, "").trim();
    return (
      <h3 id={headingId(heading, tableOfContents, index)} className="scroll-mt-24 text-2xl font-semibold tracking-tight text-[#111827]">
        {heading}
      </h3>
    );
  }

  const listSection = parseListSection(text);

  if (listSection) {
    return <InlineCardListSection section={listSection} />;
  }

  return <p className="max-w-4xl text-base leading-8 text-slate-600 md:text-lg md:leading-9">{text}</p>;
}

function RelatedGuides({ guides }: { guides: Guide[] }) {
  const items = guides.map(guideToEntityCardItem);

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">Related guides</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">Places mentioned in this guide</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <GuideEntityCard key={item.key} item={item} className="w-auto" />
        ))}
      </div>
    </div>
  );
}

function InlineCardListSection({ section }: { section: InlineListSection }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">
      <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">{section.title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {section.items.map((item, index) => (
          <div key={`${item}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold leading-6 text-[#111827]">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SimilarGuidesCarousel({ guides }: { guides: Guide[] }) {
  return (
    <section className="bg-white px-4 pb-14 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">
          More travel guides you may like
        </h2>
        <div className="-mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          {guides.map((guide) => (
            <GuideEntityCard
              key={guide.id}
              item={guideToEntityCardItem(guide)}
              imageSizes="(min-width: 1024px) 270px, 78vw"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function resolveRelatedGuides(slugs: string[], guides: Guide[], currentGuideId: string) {
  if (!slugs.length) {
    return [];
  }

  return slugs
    .map((slug) => guides.find((guide) => guide.slug === slug && guide.id !== currentGuideId))
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
      if (guide.id !== currentGuide.id && !selected.has(guide.id)) {
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

type InlineListSection = {
  title: string;
  items: string[];
};

const listSectionHeadingPattern =
  /^(travel tips|recommended attractions|recommended destinations|recommended places|best areas|what to eat|where to eat|highlights|places mentioned|places to visit|things to do)\b/i;

function parseListSection(text: string): InlineListSection | undefined {
  const trimmedText = text.trim();
  const lines = trimmedText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  if (lines.length > 1) {
    const title = lines[0].replace(/:$/, "").trim();

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
