import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Camera,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { AttractionCard } from "@/components/attraction-card";
import { BreadcrumbTrail } from "@/components/breadcrumb-trail";
import { DestinationGuideSection } from "@/components/destination-guide-section";
import { DestinationCarouselSection } from "@/components/destination-carousel-section";
import { FaqSection } from "@/components/faq-section";
import { SectionHeading } from "@/components/section-heading";
import { BreadcrumbJsonLd, FAQPageJsonLd, TouristDestinationJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getCanonicalDestinationPath } from "@/lib/city-intelligence";
import { countryPath } from "@/lib/country-hubs";
import {
  getAttractionsByCity,
  getCityBySlug,
  getDestinationByCityAndSlug,
  getDestinationsByCity,
  getGuidesByCity,
  getGuidesForDestination,
} from "@/lib/data";
import { resolveImagePath } from "@/lib/images";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DestinationDetailPageProps = {
  params: Promise<{ citySlug: string; destinationSlug: string }>;
};

export async function generateMetadata({
  params,
}: DestinationDetailPageProps): Promise<Metadata> {
  const { citySlug, destinationSlug } = await params;
  const [city, destination] = await Promise.all([
    getCityBySlug(citySlug),
    getDestinationByCityAndSlug(citySlug, destinationSlug),
  ]);

  if (!city || !destination) {
    return {};
  }

  const canonicalPath = getCanonicalDestinationPath(destination, city);

  return seoMetadata({
    title: destination.seoTitle || `${destination.name}, ${city.name} | Top7Spots`,
    description:
      destination.seoDescription ||
      destination.summary ||
      `Explore ${destination.name} in ${city.name} with Top7Spots.`,
    path: canonicalPath,
    image: destination.image,
  });
}

export default async function DestinationDetailPage({ params }: DestinationDetailPageProps) {
  const { citySlug, destinationSlug } = await params;
  const [city, destination, destinations, attractions, cityGuides, destinationGuides] = await Promise.all([
    getCityBySlug(citySlug),
    getDestinationByCityAndSlug(citySlug, destinationSlug),
    getDestinationsByCity(citySlug),
    getAttractionsByCity(citySlug),
    getGuidesByCity(citySlug),
    getGuidesForDestination(destinationSlug),
  ]);

  if (!city || !destination) {
    notFound();
  }

  const image = resolveImagePath(destination.image);
  const category = destination.category || "Travel spot";
  const location =
    [destination.location, destination.region].filter(Boolean).join(", ") ||
    [destination.city, destination.region].filter(Boolean).join(", ") ||
    city.name;
  const relatedDestinations = Array.from(
    new Map(
      destinations
        .filter((item) => {
          if (item.id === destination.id) {
            return false;
          }

          if (destination.citySlug) {
            return item.citySlug === destination.citySlug;
          }

          return Boolean(item.city && destination.city && item.city.toLowerCase() === destination.city.toLowerCase());
        })
        .map((item) => [item.id, item]),
    ).values(),
  );
  const attractionIdeas = attractions;
  const destinationGuideIds = new Set(destinationGuides.map((guide) => guide.id));
  const cityGuideCards = cityGuides.filter((guide) => !destinationGuideIds.has(guide.id)).slice(0, 6);
  const countryHref = city.country ? countryPath(city.country) : "";
  const canonicalPath = getCanonicalDestinationPath(destination, city);
  const galleryImages = Array.from(
    new Set(
      [image, ...destination.galleryImages, ...relatedDestinations.map((item) => resolveImagePath(item.image))]
        .filter((galleryImage): galleryImage is string => Boolean(galleryImage))
        .slice(0, 4),
    ),
  );
  const overviewParagraphs = splitParagraphs(
    destination.description ||
      "Top7Spots curates every destination as a practical travel idea, with enough context to help you decide how it fits your route.",
  );
  const overviewFacts = [
    { label: "Best time", value: destination.bestSeason },
    { label: "Duration", value: destination.duration },
    { label: "Location", value: location },
    { label: "Curated pick", value: "Top7Spots" },
  ].filter((fact) => Boolean(fact.value));
  const tipItems =
    destination.travelTips.length > 0
      ? destination.travelTips
      : destination.practicalInfo.length > 0
        ? destination.practicalInfo
        : ["Save the location before you go", "Check opening hours", "Pack for the season"];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 md:pb-0">
      <BreadcrumbJsonLd
        items={[
          ...(countryHref ? [{ name: city.country, path: countryHref }] : []),
          { name: city.name, path: `/${city.slug}` },
          { name: destination.name, path: canonicalPath },
        ]}
      />
      <TouristDestinationJsonLd
        name={destination.name}
        description={
          destination.seoDescription ||
          destination.summary ||
          destination.description ||
          `Explore ${destination.name} in ${city.name} with Top7Spots.`
        }
        image={destination.image}
        path={canonicalPath}
        city={city.name}
        country={city.country}
        region={destination.region || city.region}
      />
      <FAQPageJsonLd faqs={destination.faqs} />
      <SiteHeader />
      <main>
        <section className="bg-white px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <BreadcrumbTrail
              items={[
                ...(countryHref ? [{ label: city.country, href: countryHref }] : []),
                { label: city.name, href: `/${city.slug}` },
                { label: "Destinations", href: "/destinations" },
                { label: destination.name },
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
            <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <Badge className="rounded-full bg-orange-50 px-3 py-1 text-[#FF6B00] hover:bg-orange-50">
                  {category}
                </Badge>
                <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-[#111827] md:text-6xl">
                  {destination.name}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                  {destination.summary ||
                    "A curated Top7Spots travel idea with practical planning notes and inspiration."}
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                    <MapPin className="size-4 text-[#1D4ED8]" aria-hidden="true" />
                    {location}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                    <Clock className="size-4 text-[#1D4ED8]" aria-hidden="true" />
                    {destination.duration || "Flexible"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                    <Star className="size-4 fill-[#FF6B00] text-[#FF6B00]" aria-hidden="true" />
                    Curated Top7Spots pick
                  </span>
                </div>
              </div>
              <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
                <p className="text-sm font-semibold text-[#0A2A66]">Trip snapshot</p>
                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-3">
                    <Calendar className="size-5 text-[#1D4ED8]" aria-hidden="true" />
                    Best time: {destination.bestSeason || "Year-round"}
                  </span>
                  <span className="flex items-center gap-3">
                    <Sparkles className="size-5 text-[#FF6B00]" aria-hidden="true" />
                    Curated for {city.name}
                  </span>
                  <span className="flex items-center gap-3">
                    <ShieldCheck className="size-5 text-[#1D4ED8]" aria-hidden="true" />
                    Practical tips included
                  </span>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-3 overflow-hidden rounded-3xl md:grid-cols-[1.45fr_0.8fr]">
            <div className="relative min-h-[360px] overflow-hidden bg-slate-200 md:min-h-[560px]">
              <Image
                src={image}
                alt={`${destination.name} in ${city.name}`}
                fill
                priority
                sizes="(min-width: 1024px) 65vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
              {galleryImages.map((galleryImage, index) => (
                <div key={`${galleryImage}-${index}`} className="relative min-h-44 overflow-hidden bg-slate-200">
                  <Image
                    src={galleryImage}
                    alt={`${destination.name} travel view in ${city.name} ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 35vw"
                    unoptimized
                    className="object-cover"
                  />
                  {index === 1 ? (
                    <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-[#0A2A66] shadow-sm">
                      <Camera className="size-4" aria-hidden="true" />
                      Image gallery
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <article className="space-y-8">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
                OVERVIEW
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#111827] md:text-3xl">
                Why visit {destination.name}
              </h2>
              <div className="mt-5 space-y-4 text-base leading-8 text-slate-600">
                {overviewParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {overviewFacts.length > 0 ? (
                <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                  {overviewFacts.map((fact) => (
                    <div key={fact.label} className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {fact.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#111827]">{fact.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">Highlights</h2>
              <div className="flex flex-wrap gap-2.5">
                {(destination.highlights.length > 0
                  ? destination.highlights
                  : ["Signature views", "Local character", "Flexible route planning"]
                ).map((highlight) => (
                  <div
                    key={highlight}
                    className="max-w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium leading-6 text-slate-700 shadow-sm"
                  >
                    {highlight}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="grid gap-5 md:grid-cols-[0.85fr_1.15fr]">
                <div>
                  <div className="flex items-center gap-2 text-[#1D4ED8]">
                    <Calendar className="size-5" aria-hidden="true" />
                    <h2 className="text-base font-semibold text-[#111827]">Best time to visit</h2>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {destination.bestSeason ||
                      "Check local seasons, event dates, and road conditions before you go."}
                  </p>
                </div>
                <div className="border-t border-slate-100 pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                  <h2 className="text-base font-semibold text-[#111827]">Travel tips</h2>
                  <ul className="mt-3 grid gap-2.5 text-sm leading-6 text-slate-600">
                    {tipItems.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#FF6B00]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </article>
        </section>

        <DestinationGuideSection
          title={`Travel guides for ${destination.name}`}
          guides={destinationGuides.slice(0, 6)}
        />
        <DestinationGuideSection title={`More travel guides for ${city.name}`} guides={cityGuideCards} />
        <FaqSection title={`FAQs about ${destination.name}`} faqs={destination.faqs} />

        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Nearby ideas" title="Attractions to add around this route">
            Complement the destination with nearby landmarks, viewpoints, and cultural stops.
          </SectionHeading>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {attractionIdeas.map((attraction) => (
              <AttractionCard key={attraction.id} attraction={attraction} />
            ))}
          </div>
        </section>

        <DestinationCarouselSection
          title={`Keep exploring ${city.name}`}
          description="More compact destination ideas from this city library."
          destinations={relatedDestinations}
        />
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur md:hidden">
        <Link
          href={`/${city.slug}`}
          className="flex items-center justify-center gap-2 rounded-full bg-[#0A2A66] px-5 py-3 text-sm font-semibold text-white"
        >
          Explore more in {city.name}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}

function splitParagraphs(text: string) {
  return text
    .split(/\r?\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
