import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Binoculars,
  Car,
  Crown,
  Gem,
  Globe2,
  Map,
  Mountain,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TentTree,
  Waves,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { DestinationCard } from "@/components/destination-card";
import { SectionHeading } from "@/components/section-heading";
import { BreadcrumbJsonLd, PlaceJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { countryPath } from "@/lib/country-hubs";
import {
  getAttractionsByCity,
  getCityBySlug,
  getDestinationsByCity,
  getGuidesByCity,
} from "@/lib/data";
import { resolveImagePath } from "@/lib/images";
import { citySeoPages, citySeoPath, cityTopicPages } from "@/lib/programmatic-seo";
import { seoMetadata } from "@/lib/seo";
import type { Attraction, City, Destination, Guide } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CityPageProps = {
  params: Promise<{ citySlug: string }>;
};

const categoryPills = [
  { label: "Beaches", icon: Waves },
  { label: "Mountains", icon: Mountain },
  { label: "Desert", icon: TentTree },
  { label: "Luxury", icon: Crown },
  { label: "Adventure", icon: Binoculars },
  { label: "Hidden Gems", icon: Gem },
  { label: "Family", icon: ShieldCheck },
  { label: "Road Trips", icon: Car },
];

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { citySlug } = await params;
  const city = await getCityBySlug(citySlug);

  if (!city) {
    return {};
  }

  const title = city.seoTitle || `${city.name}, ${city.country} | Top7Spots`;
  const description =
    city.seoDescription ||
    city.shortDescription ||
    `Discover curated travel spots, guides, and attractions in ${city.name}, ${city.country}.`;

  return {
    ...seoMetadata({
      title,
      description,
      path: `/${city.slug}`,
      image: city.heroImage || city.featuredImage || city.cardImage,
    }),
    keywords: city.seoKeywords,
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { citySlug } = await params;
  const [city, destinations, guides, attractions] = await Promise.all([
    getCityBySlug(citySlug),
    getDestinationsByCity(citySlug),
    getGuidesByCity(citySlug),
    getAttractionsByCity(citySlug),
  ]);

  if (!city || city.status !== "published") {
    notFound();
  }

  const sortedGuides = sortGuides(guides);
  const cityAreas = Array.from(
    new Set(
      destinations
        .map((destination) => destination.location || destination.region)
        .filter((area): area is string => Boolean(area)),
    ),
  );
  const cityTravelTips = Array.from(
    new Set(
      destinations
        .flatMap((destination) => [...destination.travelTips, ...destination.practicalInfo])
        .filter(Boolean),
    ),
  ).slice(0, 6);
  const bestSeasonNotes = Array.from(
    new Set(destinations.map((destination) => destination.bestSeason).filter(Boolean)),
  ).slice(0, 3);
  const durationNotes = Array.from(
    new Set(destinations.map((destination) => destination.duration).filter(Boolean)),
  ).slice(0, 3);
  const guideCategories = Array.from(
    new Set(sortedGuides.map((guide) => guide.category).filter(Boolean)),
  ).slice(0, 3);
  const planningHighlights = buildCityPlanningHighlights({
    city,
    cityAreas,
    cityTravelTips,
    bestSeasonNotes,
    durationNotes,
    guideCategories,
    destinations,
  });
  const topPicks = destinations.slice(0, 7);
  const interestLinks = buildInterestLinks({ city, destinations, guides: sortedGuides, attractions });
  const nearbyRoutes = destinations.filter((destination) => isRouteExtension(destination, city)).slice(0, 4);
  const countryHref = city.country ? countryPath(city.country) : "";
  const pillButtonClass =
    "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium whitespace-nowrap text-slate-700 transition hover:border-[#2563EB] hover:bg-blue-50 hover:text-[#0A2A66]";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <BreadcrumbJsonLd
        items={[
          ...(countryHref ? [{ name: city.country, path: countryHref }] : []),
          { name: city.name, path: `/${city.slug}` },
        ]}
      />
      <PlaceJsonLd
        name={`${city.name}, ${city.country}`}
        description={
          city.seoDescription ||
          city.shortDescription ||
          `Discover curated travel spots, guides, and attractions in ${city.name}, ${city.country}.`
        }
        image={city.heroImage || city.featuredImage || city.cardImage}
        path={`/${city.slug}`}
        city={city.name}
        country={city.country}
        region={city.region}
      />
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <header className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <BrandLogo priority imageClassName="h-10 w-auto sm:h-11 lg:h-12" />

            <div className="hidden flex-1 justify-center px-4 md:flex">
              <label className="relative w-full max-w-2xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-[0_12px_35px_rgb(15_23_42_/_10%)] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                  placeholder={`Search ${city.name} spots, beaches, mountains...`}
                />
              </label>
            </div>

            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
              <Link href="/" className="transition hover:text-[#1D4ED8]">
                Cities
              </Link>
              <Link href={`/${city.slug}`} className="transition hover:text-[#1D4ED8]">
                {city.name}
              </Link>
              {countryHref ? (
                <Link href={countryHref} className="transition hover:text-[#1D4ED8]">
                  {city.country}
                </Link>
              ) : null}
            </nav>

            <button
              type="button"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Globe2 className="size-4" aria-hidden="true" />
              EN
            </button>
          </div>

          <label className="relative block md:hidden">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
              placeholder={`Search ${city.name}`}
            />
          </label>
        </header>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8">
          <button type="button" className={pillButtonClass}>
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
          </button>
          {categoryPills.map((pill) => (
            <button key={pill.label} type="button" className={pillButtonClass}>
              <pill.icon className="size-4" aria-hidden="true" />
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <main>
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgb(15_23_42_/_9%)]">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_460px]">
              <div className="p-6 sm:p-8 lg:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
                  {city.country} travel discovery
                </p>
                <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-[#111827] md:text-5xl">
                  Top 7 Spots in {city.name}, {city.country}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                  {city.longDescription ||
                    city.shortDescription ||
                    "Discover curated destinations, hidden gems, road trips, beaches, mountains, luxury experiences, and top recommended places."}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-[#0A2A66]">
                    {destinations.length} curated spots
                  </span>
                  <span className="rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-[#FF6B00]">
                    {guides.length} guides
                  </span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                    {attractions.length} attractions
                  </span>
                  {countryHref ? (
                    <Link
                      href={countryHref}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2A66] transition hover:border-[#2563EB] hover:bg-blue-50"
                    >
                      Explore {city.country}
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="relative min-h-72 overflow-hidden bg-slate-200 lg:min-h-full">
                {city.heroImage ? (
                  <Image
                    src={resolveImagePath(city.heroImage)}
                    alt={`${city.name}, ${city.country}`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 460px, 100vw"
                    className="object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 rounded-xl bg-white/90 p-4 shadow-xl backdrop-blur">
                  <p className="text-sm font-semibold text-[#0A2A66]">{city.region}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    City-first travel discovery with destinations, guides, and local travel ideas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">Top picks</p>
              <h2 className="mt-2 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-[#111827] md:text-4xl">
                Best experiences in {city.name}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Start with the most useful curated places first, then use lighter planning sections
                below to shape the rest of the trip.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
              {topPicks.length} primary picks
            </div>
          </div>

          {topPicks.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {topPicks.map((destination) => (
                <DestinationCard key={destination.id} destination={destination} />
              ))}
            </div>
          ) : (
            <EmptyState title={`More ${city.name} places are coming`} text="Check back for new city ideas, nearby stops, and local travel inspiration." />
          )}
        </section>

        {interestLinks.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-5 lg:grid-cols-[0.7fr_1fr] lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
                    Explore by interest
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#111827]">
                    Choose a travel style
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Use these lighter topic links after the main picks when you want a more focused
                    route through {city.name}.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {interestLinks.map((item) => (
                    <Link
                      key={`${item.label}-${item.href}`}
                      href={item.href}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#F8FAFC] px-4 py-2 text-sm font-semibold text-[#0A2A66] transition hover:border-[#2563EB] hover:bg-blue-50"
                    >
                      <item.icon className="size-4 text-[#1D4ED8]" aria-hidden="true" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="border-y border-slate-200 bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 rounded-xl border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
                  Planning summary
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#111827]">
                  Plan {city.name} with local context
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Treat {city.name} as a city to explore in layers: choose one or two anchor sights,
                  then add nearby neighborhoods, waterfront walks, markets, scenic viewpoints, or
                  slower local stops around them.
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {cityAreas.length > 0
                    ? `Start by grouping places around ${formatList(cityAreas.slice(0, 3))}, then leave enough room for meals, transfers, and unplanned detours.`
                    : `Start with the places that matter most to your route, then leave enough room for meals, transfers, and unplanned detours.`}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {planningHighlights.map((item) => (
                  <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-[#111827]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {nearbyRoutes.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Nearby routes" title={`Day trips and route extensions from ${city.name}`}>
              Use these as connected journeys rather than nearby neighborhoods. They work best when
              you want to extend a {city.name} stay into a wider route.
            </SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {nearbyRoutes.map((destination) => (
                <Link
                  key={destination.id}
                  href={`/${destination.citySlug || city.slug}/destinations/${destination.slug}`}
                  className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#2563EB] hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
                        {destination.category || "Route idea"}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-[#111827]">{destination.name}</h3>
                    </div>
                    <Map className="mt-1 size-5 shrink-0 text-[#1D4ED8] transition group-hover:translate-x-1" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {destination.summary || destination.location || `Extend your ${city.name} route with this connected stop.`}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {sortedGuides.length > 0 ? (
            <>
              <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <SectionHeading eyebrow="Travel Guides" title={`Plan ${city.name} smarter`}>
                  Clear advice for seasons, routing, culture, road trips, and travel style after
                  you have chosen the places that matter most.
                </SectionHeading>
                <Link
                  href={`/${city.slug}/guides`}
                  className="w-fit rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-[#0A2A66] transition hover:border-[#2563EB] hover:bg-blue-50"
                >
                  View all {city.name} guides
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {sortedGuides.slice(0, 4).map((guide) => (
                  <Link
                    key={guide.id}
                    href={`/${city.slug}/guides/${guide.slug}`}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2563EB] hover:shadow-xl"
                  >
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
                      <span>{guide.category || "Guide"}</span>
                      {guide.readTime ? <span className="text-slate-400">{guide.readTime}</span> : null}
                    </div>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight text-[#111827]">{guide.title}</h3>
                    {guide.excerpt ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">{guide.excerpt}</p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <EmptyState title="Guides will appear here" text="Published city guides will appear in this section." />
          )}
        </section>

        <section className="border-y border-slate-200 bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Attraction highlights" title={`More places to compare in ${city.name}`}>
              Use attractions as secondary context once the main city picks and planning route are
              clear.
            </SectionHeading>
            {attractions.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {attractions.slice(0, 8).map((attraction) => (
                  <Link
                    key={attraction.id}
                    href={`/${city.slug}/attractions/${attraction.slug}`}
                    className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2563EB] hover:bg-white hover:shadow-xl"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
                      {attraction.category || attraction.type || "Attraction"}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-[#111827]">{attraction.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {attraction.summary || attraction.description}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="Attractions will appear here" text="Add published attractions to complete this city guide." />
            )}
          </div>
        </section>

        {(destinations.length > 0 || guides.length > 0 || attractions.length > 0) ? (
          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeading eyebrow="More ways to explore" title={`Keep planning ${city.name}`}>
                Supporting links for travelers and search engines, kept lower on the page so they
                help without interrupting discovery.
              </SectionHeading>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <RelatedLinkGroup
                  title={`${city.name} travel pages`}
                  text="Focused planning pages for best places, things to do, and city guide ideas."
                  links={citySeoPages.map((page) => ({
                    href: citySeoPath(city.slug, page.slug),
                    label: page.title(city),
                  }))}
                />
                <RelatedLinkGroup
                  title={`Popular topics in ${city.name}`}
                  text="Focused city themes for food, beaches, family stops, and local mood."
                  links={cityTopicPages.slice(0, 4).map((page) => ({
                    href: citySeoPath(city.slug, page.slug),
                    label: page.title(city),
                  }))}
                />
                {destinations.length > 0 ? (
                  <RelatedLinkGroup
                    title={`Related destinations`}
                    text="Compare nearby places before opening a destination detail page."
                    links={destinations.slice(0, 5).map((destination) => ({
                      href: `/${city.slug}/destinations/${destination.slug}`,
                      label: destination.name,
                    }))}
                  />
                ) : null}
                {guides.length > 0 ? (
                  <RelatedLinkGroup
                    title={`Travel guides`}
                    text="Use city-specific guides to add planning context to your route."
                    links={[
                      { href: `/${city.slug}/guides`, label: `All ${city.name} travel guides` },
                      ...sortedGuides.slice(0, 4).map((guide) => ({
                        href: `/${city.slug}/guides/${guide.slug}`,
                        label: guide.title,
                      })),
                    ]}
                  />
                ) : null}
                {attractions.length > 0 ? (
                  <RelatedLinkGroup
                    title={`Attractions`}
                    text="Open attraction pages for extra stops near your route."
                    links={attractions.slice(0, 5).map((attraction) => ({
                      href: `/${city.slug}/attractions/${attraction.slug}`,
                      label: attraction.name,
                    }))}
                  />
                ) : null}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <Sparkles className="mx-auto size-8 text-[#FF6B00]" aria-hidden="true" />
      <h3 className="mt-4 text-xl font-semibold text-[#111827]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function RelatedLinkGroup({
  title,
  text,
  links,
}: {
  title: string;
  text: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-xl font-semibold tracking-tight text-[#111827]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
      <div className="mt-4 grid gap-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm font-semibold text-[#0A2A66] transition hover:text-[#1D4ED8]">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function buildInterestLinks({
  city,
  destinations,
  guides,
  attractions,
}: {
  city: City;
  destinations: Destination[];
  guides: Guide[];
  attractions: Attraction[];
}) {
  const searchableText = [
    city.name,
    city.shortDescription,
    city.longDescription,
    ...destinations.flatMap((destination) => [
      destination.name,
      destination.category,
      destination.location,
      destination.summary,
      destination.description,
      ...destination.highlights,
      ...destination.travelTips,
    ]),
    ...guides.flatMap((guide) => [guide.title, guide.category, guide.excerpt]),
    ...attractions.flatMap((attraction) => [
      attraction.name,
      attraction.category,
      attraction.type,
      attraction.summary,
      attraction.description,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const links = [
    {
      label: "Beaches",
      href: citySeoPath(city.slug, "best-beaches"),
      icon: Waves,
      keywords: ["beach", "coast", "corniche", "sea", "waterfront"],
    },
    {
      label: "Culture",
      href: citySeoPath(city.slug, "things-to-do"),
      icon: ShieldCheck,
      keywords: ["culture", "heritage", "mosque", "fort", "museum", "souq", "old town"],
    },
    {
      label: "Food",
      href: citySeoPath(city.slug, "best-restaurants"),
      icon: Sparkles,
      keywords: ["food", "restaurant", "dining", "market", "local"],
    },
    {
      label: "Family",
      href: citySeoPath(city.slug, "family-attractions"),
      icon: ShieldCheck,
      keywords: ["family", "kids", "park", "museum", "beach"],
    },
    {
      label: "Luxury",
      href: citySeoPath(city.slug, "best-places"),
      icon: Crown,
      keywords: ["luxury", "premium", "resort", "boutique"],
    },
    {
      label: "Nature",
      href: citySeoPath(city.slug, "best-places"),
      icon: Mountain,
      keywords: ["wadi", "mountain", "nature", "desert", "viewpoint", "trail"],
    },
    {
      label: "Road trips",
      href: citySeoPath(city.slug, "travel-guide"),
      icon: Car,
      keywords: ["road", "drive", "route", "car", "trip"],
    },
    {
      label: "Cafes",
      href: citySeoPath(city.slug, "best-cafes"),
      icon: Sparkles,
      keywords: ["cafe", "coffee", "brunch"],
    },
  ];

  return links.filter((link) => link.keywords.some((keyword) => searchableText.includes(keyword))).slice(0, 8);
}

function isRouteExtension(destination: Destination, city: City) {
  const cityName = city.name.toLowerCase();
  const destinationCity = destination.city?.toLowerCase() || "";
  const location = destination.location?.toLowerCase() || "";

  return Boolean(destinationCity && destinationCity !== cityName) || Boolean(location && !location.includes(cityName));
}

function buildCityPlanningHighlights({
  city,
  cityAreas,
  cityTravelTips,
  bestSeasonNotes,
  durationNotes,
  guideCategories,
  destinations,
}: {
  city: City;
  cityAreas: string[];
  cityTravelTips: string[];
  bestSeasonNotes: string[];
  durationNotes: string[];
  guideCategories: string[];
  destinations: Destination[];
}) {
  const strongestCategories = Array.from(
    new Set(destinations.map((destination) => destination.category).filter(Boolean)),
  ).slice(0, 3);

  return [
    {
      title: "Best time to visit",
      text:
        bestSeasonNotes.length > 0
          ? `Plan around ${formatList(bestSeasonNotes)} when those seasons fit your route, and check local weather before locking in outdoor plans.`
          : "Milder months and early starts usually make sightseeing more comfortable, especially when your route includes outdoor viewpoints or long walks.",
    },
    {
      title: "How long to stay",
      text:
        durationNotes.length > 0
          ? `Many highlighted stops work well as ${formatList(durationNotes)} visits, so even a short stay can feel focused when you group nearby places together.`
          : `Two or three well-planned days in ${city.name} gives most travelers room for headline sights, relaxed meals, and one slower neighborhood walk.`,
    },
    {
      title: "Getting around",
      text:
        cityAreas.length > 0
          ? `Build each day around nearby areas such as ${formatList(cityAreas.slice(0, 3))} so you spend less time crossing the city and more time exploring.`
          : "Group nearby places into the same day, leave buffer time between stops, and check transport options before heading across town.",
    },
    {
      title: "Where to stay",
      text:
        strongestCategories.length > 0
          ? `Choose a base near the experiences you care about most, whether that means ${formatList(strongestCategories).toLowerCase()} or quick access to day-trip routes.`
          : "Choose a base close to the places you care about most, with easy access to meals, evening walks, and any day trips on your list.",
    },
    {
      title: "Travel style",
      text:
        guideCategories.length > 0
          ? `Use ${formatList(guideCategories).toLowerCase()} guide themes to shape the trip around your pace instead of trying to see everything at once.`
          : "Families may prefer flexible outdoor stops and shorter transfers, while couples can leave more room for sunset views, quiet cafes, and slower evenings.",
    },
    {
      title: "Local rhythm",
      text:
        cityTravelTips.length > 0
          ? cityTravelTips[0]
          : "Check opening hours, seasonal conditions, and local customs before finalizing each day, especially for cultural sites and outdoor routes.",
    },
  ];
}

function sortGuides(guides: Guide[]) {
  return [...guides].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) {
      return a.isFeatured ? -1 : 1;
    }

    const orderA = Number.isFinite(a.displayOrder) ? a.displayOrder : 999;
    const orderB = Number.isFinite(b.displayOrder) ? b.displayOrder : 999;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.title.localeCompare(b.title);
  });
}

function formatList(items: string[]) {
  if (items.length <= 1) {
    return items[0] || "";
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
