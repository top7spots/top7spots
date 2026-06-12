import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight, BookOpen, Compass, MapPin, Sparkles } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { BreadcrumbTrail } from "@/components/breadcrumb-trail";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo-json-ld";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCanonicalDestinationPath } from "@/lib/city-intelligence";
import { countryPath } from "@/lib/country-hubs";
import { getGuideHref } from "@/lib/guide-routes";
import { resolveImagePath } from "@/lib/images";
import { citySeoPath, type CityProgrammaticContent, type CitySeoPageConfig } from "@/lib/programmatic-seo";
import type { Attraction, City, Destination } from "@/lib/types";

type CityTopicGuidePageProps = {
  city: City;
  page: CitySeoPageConfig;
  pagePath: string;
  pageContent: CityProgrammaticContent;
  relatedPages: CitySeoPageConfig[];
  hasContent: boolean;
};

type ArticleSection = {
  id: string;
  title: string;
  body: string[];
};

type ListingBlock = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  kind: "destinations" | "attractions";
  items: Array<Destination | Attraction>;
};

type InternalLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function CityTopicGuidePage({
  city,
  page,
  pagePath,
  pageContent,
  relatedPages,
  hasContent,
}: CityTopicGuidePageProps) {
  const countryHref = city.country ? countryPath(city.country) : "";
  const heroImage = resolveImagePath(city.heroImage || city.featuredImage || city.cardImage);
  const articleSections = getArticleSections(city, page, pageContent);
  const listingBlocks = getListingBlocks(city, page, pageContent);
  const internalLinks = getInternalLinks(city, page, relatedPages, countryHref);
  const relatedGuides = pageContent.guides.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <BreadcrumbJsonLd
        items={[
          ...(countryHref ? [{ name: city.country, path: countryHref }] : []),
          { name: city.name, path: `/${city.slug}` },
          { name: page.label, path: pagePath },
        ]}
      />
      <ArticleJsonLd
        title={page.metadataTitle(city)}
        description={page.description(city)}
        image={city.heroImage || city.featuredImage || city.cardImage}
        path={pagePath}
        section={`${city.name} travel`}
        dateModified={city.updatedAt || city.createdAt}
      />
      <SiteHeader />
      <main>
        <section className="bg-white px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <BreadcrumbTrail
              items={[
                ...(countryHref ? [{ label: city.country, href: countryHref }] : []),
                { label: city.name, href: `/${city.slug}` },
                { label: page.label },
              ]}
            />
            <Link
              href={`/${city.slug}`}
              className={buttonVariants({
                variant: "ghost",
                className: "mb-5 rounded-full px-0 text-slate-600 hover:bg-transparent",
              })}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to {city.name}
            </Link>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-end">
              <div>
                <Badge className="rounded-full bg-blue-50 px-3 py-1 text-[#1D4ED8] hover:bg-blue-50">
                  {page.eyebrow || "Travel guide"}
                </Badge>
                <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-[#111827] md:text-6xl">
                  {page.title(city)}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                  {page.intro(city)}
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {pageContent.destinations.length} places
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {pageContent.attractions.length} things to do
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {pageContent.guides.length} guides
                  </span>
                </div>
              </div>
              <div className="relative min-h-72 overflow-hidden rounded-3xl bg-slate-200 shadow-2xl shadow-slate-200/80">
                <SafeImage
                  src={heroImage}
                  alt={`${city.name} travel guide`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 430px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <article className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
          <div className="min-w-0">
            <nav aria-label="Article sections" className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
                In this guide
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {articleSections.map((section) => (
                  <Link
                    key={section.id}
                    href={`#${section.id}`}
                    className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-[#1D4ED8]"
                  >
                    {section.title}
                  </Link>
                ))}
                {listingBlocks.map((block) => (
                  <Link
                    key={block.id}
                    href={`#${block.id}`}
                    className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-[#1D4ED8]"
                  >
                    {block.title}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
                City guide
              </p>
              <div className="mt-7 grid gap-9">
                {articleSections.map((section) => (
                  <section key={section.id} id={section.id} className="scroll-mt-24">
                    <h2 className="text-2xl font-semibold tracking-tight text-[#111827] md:text-3xl">
                      {section.title}
                    </h2>
                    <div className="mt-4 grid gap-4 text-base leading-8 text-slate-600">
                      {section.body.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            {listingBlocks.map((block) => (
              <TopicListingBlock key={block.id} city={city} block={block} />
            ))}

            {!hasContent ? (
              <section className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm md:p-10">
                <Compass className="mx-auto size-8 text-[#FF6B00]" aria-hidden="true" />
                <h2 className="mt-4 text-2xl font-semibold text-[#111827]">More {city.name} ideas are on the way</h2>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  This guide-style page is ready, but the current data set needs more depth before
                  showing curated listings for this topic.
                </p>
              </section>
            ) : null}
          </div>

          <aside className="h-fit rounded-3xl bg-[#0A2A66] p-6 text-white shadow-xl shadow-blue-950/15 lg:sticky lg:top-24">
            <Sparkles className="size-8 text-orange-300" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-semibold">Keep planning {city.name}</h2>
            <p className="mt-3 text-sm leading-7 text-blue-50">
              Use this page as a guide, then open city, destination, and article links for deeper
              planning context.
            </p>
            <div className="mt-5 grid gap-2 border-t border-white/10 pt-5">
              {internalLinks.map((item) => (
                <SidebarLink key={item.href} item={item} />
              ))}
            </div>
            {relatedGuides.length > 0 ? (
              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
                  Related guides
                </p>
                <div className="mt-3 grid gap-3">
                  {relatedGuides.map((guide) => (
                    <Link
                      key={guide.id}
                      href={getGuideHref(guide)}
                      className="rounded-2xl bg-white/10 p-3 text-sm font-semibold leading-6 text-white transition hover:bg-white/15"
                    >
                      {guide.title}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

function TopicListingBlock({ city, block }: { city: City; block: ListingBlock }) {
  if (block.items.length === 0) {
    return null;
  }

  return (
    <section id={block.id} className="mt-10 scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">{block.eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#111827] md:text-3xl">{block.title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{block.description}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {block.items.slice(0, 8).map((item) =>
          block.kind === "destinations" ? (
            <CompactDestinationLink key={item.id} destination={item as Destination} city={city} />
          ) : (
            <CompactAttractionLink key={item.id} attraction={item as Attraction} />
          ),
        )}
      </div>
    </section>
  );
}

function CompactDestinationLink({ destination, city }: { destination: Destination; city: City }) {
  const image = resolveImagePath(destination.image);
  const href = getCanonicalDestinationPath(destination, city);
  const location =
    [destination.location, destination.city].filter(Boolean).join(", ") ||
    [destination.city, destination.region].filter(Boolean).join(", ") ||
    city.name;

  return (
    <Link
      href={href}
      className="group flex min-h-36 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:-translate-y-0.5 hover:border-[#2563EB] hover:bg-white hover:shadow-lg"
    >
      <div className="relative w-28 shrink-0 bg-slate-100">
        <SafeImage
          src={image}
          alt={destination.name}
          fill
          sizes="112px"
          unoptimized
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF6B00]">
            {destination.category || "Destination"}
          </p>
          <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 text-[#111827] group-hover:text-[#1D4ED8]">
            {destination.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{location}</p>
        </div>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#1D4ED8]">
          Open place
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

function CompactAttractionLink({ attraction }: { attraction: Attraction }) {
  const image = resolveImagePath(attraction.image);
  const href = attraction.citySlug ? `/${attraction.citySlug}/attractions/${attraction.slug}` : "";
  const content = (
    <>
      <div className="relative w-28 shrink-0 bg-slate-100">
        <SafeImage
          src={image}
          alt={attraction.name}
          fill
          sizes="112px"
          unoptimized
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF6B00]">
            {attraction.type || attraction.category || "Attraction"}
          </p>
          <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 text-[#111827] group-hover:text-[#1D4ED8]">
            {attraction.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
            {attraction.summary || attraction.city || "A recommended local stop."}
          </p>
        </div>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#1D4ED8]">
          Open stop
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </>
  );

  if (!href) {
    return (
      <div className="group flex min-h-36 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group flex min-h-36 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:-translate-y-0.5 hover:border-[#2563EB] hover:bg-white hover:shadow-lg"
    >
      {content}
    </Link>
  );
}

function SidebarLink({ item }: { item: InternalLinkItem }) {
  const Icon = item.icon;

  return (
    <Link href={item.href} className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
      <span className="flex items-center gap-2">
        <Icon className="size-4" aria-hidden="true" />
        {item.label}
      </span>
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}

function getArticleSections(
  city: City,
  page: CitySeoPageConfig,
  content: CityProgrammaticContent,
): ArticleSection[] {
  const totalPlaces = content.destinations.length + content.attractions.length;

  if (page.slug === "travel-guide") {
    return [
      {
        id: "start-here",
        title: `Start with ${city.name} at a glance`,
        body: [
          page.intro(city),
          `${city.name} is easiest to plan when the city hub, destination pages, and practical guides work together. Use this page as the overview layer before opening individual places or guide articles.`,
        ],
      },
      {
        id: "how-to-plan",
        title: "How to shape your route",
        body: [
          `Choose a small number of anchor stops first, then add nearby attractions and timing notes around them. This keeps the route flexible without turning the day into a checklist.`,
          `Top7Spots currently has ${totalPlaces} structured ${totalPlaces === 1 ? "idea" : "ideas"} connected to ${city.name}, plus ${content.guides.length} planning ${content.guides.length === 1 ? "guide" : "guides"} for deeper context.`,
        ],
      },
      {
        id: "next-steps",
        title: "Where to go next",
        body: [
          `Open the ${city.name} city hub for the full entity view, then use destination and guide links when you need more detail on a specific stop, season, or route decision.`,
        ],
      },
    ];
  }

  return [
    {
      id: "overview",
      title: `What this ${city.name} guide covers`,
      body: [
        page.intro(city),
        `This guide-style page pulls together the most relevant structured places and planning links currently connected to ${city.name}. It keeps the original topic URL intact while presenting the content in a more editorial format.`,
      ],
    },
    {
      id: "how-to-choose",
      title: "How to choose what fits your trip",
      body: [
        `Start with the listings that match your intent, then open the individual place pages for practical details, location context, and nearby ideas. If a section has no strong matches yet, it stays hidden rather than showing empty cards.`,
        `For now, these recommendations come from the existing Top7Spots structured data and programmatic topic rules. Future phases can replace the source with admin-controlled guide blocks without changing this URL.`,
      ],
    },
  ];
}

function getListingBlocks(
  city: City,
  page: CitySeoPageConfig,
  content: CityProgrammaticContent,
): ListingBlock[] {
  if (page.slug === "travel-guide") {
    return [];
  }

  const destinationBlock: ListingBlock = {
    id: "places",
    eyebrow: "Destination ideas",
    title: `Places to visit in ${city.name}`,
    description: `Open destination pages for deeper context on where each ${city.name} idea fits in a route.`,
    kind: "destinations",
    items: uniqueById(content.destinations),
  };
  const attractionBlock: ListingBlock = {
    id: "things-to-do",
    eyebrow: "Things to do",
    title: `Attractions and things to do in ${city.name}`,
    description: "Use these stops to add local texture, shorter visits, and flexible planning ideas.",
    kind: "attractions",
    items: uniqueById(content.attractions),
  };
  const orderedBlocks = page.slug === "things-to-do"
    ? [attractionBlock, destinationBlock]
    : [destinationBlock, attractionBlock];

  return orderedBlocks.filter((block) => block.items.length > 0);
}

function getInternalLinks(
  city: City,
  page: CitySeoPageConfig,
  relatedPages: CitySeoPageConfig[],
  countryHref: string,
): InternalLinkItem[] {
  const links: InternalLinkItem[] = [
    { href: `/${city.slug}`, label: `${city.name} city hub`, icon: MapPin },
    { href: "/destinations", label: "Destination hub", icon: Compass },
    { href: `/${city.slug}/guides`, label: `${city.name} guides`, icon: BookOpen },
    ...(countryHref ? [{ href: countryHref, label: `${city.country} hub`, icon: MapPin }] : []),
    ...relatedPages
      .filter((item) => item.slug !== page.slug)
      .slice(0, 3)
      .map((item) => ({
        href: citySeoPath(city.slug, item.slug),
        label: item.shortLabel,
        icon: Sparkles,
      })),
  ];

  return uniqueLinks(links);
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function uniqueLinks(links: InternalLinkItem[]) {
  return Array.from(new Map(links.map((link) => [link.href, link])).values());
}
