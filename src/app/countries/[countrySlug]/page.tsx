import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Building2, MapPin, Sparkles } from "lucide-react";
import { AttractionCard } from "@/components/attraction-card";
import { BreadcrumbTrail } from "@/components/breadcrumb-trail";
import { DestinationCard } from "@/components/destination-card";
import { GuideCard } from "@/components/guide-card";
import { SectionHeading } from "@/components/section-heading";
import { BreadcrumbJsonLd, TouristDestinationJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buildCountryHubs, countryPath, getCountryHubBySlug } from "@/lib/country-hubs";
import {
  getPublishedAttractions,
  getPublishedCities,
  getPublishedDestinations,
  getPublishedGuides,
} from "@/lib/data";
import { resolveImagePath } from "@/lib/images";
import { cityProgrammaticPages, citySeoPath } from "@/lib/programmatic-seo";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CountryPageProps = {
  params: Promise<{ countrySlug: string }>;
};

async function getCountryHubs() {
  const [cities, destinations, guides, attractions] = await Promise.all([
    getPublishedCities(),
    getPublishedDestinations(),
    getPublishedGuides(),
    getPublishedAttractions(),
  ]);

  return buildCountryHubs({ cities, destinations, guides, attractions });
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { countrySlug } = await params;
  const country = getCountryHubBySlug(await getCountryHubs(), countrySlug);

  if (!country) {
    return {};
  }

  return seoMetadata({
    title: `${country.name} Travel Guide | Top7Spots`,
    description: `Explore cities, destinations, attractions, and travel guides for ${country.name} with Top7Spots.`,
    path: countryPath(country.slug),
    image: country.image,
  });
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { countrySlug } = await params;
  const country = getCountryHubBySlug(await getCountryHubs(), countrySlug);

  if (!country) {
    notFound();
  }

  const heroImage = resolveImagePath(country.image);
  const featuredDestinations = country.destinations.slice(0, 8);
  const relatedGuides = country.guides.slice(0, 4);
  const attractions = country.attractions.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <BreadcrumbJsonLd items={[{ name: country.name, path: countryPath(country.slug) }]} />
      <TouristDestinationJsonLd
        name={country.name}
        description={`Explore cities, destinations, attractions, and travel guides for ${country.name} with Top7Spots.`}
        image={country.image}
        path={countryPath(country.slug)}
        country={country.name}
      />
      <SiteHeader />
      <main>
        <section className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <BreadcrumbTrail items={[{ label: "Countries" }, { label: country.name }]} />
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
                  Country travel hub
                </p>
                <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-[#111827] md:text-6xl">
                  Best places to visit in {country.name}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                  Explore Top7Spots city hubs, destination ideas, travel guides, and attractions
                  across {country.name}. This country page connects existing published content so
                  travelers can move from national inspiration into city and destination details.
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-[#0A2A66]">
                    <Building2 className="size-4" aria-hidden="true" />
                    {country.cities.length} cit{country.cities.length === 1 ? "y" : "ies"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-[#FF6B00]">
                    <MapPin className="size-4" aria-hidden="true" />
                    {country.destinations.length} destinations
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-slate-700">
                    <BookOpen className="size-4" aria-hidden="true" />
                    {country.guides.length} guides
                  </span>
                </div>
              </div>
              <div className="relative min-h-72 overflow-hidden rounded-3xl bg-slate-200 shadow-2xl shadow-slate-200/80">
                <Image
                  src={heroImage}
                  alt={`${country.name} travel inspiration`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 440px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionHeading eyebrow={`${country.name} cities`} title={`Explore cities in ${country.name}`}>
            Start with a city hub to browse local destinations, guides, attractions, and nearby
            planning ideas.
          </SectionHeading>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {country.cities.map((city) => (
              <article
                key={city.id}
                className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#2563EB] hover:shadow-xl"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
                  {city.region || country.name}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#111827]">
                  <Link href={`/${city.slug}`} className="transition hover:text-[#1D4ED8]">
                    {city.name}
                  </Link>
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                  {city.shortDescription ||
                    `Explore destination ideas, attractions, and travel guides for ${city.name}.`}
                </p>
                <Link
                  href={`/${city.slug}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0A2A66] transition group-hover:text-[#1D4ED8]"
                >
                  Open city hub
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {cityProgrammaticPages.slice(0, 5).map((page) => (
                    <Link
                      key={page.slug}
                      href={citySeoPath(city.slug, page.slug)}
                      className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-[#1D4ED8]"
                    >
                      {page.shortLabel}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {featuredDestinations.length > 0 ? (
          <section className="border-y border-slate-200 bg-white py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeading eyebrow="Featured destinations" title={`Where to go in ${country.name}`}>
                Compare existing destination pages connected to cities in this country.
              </SectionHeading>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {featuredDestinations.map((destination) => (
                  <DestinationCard key={destination.id} destination={destination} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {(relatedGuides.length > 0 || attractions.length > 0) ? (
          <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
            {relatedGuides.length > 0 ? (
              <div>
                <SectionHeading eyebrow="Related guides" title={`${country.name} travel guides`}>
                  Read guides connected to cities and destinations in this country.
                </SectionHeading>
                <div className="grid gap-5 sm:grid-cols-2">
                  {relatedGuides.map((guide) => (
                    <GuideCard key={guide.id} guide={guide} />
                  ))}
                </div>
              </div>
            ) : null}
            {attractions.length > 0 ? (
              <div>
                <SectionHeading eyebrow="Attractions" title={`Attractions in ${country.name}`}>
                  Add existing attraction pages to your country and city research path.
                </SectionHeading>
                <div className="grid gap-5 sm:grid-cols-2">
                  {attractions.map((attraction) => (
                    <AttractionCard key={attraction.id} attraction={attraction} />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="border-t border-slate-200 bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm">
              <Sparkles className="size-7 text-[#FF6B00]" aria-hidden="true" />
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#111827]">
                Plan your {country.name} route through city hubs
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Country pages are generated from existing Top7Spots content. Add or publish more
                cities, destinations, guides, and attractions in the admin dashboard to expand this
                hub automatically.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
