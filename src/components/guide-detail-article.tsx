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
import { resolveImagePath } from "@/lib/images";
import { citySeoPath, cityTopicPages } from "@/lib/programmatic-seo";
import type { Attraction, City, Destination, Guide } from "@/lib/types";

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
  destinations: Destination[];
  attractions: Attraction[];
  descriptionFallback: string;
};

type RelatedPlace = {
  key: string;
  href: string;
  name: string;
  description: string;
  label: string;
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
  destinations,
  attractions,
  descriptionFallback,
}: GuideDetailArticleProps) {
  const image = resolveImagePath(guide.coverImage || guide.image);
  const imageAlt = guide.coverImageAlt || guide.title;
  const relatedGuides = resolveRelatedGuides(guide.relatedGuideSlugs, guides, guide.id);
  const relatedPlaces = resolveRelatedPlaces(guide.relatedPlaceSlugs, destinations, attractions);
  const sidebarDestinations = destinations
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

        <article className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
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

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
                Travel guide
              </p>
              <div className="mt-7 grid gap-7">
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

          <aside className="h-fit rounded-3xl bg-[#0A2A66] p-6 text-white shadow-xl shadow-blue-950/15 lg:sticky lg:top-24">
            <Sparkles className="size-8 text-orange-300" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-semibold">Use this guide to shape a route</h2>
            <p className="mt-3 text-sm leading-7 text-blue-50">
              Top7Spots is built for discovery and inspiration, keeping travel planning fast,
              visual, and easy to revisit.
            </p>
            <div className="mt-5 grid gap-2 border-t border-white/10 pt-5">
              {city ? (
                <>
                  <Link href={`/${city.slug}`} className="text-sm font-semibold text-white transition hover:text-orange-200">
                    Explore {city.name}
                  </Link>
                  {cityTopicPages.slice(0, 4).map((topic) => (
                    <Link
                      key={topic.slug}
                      href={citySeoPath(city.slug, topic.slug)}
                      className="text-sm font-semibold text-blue-50 transition hover:text-orange-200"
                    >
                      {topic.title(city)}
                    </Link>
                  ))}
                </>
              ) : null}
              {sidebarDestinations.map((destination) => (
                <Link
                  key={destination.id}
                  href={`/${destination.citySlug}/destinations/${destination.slug}`}
                  className="text-sm font-semibold text-blue-50 transition hover:text-orange-200"
                >
                  {destination.name}
                </Link>
              ))}
            </div>
          </aside>
        </article>
      </main>
      <SiteFooter />
    </div>
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

  return <p className="text-base leading-8 text-slate-600 md:text-lg">{text}</p>;
}

function RelatedGuides({ guides }: { guides: Guide[] }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">Related guides</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.id}
            href={guide.citySlug ? `/${guide.citySlug}/guides/${guide.slug}` : `/guides/${guide.slug}`}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
              {guide.category || "Guide"}
            </p>
            <h3 className="mt-2 text-lg font-semibold leading-7 text-[#111827]">{guide.title}</h3>
            {guide.excerpt ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{guide.excerpt}</p> : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

function RelatedPlaces({ places }: { places: RelatedPlace[] }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">Related places</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {places.map((place) => (
          <Link
            key={place.key}
            href={place.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">{place.label}</p>
            <h3 className="mt-2 text-lg font-semibold leading-7 text-[#111827]">{place.name}</h3>
            {place.description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{place.description}</p> : null}
          </Link>
        ))}
      </div>
    </div>
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
): RelatedPlace[] {
  if (!slugs.length) {
    return [];
  }

  return slugs
    .map((slug) => {
      const destination = destinations.find((item) => item.slug === slug);

      if (destination) {
        return {
          key: `destination-${destination.id}`,
          href: `/${destination.citySlug}/destinations/${destination.slug}`,
          name: destination.name,
          description: destination.summary || destination.description,
          label: destination.category || "Destination",
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
        };
      }

      return undefined;
    })
    .filter((place): place is RelatedPlace => Boolean(place));
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
