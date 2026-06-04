import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { DestinationCard } from "@/components/destination-card";
import { CarRentalLandingPage } from "@/components/car-rental/car-rental-landing-page";
import { SectionHeading } from "@/components/section-heading";
import { BreadcrumbJsonLd, PlaceJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { countryPath } from "@/lib/country-hubs";
import { getCityBySlug, getDestinationsByCity, getGuidesByCity, getPublishedCarRentalPage, getPublishedCities } from "@/lib/data";
import { carRentalPageMetadata } from "@/lib/car-rental-seo";
import { getGuideHref } from "@/lib/guide-routes";
import { resolveImagePath } from "@/lib/images";
import { seoMetadata } from "@/lib/seo";
import type { City, Destination, Guide } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CityPageProps = {
  params: Promise<{ citySlug: string }>;
};

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { citySlug } = await params;
  const city = await getCityBySlug(citySlug);

  if (!city) {
    const carRentalPage = await getPublishedCarRentalPage("en", citySlug);
    return carRentalPage ? carRentalPageMetadata(carRentalPage) : {};
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
  const city = await getCityBySlug(citySlug);

  if (!city || city.status !== "published") {
    const carRentalPage = await getPublishedCarRentalPage("en", citySlug);

    if (carRentalPage) {
      return <CarRentalLandingPage page={carRentalPage} />;
    }

    notFound();
  }

  const [destinations, guides, publishedCities] = await Promise.all([
    getDestinationsByCity(citySlug),
    getGuidesByCity(citySlug),
    getPublishedCities(),
  ]);

  const cityDestinations = sortCityDestinations(destinations);
  const cityGuides = sortCityGuides(guides);
  const heroDescription = buildCityHeroDescription(city);
  const longDescription = city.longDescription.trim();
  const similarCities = selectSimilarCities(city, publishedCities, 10);
  const countryHref = city.country ? countryPath(city.country) : "";
  const cityHeroImage = city.heroImage || city.featuredImage || city.cardImage;
  const destinationCountLabel = `${cityDestinations.length} ${
    cityDestinations.length === 1 ? "destination" : "destinations"
  }`;
  const guideCountLabel = `${cityGuides.length} ${cityGuides.length === 1 ? "guide" : "guides"}`;

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
        image={cityHeroImage}
        path={`/${city.slug}`}
        city={city.name}
        country={city.country}
        region={city.region}
      />
      <SiteHeader />

      <main>
        <section className="mx-auto max-w-[88rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgb(15_23_42_/_9%)]">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_460px]">
              <div className="p-6 sm:p-8 lg:p-9">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
                  {city.country} travel discovery
                </p>
                <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-[#111827] md:text-5xl">
                  Top 7 Spots in {city.name}, {city.country}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                  {heroDescription}
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <span className="rounded-full bg-blue-50 px-3.5 py-1.5 text-sm font-semibold text-[#0A2A66]">
                    {destinationCountLabel}
                  </span>
                  <span className="rounded-full bg-orange-50 px-3.5 py-1.5 text-sm font-semibold text-[#FF6B00]">
                    {guideCountLabel}
                  </span>
                  {countryHref ? (
                    <Link
                      href={countryHref}
                      className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-[#0A2A66] transition hover:border-[#2563EB] hover:bg-blue-50"
                    >
                      Explore {city.country}
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="relative min-h-64 overflow-hidden bg-slate-200 lg:min-h-full">
                {cityHeroImage ? (
                  <Image
                    src={resolveImagePath(cityHeroImage)}
                    alt={`${city.name}, ${city.country}`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 460px, 100vw"
                    className="object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/90 p-3.5 shadow-xl backdrop-blur">
                  <p className="text-sm font-semibold text-[#0A2A66]">{city.region}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Curated city discovery with destination-first travel context.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-7 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">Top picks</p>
              <h2 className="mt-2 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-[#111827] md:text-4xl">
                Best experiences in {city.name}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                Browse every published destination connected to {city.name}, ordered by the
                current editorial sort order.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
              {destinationCountLabel}
            </div>
          </div>

          {cityDestinations.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {cityDestinations.map((destination) => (
                <DestinationCard
                  key={destination.id}
                  destination={destination}
                  imageSizes="(max-width: 768px) 100vw, 360px"
                />
              ))}
            </div>
          ) : (
            <EmptyState title={`More ${city.name} places are coming`} text="Check back for new city ideas, nearby stops, and local travel inspiration." />
          )}

          {longDescription ? <AboutCitySection city={city} longDescription={longDescription} /> : null}
        </section>

        <section className="mx-auto max-w-[88rem] px-4 py-9 sm:px-6 lg:px-8">
          {cityGuides.length > 0 ? (
            <>
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <SectionHeading eyebrow="Travel Guides" title={`Plan ${city.name} smarter`}>
                  Short planning reads for adding context after the route starts to take shape.
                </SectionHeading>
                <Link
                  href={`/${city.slug}/guides`}
                  className="w-fit rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-[#0A2A66] transition hover:border-[#2563EB] hover:bg-blue-50"
                >
                  View all {city.name} guides
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {cityGuides.map((guide) => (
                  <Link
                    key={guide.id}
                    href={getGuideHref(guide)}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2563EB] hover:shadow-lg"
                  >
                    <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
                      <span>{guide.category || "Guide"}</span>
                      {guide.readTime ? <span className="text-slate-400">{guide.readTime}</span> : null}
                    </div>
                    <h3 className="mt-2 text-lg font-semibold tracking-tight text-[#111827]">{guide.title}</h3>
                    {guide.excerpt ? (
                      <p className="mt-1.5 text-sm leading-6 text-slate-600">{shortenText(guide.excerpt, 110)}</p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <EmptyState title="Guides will appear here" text="Published city guides will appear in this section." />
          )}
        </section>

        {similarCities.length > 0 ? (
          <section className="border-t border-slate-200 bg-white py-12">
            <div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-8">
              <SectionHeading eyebrow="Continue exploring" title="Similar Cities to Explore">
                More published city hubs with nearby context, shared country relevance, or a
                similar editorial travel feel.
              </SectionHeading>
              <div className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
                {similarCities.map((similarCity) => (
                  <SimilarCityCard key={similarCity.id} city={similarCity} />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

function AboutCitySection({
  city,
  longDescription,
}: {
  city: City;
  longDescription: string;
}) {
  const paragraphs = formatEditorialParagraphs(longDescription);

  return (
    <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgb(15_23_42_/_7%)] sm:p-8 lg:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
        City context
      </p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-[#111827] md:text-4xl">
        About {city.name}
      </h2>
      <div className="mt-7">
        <div className="gap-x-10 gap-y-5 text-base leading-8 text-slate-600 lg:columns-2">
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="mb-5 break-inside-avoid whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function SimilarCityCard({ city }: { city: City }) {
  const image = city.cardImage || city.featuredImage || city.heroImage;

  return (
    <Link
      href={`/${city.slug}`}
      className="group relative min-h-[360px] w-[290px] shrink-0 snap-start overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-[0_18px_50px_rgb(15_23_42_/_10%)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgb(15_23_42_/_18%)] sm:w-[340px]"
    >
      <div className="absolute inset-0 overflow-hidden bg-slate-100">
        {image ? (
          <Image
            src={resolveImagePath(image)}
            alt={`${city.name}, ${city.country}`}
            fill
            sizes="340px"
            unoptimized
            className="object-cover transition duration-700 ease-out group-hover:scale-110"
          />
        ) : null}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/5" />
      <div className="relative flex min-h-[360px] flex-col justify-between p-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#0A2A66] shadow-sm backdrop-blur">
            {city.isFeatured ? "Featured" : "City hub"}
          </span>
          {city.countryCode ? (
            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur">
              {city.countryCode}
            </span>
          ) : null}
        </div>
        <div>
          <p className="text-sm font-semibold text-orange-200">{city.country}</p>
          <h3 className="mt-2 text-3xl font-semibold tracking-tight">{city.name}</h3>
          {city.shortDescription ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-100">
              {city.shortDescription}
            </p>
          ) : null}
          <span className="mt-5 inline-flex w-fit rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A2A66] shadow-lg shadow-slate-950/20 transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-blue-50">
            Explore city
          </span>
        </div>
      </div>
    </Link>
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

function buildCityHeroDescription(city: City) {
  const source =
    city.shortDescription ||
    city.longDescription ||
    `${city.name} is a curated travel base for discovering standout places, local atmosphere, and practical routes across ${city.country}.`;

  return source.replace(/\s+/g, " ").trim();
}

function shortenText(text: string, maxLength: number) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const trimmed = normalized.slice(0, maxLength).trim();
  const lastSpace = trimmed.lastIndexOf(" ");
  const safeTrimmed = lastSpace > Math.floor(maxLength * 0.6) ? trimmed.slice(0, lastSpace) : trimmed;

  return `${safeTrimmed.replace(/[.,;:!?-]+$/, "")}...`;
}

function formatEditorialParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function selectSimilarCities(currentCity: City, cities: City[], limit: number) {
  const currentCountry = normalizeComparableText(currentCity.country);
  const currentRegion = normalizeComparableText(currentCity.region);

  return cities
    .filter((city) => city.id !== currentCity.id && city.slug !== currentCity.slug)
    .map((city) => ({
      city,
      priority: similarCityPriority(city, currentCountry, currentRegion),
    }))
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      if (a.city.isFeatured !== b.city.isFeatured) {
        return a.city.isFeatured ? -1 : 1;
      }

      const orderCompare = compareDisplayOrder(a.city.displayOrder, b.city.displayOrder);
      return orderCompare || a.city.name.localeCompare(b.city.name);
    })
    .slice(0, limit)
    .map((item) => item.city);
}

function similarCityPriority(city: City, currentCountry: string, currentRegion: string) {
  const country = normalizeComparableText(city.country);
  const region = normalizeComparableText(city.region);

  if (currentCountry && country === currentCountry) {
    return 0;
  }

  if (currentRegion && region === currentRegion) {
    return 1;
  }

  return city.isFeatured ? 2 : 3;
}

function normalizeComparableText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function sortCityDestinations(destinations: Destination[]) {
  return [...destinations].sort((a, b) => {
    const orderCompare = compareDisplayOrder(a.displayOrder, b.displayOrder);
    if (orderCompare !== 0) {
      return orderCompare;
    }

    const createdCompare = compareCreatedAt(a.createdAt, b.createdAt);
    return createdCompare || a.name.localeCompare(b.name);
  });
}

function sortCityGuides(guides: Guide[]) {
  return [...guides].sort((a, b) => {
    const orderCompare = compareDisplayOrder(a.displayOrder, b.displayOrder);
    if (orderCompare !== 0) {
      return orderCompare;
    }

    const createdCompare = compareCreatedAt(a.createdAt, b.createdAt);
    return createdCompare || a.title.localeCompare(b.title);
  });
}

function compareDisplayOrder(a: number, b: number) {
  const orderA = Number.isFinite(a) ? a : 999;
  const orderB = Number.isFinite(b) ? b : 999;
  return orderA - orderB;
}

function compareCreatedAt(a: string, b: string) {
  const dateA = Date.parse(a);
  const dateB = Date.parse(b);

  if (!Number.isFinite(dateA) && !Number.isFinite(dateB)) {
    return 0;
  }

  if (!Number.isFinite(dateA)) {
    return 1;
  }

  if (!Number.isFinite(dateB)) {
    return -1;
  }

  return dateB - dateA;
}

