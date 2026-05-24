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
import { DestinationCard } from "@/components/destination-card";
import { SectionHeading } from "@/components/section-heading";
import { BreadcrumbJsonLd, TouristDestinationJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getCanonicalDestinationPath } from "@/lib/city-intelligence";
import { countryPath } from "@/lib/country-hubs";
import { getAttractions, getDestination, getDestinations, getGuides, getPublishedCities } from "@/lib/data";
import { resolveImagePath } from "@/lib/images";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DestinationDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: DestinationDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getDestination(slug);

  if (!destination) {
    return {};
  }

  return seoMetadata({
    title: destination.seoTitle || `${destination.name} | Top7Spots`,
    description:
      destination.seoDescription ||
      destination.summary ||
      `Explore ${destination.name} with Top7Spots destination tips, highlights, and nearby ideas.`,
    path: getCanonicalDestinationPath(destination),
    image: destination.image,
  });
}

export default async function DestinationDetailPage({ params }: DestinationDetailPageProps) {
  const { slug } = await params;
  const [destination, destinations, attractions, guides, cities] = await Promise.all([
    getDestination(slug),
    getDestinations(),
    getAttractions(),
    getGuides(),
    getPublishedCities(),
  ]);

  if (!destination) {
    notFound();
  }

  const image = resolveImagePath(destination.image);
  const category = destination.category || "Travel spot";
  const location = [destination.city, destination.region].filter(Boolean).join(", ") || "Global";
  const parentCity = destination.citySlug
    ? cities.find((city) => city.slug === destination.citySlug)
    : undefined;
  const canonicalPath = getCanonicalDestinationPath(destination, parentCity);
  const countryHref = parentCity?.country ? countryPath(parentCity.country) : "";
  const relatedDestinations = destinations.filter((item) => item.id !== destination.id);
  const relatedGuides = guides
    .filter((guide) => destination.citySlug && guide.citySlug === destination.citySlug)
    .slice(0, 4);
  const nearbyAttractions =
    attractions.filter(
      (attraction) =>
        attraction.city &&
        destination.city &&
        attraction.city.toLowerCase() === destination.city.toLowerCase(),
    ) || [];
  const attractionIdeas = nearbyAttractions.length > 0 ? nearbyAttractions : attractions;
  const secondaryGalleryImage = relatedDestinations.find((item) => item.image)?.image;
  const tertiaryGalleryImage = attractionIdeas.find((item) => item.image)?.image;
  const galleryImages = Array.from(
    new Set(
      [secondaryGalleryImage, tertiaryGalleryImage, image].filter(
        (galleryImage): galleryImage is string => Boolean(galleryImage),
      ),
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
          { name: "Destinations", path: "/destinations" },
          ...(countryHref && parentCity ? [{ name: parentCity.country, path: countryHref }] : []),
          {
            name: destination.name,
            path: canonicalPath,
          },
        ]}
      />
      <TouristDestinationJsonLd
        name={destination.name}
        description={
          destination.seoDescription ||
          destination.summary ||
          destination.description ||
          `Explore ${destination.name} with Top7Spots destination tips, highlights, and nearby ideas.`
        }
        image={destination.image}
        path={canonicalPath}
        city={destination.city}
        country={parentCity?.country}
        region={destination.region}
      />
      <SiteHeader />
      <main>
        <section className="bg-white px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <BreadcrumbTrail
              items={[
                { label: "Destinations", href: "/destinations" },
                ...(countryHref && parentCity ? [{ label: parentCity.country, href: countryHref }] : []),
                ...(destination.citySlug && destination.city
                  ? [{ label: destination.city, href: `/${destination.citySlug}` }]
                  : []),
                { label: destination.name },
              ]}
            />
            <Link
              href="/destinations"
              className={buttonVariants({
                variant: "ghost",
                className: "mb-5 rounded-full px-0 text-slate-600 hover:bg-transparent",
              })}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to destinations
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
                    Curated for discovery
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
                alt={`${destination.name}${destination.city ? ` in ${destination.city}` : ""}`}
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
                    alt={`${destination.name} travel view ${index + 1}`}
                    fill
                    sizes="(min-width: 1024px) 35vw, 50vw"
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

        {relatedGuides.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Relevant guides" title="Travel guides for this city">
              Use guide pages to connect this destination with broader trip planning context.
            </SectionHeading>
            <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
              {relatedGuides.map((guide) => (
                <Link
                  key={guide.id}
                  href={guide.citySlug ? `/${guide.citySlug}/guides/${guide.slug}` : `/guides/${guide.slug}`}
                  className="text-sm font-semibold text-[#0A2A66] transition hover:text-[#1D4ED8]"
                >
                  {guide.title}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

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

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Related destinations" title="Keep exploring Top7Spots">
            More curated places from the destination library.
          </SectionHeading>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {relatedDestinations.map((item) => (
              <DestinationCard key={item.id} destination={item} />
            ))}
          </div>
        </section>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur md:hidden">
        <Link
          href="/destinations"
          className="flex items-center justify-center gap-2 rounded-full bg-[#0A2A66] px-5 py-3 text-sm font-semibold text-white"
        >
          Explore more spots
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
