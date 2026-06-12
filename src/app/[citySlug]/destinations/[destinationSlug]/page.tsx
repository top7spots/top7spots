import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { BreadcrumbTrail } from "@/components/breadcrumb-trail";
import { VehicleCategoryCardsBlock } from "@/components/car-rental/vehicle-category-cards-block";
import { DestinationArticleContent } from "@/components/destination-article-content";
import { DestinationAuthorSection, selectDestinationAuthor } from "@/components/destination-author-section";
import { DestinationDetailHero } from "@/components/destination-detail-hero";
import { DestinationGuideSection } from "@/components/destination-guide-section";
import { DestinationCarouselSection } from "@/components/destination-carousel-section";
import { ArticleJsonLd, BreadcrumbJsonLd, FAQPageJsonLd, TouristDestinationJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { getCanonicalDestinationPath } from "@/lib/city-intelligence";
import { countryPath } from "@/lib/country-hubs";
import { formatDisplayDate } from "@/lib/date-format";
import {
  getActiveAuthors,
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
  const [city, destination, destinations, cityGuides, destinationGuides, authors] = await Promise.all([
    getCityBySlug(citySlug),
    getDestinationByCityAndSlug(citySlug, destinationSlug),
    getDestinationsByCity(citySlug),
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
  const destinationGuideIds = new Set(destinationGuides.map((guide) => guide.id));
  const cityGuideCards = cityGuides.filter((guide) => !destinationGuideIds.has(guide.id)).slice(0, 6);
  const countryHref = city.country ? countryPath(city.country) : "";
  const canonicalPath = getCanonicalDestinationPath(destination, city);
  const author = selectDestinationAuthor(authors);
  const publishedDate = formatDisplayDate(destination.createdAt);
  const updatedDate = formatDisplayDate(destination.updatedAt || destination.createdAt);
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

        <DestinationArticleContent
          bestSeason={destination.bestSeason}
          description={destination.description}
          destinationName={destination.name}
          faqs={destination.faqs}
          highlights={destination.highlights}
          howToGo={destination.howToGo}
          practicalInfo={destination.practicalInfo}
          travelTips={destination.travelTips}
        />

        <VehicleCategoryCardsBlock
          title="Need a Car for This Trip?"
          subtitle="Compare rental cars and choose a vehicle that fits your route, luggage, and travel style."
          label="CAR RENTAL"
          variant="full"
        />

        <DestinationGuideSection
          title={`Travel guides for ${destination.name}`}
          guides={destinationGuides.slice(0, 6)}
        />
        <DestinationGuideSection title={`More travel guides for ${city.name}`} guides={cityGuideCards} />
        <DestinationAuthorSection author={author} />

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
