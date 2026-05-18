import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideDetailArticle } from "@/components/guide-detail-article";
import {
  getCityBySlug,
  getDestinationsByCity,
  getGuideByCityAndSlug,
  getPublishedAttractions,
  getPublishedGuides,
} from "@/lib/data";
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
    path: `/${city.slug}/guides/${guide.slug}`,
    image: guide.coverImage || guide.image,
    keywords: guide.seoKeywords,
    type: "article",
  });
}

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { citySlug, guideSlug } = await params;
  const [city, guide, guides, destinations, attractions] = await Promise.all([
    getCityBySlug(citySlug),
    getGuideByCityAndSlug(citySlug, guideSlug),
    getPublishedGuides(),
    getDestinationsByCity(citySlug),
    getPublishedAttractions(),
  ]);

  if (!city || !guide) {
    notFound();
  }

  return (
    <GuideDetailArticle
      guide={guide}
      city={city}
      canonicalPath={`/${city.slug}/guides/${guide.slug}`}
      includeCityInBreadcrumbJson
      breadcrumbItems={[
        { label: city.name, href: `/${city.slug}` },
        { label: "Guides", href: "/guides" },
        { label: guide.title },
      ]}
      backHref={`/${city.slug}`}
      backLabel={`Back to ${city.name}`}
      guides={guides}
      destinations={destinations}
      attractions={attractions.filter((attraction) => attraction.citySlug === city.slug)}
      descriptionFallback={`A practical ${city.name} travel guide from Top7Spots.`}
    />
  );
}
