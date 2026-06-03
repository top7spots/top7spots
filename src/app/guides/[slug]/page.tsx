import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { GuideDetailArticle } from "@/components/guide-detail-article";
import {
  getDestinations,
  getPublishedAttractions,
  getPublishedCities,
  getPublishedGuides,
  getPublishedGuidesBySlug,
  getPublishedRestaurants,
} from "@/lib/data";
import { getGuideCanonicalPath, getGuideHref, isCityGuide } from "@/lib/guide-routes";
import { seoMetadata } from "@/lib/seo";
import type { Guide } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GuideDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: GuideDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolvedGuide = resolveGenericGuide(await getPublishedGuidesBySlug(slug));
  const guide = resolvedGuide?.guide;

  if (!guide) {
    return {};
  }

  return seoMetadata({
    title: guide.seoTitle || guide.title,
    description: guide.seoDescription || guide.excerpt || "A practical travel guide from Top7Spots.",
    path: getGuideCanonicalPath(guide),
    image: guide.coverImage || guide.image,
    keywords: guide.seoKeywords,
    type: "article",
  });
}

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { slug } = await params;
  const [guideMatches, destinations, attractions, cities, guides, restaurants] = await Promise.all([
    getPublishedGuidesBySlug(slug),
    getDestinations(),
    getPublishedAttractions(),
    getPublishedCities(),
    getPublishedGuides(),
    getPublishedRestaurants(),
  ]);
  const resolvedGuide = resolveGenericGuide(guideMatches);

  if (!resolvedGuide) {
    notFound();
  }

  const { guide, redirectPath } = resolvedGuide;

  if (redirectPath) {
    redirect(redirectPath);
  }

  const canonicalPath = getGuideCanonicalPath(guide);
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

function resolveGenericGuide(guides: Guide[]) {
  const genericGuides = guides.filter((guide) => !isCityGuide(guide));

  if (genericGuides.length === 1) {
    return { guide: genericGuides[0], redirectPath: "" };
  }

  if (genericGuides.length > 1) {
    return undefined;
  }

  if (guides.length === 1) {
    const [guide] = guides;
    const canonicalPath = getGuideHref(guide);
    return {
      guide,
      redirectPath: canonicalPath.startsWith("/guides/") ? "" : canonicalPath,
    };
  }

  return undefined;
}
