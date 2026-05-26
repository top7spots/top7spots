import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideDetailArticle } from "@/components/guide-detail-article";
import {
  getDestinations,
  getGuide,
  getPublishedAttractions,
  getPublishedCities,
  getPublishedGuides,
  getPublishedRestaurants,
} from "@/lib/data";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GuideDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: GuideDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);

  if (!guide) {
    return {};
  }

  return seoMetadata({
    title: guide.seoTitle || guide.title,
    description: guide.seoDescription || guide.excerpt || "A practical travel guide from Top7Spots.",
    path: guideCanonicalPath(guide),
    image: guide.coverImage || guide.image,
    keywords: guide.seoKeywords,
    type: "article",
  });
}

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { slug } = await params;
  const [guide, destinations, attractions, cities, guides, restaurants] = await Promise.all([
    getGuide(slug),
    getDestinations(),
    getPublishedAttractions(),
    getPublishedCities(),
    getPublishedGuides(),
    getPublishedRestaurants(),
  ]);

  if (!guide) {
    notFound();
  }

  const canonicalPath = guideCanonicalPath(guide);
  const parentCity =
    guide.targetType === "city" && guide.citySlug
      ? cities.find((city) => city.slug === guide.citySlug)
      : undefined;

  return (
    <GuideDetailArticle
      guide={guide}
      city={parentCity}
      canonicalPath={canonicalPath}
      breadcrumbItems={[
        { label: "Guides", href: "/guides" },
        { label: guide.title },
      ]}
      backHref="/guides"
      backLabel="Back to guides"
      guides={guides}
      cities={cities}
      destinations={destinations.filter((destination) => !guide.citySlug || destination.citySlug === guide.citySlug)}
      restaurants={restaurants}
      attractions={attractions.filter((attraction) => !guide.citySlug || attraction.citySlug === guide.citySlug)}
      descriptionFallback="A practical travel guide from Top7Spots."
    />
  );
}

function guideCanonicalPath(guide: { targetType: string; citySlug?: string; slug: string }) {
  return guide.targetType === "city" && guide.citySlug
    ? `/${guide.citySlug}/guides/${guide.slug}`
    : `/guides/${guide.slug}`;
}
