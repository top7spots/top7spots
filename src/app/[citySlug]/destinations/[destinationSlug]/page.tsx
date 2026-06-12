import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { AttractionCard } from "@/components/attraction-card";
import { BreadcrumbTrail } from "@/components/breadcrumb-trail";
import { DestinationAuthorSection, selectDestinationAuthor } from "@/components/destination-author-section";
import { DestinationDetailHero } from "@/components/destination-detail-hero";
import { DestinationGuideSection } from "@/components/destination-guide-section";
import { DestinationCarouselSection } from "@/components/destination-carousel-section";
import { DestinationTravelInfoSections } from "@/components/destination-travel-info-sections";
import { FaqSection } from "@/components/faq-section";
import { SectionHeading } from "@/components/section-heading";
import { ArticleJsonLd, BreadcrumbJsonLd, FAQPageJsonLd, TouristDestinationJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { getCanonicalDestinationPath } from "@/lib/city-intelligence";
import { countryPath } from "@/lib/country-hubs";
import { formatDisplayDate } from "@/lib/date-format";
import {
  getActiveAuthors,
  getAttractionsByCity,
  getCityBySlug,
  getDestinationByCityAndSlug,
  getDestinationsByCity,
  getGuidesByCity,
  getGuidesForDestination,
} from "@/lib/data";
import { getDestinationGalleryImages } from "@/lib/images";
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
  const [city, destination, destinations, attractions, cityGuides, destinationGuides, authors] = await Promise.all([
    getCityBySlug(citySlug),
    getDestinationByCityAndSlug(citySlug, destinationSlug),
    getDestinationsByCity(citySlug),
    getAttractionsByCity(citySlug),
    getGuidesByCity(citySlug),
    getGuidesForDestination(destinationSlug),
    getActiveAuthors(),
  ]);

  if (!city || !destination) {
    notFound();
  }

  const galleryImages = getDestinationGalleryImages(destination.image, destination.galleryImages);
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
  const author = selectDestinationAuthor(authors);
  const publishedDate = formatDisplayDate(destination.createdAt);
  const updatedDate = formatDisplayDate(destination.updatedAt || destination.createdAt);
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
      <ArticleJsonLd
        title={`${destination.name} travel guide`}
        description={
          destination.seoDescription ||
          destination.summary ||
          destination.description ||
          `Explore ${destination.name} in ${city.name} with Top7Spots.`
        }
        image={destination.image}
        path={canonicalPath}
        author={author?.name || "Safir Thorappa"}
        datePublished={destination.createdAt || undefined}
        dateModified={destination.updatedAt || destination.createdAt || undefined}
        section={destination.category || "Destination"}
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
            <DestinationDetailHero
              bestSeason={destination.bestSeason || "Year-round"}
              category={category}
              destinationName={destination.name}
              duration={destination.duration || "Flexible"}
              images={galleryImages}
              location={location}
              publishedDate={publishedDate}
              snapshotLabel={`Curated for ${city.name}`}
              summary={
                destination.summary ||
                "A curated Top7Spots travel idea with practical planning notes and inspiration."
              }
              updatedDate={updatedDate}
            />
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

            <DestinationTravelInfoSections
              bestSeason={destination.bestSeason}
              howToGo={destination.howToGo}
              practicalInfo={destination.practicalInfo}
              travelTips={destination.travelTips}
            />
          </article>
        </section>

        <DestinationGuideSection
          title={`Travel guides for ${destination.name}`}
          guides={destinationGuides.slice(0, 6)}
        />
        <DestinationGuideSection title={`More travel guides for ${city.name}`} guides={cityGuideCards} />
        <FaqSection title={`FAQs about ${destination.name}`} faqs={destination.faqs} />
        <DestinationAuthorSection author={author} />

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
