import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideDetailArticle } from "@/components/guide-detail-article";
import {
  getCityBySlug,
  getDestinationsByCity,
  getActiveAuthors,
  getGuideByCityAndSlug,
  getPublishedAttractions,
  getPublishedCities,
  getPublishedDestinations,
  getPublishedGuides,
  getPublishedRestaurants,
} from "@/lib/data";
import { getGuideCanonicalPath } from "@/lib/guide-routes";
import { guideImageAlt } from "@/lib/image-seo";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GuideDetailPageProps = {
  params: Promise<{ citySlug: string; guideSlug: string }>;
};

export async function generateMetadata({ params }: GuideDetailPageProps): Promise<Metadata> {
  const { citySlug, guideSlug } = await params;
  const [city, guide] = await Promise.all([
    getCityBySlug(citySlug),
    getGuideByCityAndSlug(citySlug, guideSlug),
  ]);

  if (!city || !guide) {
    return {};
  }

  return seoMetadata({
    title: guide.seoTitle || guide.title,
    description:
      guide.seoDescription ||
      guide.excerpt ||
      `A practical ${city.name} travel guide from Top7Spots.`,
    path: getGuideCanonicalPath(guide),
    image: guide.coverImage || guide.image,
    imageAlt: guideImageAlt(guide),
    keywords: guide.seoKeywords,
    type: "article",
  });
}

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { citySlug, guideSlug } = await params;
  const [city, guide, guides, destinations, allDestinations, attractions, cities, restaurants, authors] = await Promise.all([
    getCityBySlug(citySlug),
    getGuideByCityAndSlug(citySlug, guideSlug),
    getPublishedGuides(),
    getDestinationsByCity(citySlug),
    getPublishedDestinations(),
    getPublishedAttractions(),
    getPublishedCities(),
    getPublishedRestaurants(),
    getActiveAuthors(),
  ]);

  if (!city || !guide) {
    notFound();
  }

  return (
    <GuideDetailArticle
      guide={guide}
      author={authors.find((item) => item.id === guide.authorId)}
      city={city}
      canonicalPath={getGuideCanonicalPath(guide)}
      includeCityInBreadcrumbJson
      breadcrumbItems={[
        { label: city.name, href: `/${city.slug}` },
        { label: "Guides", href: "/guides" },
        { label: guide.title },
      ]}
      backHref={`/${city.slug}`}
      backLabel={`Back to ${city.name}`}
      guides={guides}
      cities={cities}
      destinations={destinations}
      listingDestinations={allDestinations}
      restaurants={restaurants}
      attractions={attractions.filter((attraction) => attraction.citySlug === city.slug)}
      descriptionFallback={`A practical ${city.name} travel guide from Top7Spots.`}
    />
  );
}
