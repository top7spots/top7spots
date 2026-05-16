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
  Map,
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
import { getAttractions, getDestination, getDestinations, getGuides } from "@/lib/data";
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
    path: destination.citySlug
      ? `/${destination.citySlug}/destinations/${destination.slug}`
      : `/destinations/${destination.slug}`,
    image: destination.image,
  });
}

export default async function DestinationDetailPage({ params }: DestinationDetailPageProps) {
  const { slug } = await params;
  const [destination, destinations, attractions, guides] = await Promise.all([
    getDestination(slug),
    getDestinations(),
    getAttractions(),
    getGuides(),
  ]);

  if (!destination) {
    notFound();
  }

  const image = resolveImagePath(destination.image);
  const category = destination.category || "Travel spot";
  const location = [destination.city, destination.region].filter(Boolean).join(", ") || "Global";
  const canonicalPath = destination.citySlug
    ? `/${destination.citySlug}/destinations/${destination.slug}`
    : `/destinations/${destination.slug}`;
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 md:pb-0">
      <BreadcrumbJsonLd
        items={[
          { name: "Destinations", path: "/destinations" },
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
        region={destination.region}
      />
      <SiteHeader />
      <main>
        <section className="bg-white px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <BreadcrumbTrail
              items={[
                { label: "Destinations", href: "/destinations" },
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

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
          <article className="space-y-12">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
                Overview
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827]">
                Why visit {destination.name}
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-600 md:text-lg">
                {destination.description ||
                  "Top7Spots curates every destination as a practical travel idea, with enough context to help you decide how it fits your route."}
              </p>
            </section>

            {destination.howToGo ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
                  How to plan this stop
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827]">
                  Getting there and fitting it into your route
                </h2>
                <p className="mt-5 text-base leading-8 text-slate-600 md:text-lg">
                  {destination.howToGo}
                </p>
              </section>
            ) : null}

            <section>
              <h2 className="text-3xl font-semibold tracking-tight text-[#111827]">Highlights</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(destination.highlights.length > 0
                  ? destination.highlights
                  : ["Signature views", "Local character", "Flexible route planning"]
                ).map((highlight) => (
                  <div
                    key={highlight}
                    className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium leading-6 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {highlight}
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl bg-[#0A2A66] p-6 text-white shadow-xl shadow-blue-950/15">
                <Calendar className="size-8 text-orange-300" aria-hidden="true" />
                <h2 className="mt-5 text-2xl font-semibold">Best time to visit</h2>
                <p className="mt-3 text-sm leading-7 text-blue-50">
                  {destination.bestSeason ||
                    "Check local seasons, event dates, and road conditions before you go."}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold text-[#111827]">Travel tips</h2>
                <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
                  {(destination.practicalInfo.length > 0
                    ? destination.practicalInfo
                    : ["Save the location before you go", "Check opening hours", "Pack for the season"]
                  ).map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#FF6B00]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-blue-50 p-3 text-[#1D4ED8]">
                  <Map className="size-6" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-[#111827]">Route planning note</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Use this destination with related city content to compare nearby attractions,
                    destination ideas, and any available travel tips before finalizing your route.
                    Location cue: {location}.
                  </p>
                </div>
              </div>
            </section>
          </article>

          <aside className="h-fit space-y-4 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
              <p className="text-sm font-semibold text-[#0A2A66]">Plan this idea</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Save this as inspiration for a future itinerary. Top7Spots does not take bookings,
                payments, or carts.
              </p>
              {destination.citySlug && destination.city ? (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Parent city
                  </p>
                  <Link
                    href={`/${destination.citySlug}`}
                    className="mt-2 block text-sm font-semibold text-[#0A2A66] transition hover:text-[#1D4ED8]"
                  >
                    Explore {destination.city}
                  </Link>
                </div>
              ) : null}
              <Link
                href="/destinations"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Explore more spots
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </aside>
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
