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
  Star,
  TentTree,
  Waves,
} from "lucide-react";
import { AttractionCard } from "@/components/attraction-card";
import { BrandLogo } from "@/components/brand-logo";
import { DestinationCard } from "@/components/destination-card";
import { GuideCard } from "@/components/guide-card";
import { SectionHeading } from "@/components/section-heading";
import { BreadcrumbJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import {
  getAttractionsByCity,
  getCityBySlug,
  getDestinationsByCity,
  getGuidesByCity,
} from "@/lib/data";
import { resolveImagePath } from "@/lib/images";
import { seoMetadata } from "@/lib/seo";

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

const inspiration = [
  "Secret beaches and coastal drives",
  "Mountain stays with sunrise views",
  "Luxury escapes and boutique routes",
  "Historic forts, souqs, and old towns",
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

  const cityAreas = Array.from(
    new Set(
      destinations
        .map((destination) => destination.location || destination.region)
        .filter((area): area is string => Boolean(area)),
    ),
  );
  const pillButtonClass =
    "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium whitespace-nowrap text-slate-700 transition hover:border-[#2563EB] hover:bg-blue-50 hover:text-[#0A2A66]";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <BreadcrumbJsonLd items={[{ name: city.name, path: `/${city.slug}` }]} />
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
                    City-first travel discovery, filtered by local content.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">City spots</p>
              <h2 className="mt-2 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-[#111827] md:text-4xl">
                Explore {city.name} destinations
              </h2>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
              {destinations.length} curated spots live
            </div>
          </div>

          {destinations.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {destinations.map((destination) => (
                <DestinationCard key={destination.id} destination={destination} />
              ))}
            </div>
          ) : (
            <EmptyState title={`No ${city.name} destinations yet`} text="Add published destinations in the admin dashboard to populate this city page." />
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Top Rated Spots" title={`Highly recommended places in ${city.name}`}>
            Premium cards support unlimited city content and automatically wrap into clean rows
            across desktop, tablet, and mobile.
          </SectionHeading>
          {destinations.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {destinations.map((destination) => (
                <DestinationCard key={`rated-${destination.id}`} destination={destination} />
              ))}
            </div>
          ) : (
            <EmptyState title="Top rated spots coming soon" text="Published destinations will appear here automatically." />
          )}
        </section>

        <section className="border-y border-slate-200 bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow={`Explore ${city.name}`} title={`Neighborhoods and routes around ${city.name}`}>
              Use this city page as the landing hub for local spots, guides, and attractions.
            </SectionHeading>
            {cityAreas.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cityAreas.map((area) => (
                  <Link
                    key={area}
                    href={`/${city.slug}`}
                    className="group flex items-center justify-between rounded-xl border border-slate-200 bg-[#F8FAFC] p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#2563EB] hover:bg-white hover:shadow-xl"
                  >
                    <span>
                      <span className="block text-lg font-semibold text-[#111827]">{area}</span>
                      <span className="text-sm text-slate-500">Explore nearby experiences</span>
                    </span>
                    <Map className="size-5 text-[#1D4ED8] transition group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="Local areas coming soon" text="Destination locations will become neighborhood and route links here." />
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Hidden Gems" title={`Curated finds across ${city.name}`}>
            Discover quieter places, scenic routes, and distinctive stops selected for travelers who
            want more than a checklist.
          </SectionHeading>
          {destinations.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {destinations.map((destination) => (
                <DestinationCard key={`hidden-${destination.id}`} destination={destination} />
              ))}
            </div>
          ) : (
            <EmptyState title="Hidden gems coming soon" text="Add city destinations to unlock this collection." />
          )}
        </section>

        <section className="bg-[#0A2A66] py-14 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Weekend Escapes" title={`Short trips from ${city.name}`} tone="dark">
              <span className="text-blue-100">
                Turn two or three days into beaches, mountain roads, desert light, and memorable
                local stops.
              </span>
            </SectionHeading>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {inspiration.map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/10 p-6 shadow-xl">
                  <Sparkles className="mb-5 size-7 text-[#FF6B00]" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">{item}</h3>
                  <p className="mt-3 text-sm leading-6 text-blue-100">
                    A polished inspiration tile ready for future curated collections.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Essential Travel Guides" title={`Plan ${city.name} smarter`}>
            Clear advice for seasons, routing, culture, road trips, and travel style.
          </SectionHeading>
          {guides.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {guides.map((guide) => (
                <GuideCard key={guide.id} guide={guide} />
              ))}
            </div>
          ) : (
            <EmptyState title="Guides coming soon" text="Published city guides will appear in this section." />
          )}
        </section>

        <section className="border-y border-slate-200 bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Most Loved Places" title={`Top attractions in ${city.name}`}>
              Attractions can expand into global top lists, city pages, and guide collections.
            </SectionHeading>
            {attractions.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {attractions.map((attraction) => (
                  <AttractionCard key={attraction.id} attraction={attraction} />
                ))}
              </div>
            ) : (
              <EmptyState title="Attractions coming soon" text="Add published attractions to complete this city guide." />
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Travel Inspiration" title={`Ideas for your ${city.name} route`}>
            Explore by mood, terrain, travel style, and trip length.
          </SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Waves, title: "Beach days", text: "Soft sand, coastal roads, and clear water." },
              { icon: Mountain, title: "Mountain air", text: "High viewpoints, villages, and cool nights." },
              { icon: Car, title: "Road trips", text: "Flexible routes for travelers who like the journey." },
              { icon: Crown, title: "Luxury stays", text: "Premium escapes with a more polished pace." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <item.icon className="mb-5 size-7 text-[#1D4ED8]" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-[#111827]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Featured Experiences" title={`Signature ways to discover ${city.name}`}>
            Experience tiles are dummy UI for now and ready for future booking-free editorial
            collections.
          </SectionHeading>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Binoculars,
                title: "Sunrise desert route",
                text: "Wake early for dune light, quiet roads, and wide open skies.",
              },
              {
                icon: ShieldCheck,
                title: "Heritage trail",
                text: "Connect forts, old markets, architecture, and culture-rich towns.",
              },
              {
                icon: Star,
                title: "Premium escape",
                text: "Blend scenic places with elegant stays and slow travel moments.",
              },
            ].map((experience) => (
              <div
                key={experience.title}
                className="rounded-xl border border-slate-200 bg-white p-6 travel-card-shadow transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <experience.icon className="mb-5 size-7 text-[#FF6B00]" aria-hidden="true" />
                <h3 className="text-xl font-semibold text-[#111827]">{experience.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{experience.text}</p>
              </div>
            ))}
          </div>
        </section>
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
