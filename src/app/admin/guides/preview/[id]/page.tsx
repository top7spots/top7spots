import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideDetailArticle } from "@/components/guide-detail-article";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getAttractions,
  getAuthors,
  getCities,
  getDestinations,
  getGuides,
  getRestaurants,
} from "@/lib/data";
import { getGuideCanonicalPath } from "@/lib/guide-routes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Guide Preview | Top7Spots Admin",
  robots: {
    index: false,
    follow: false,
  },
};

type GuidePreviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GuidePreviewPage({ params }: GuidePreviewPageProps) {
  await requireAdmin();

  const { id } = await params;
  const [guides, cities, destinations, attractions, restaurants, authors] = await Promise.all([
    getGuides(),
    getCities(),
    getDestinations(),
    getAttractions(),
    getRestaurants(),
    getAuthors(),
  ]);
  const guide = guides.find((item) => item.id === id);

  if (!guide) {
    notFound();
  }

  const parentCity = guide.citySlug ? cities.find((city) => city.slug === guide.citySlug) : undefined;

  return (
    <GuideDetailArticle
      guide={guide}
      author={authors.find((item) => item.id === guide.authorId)}
      city={parentCity}
      canonicalPath={getGuideCanonicalPath(guide)}
      includeCityInBreadcrumbJson={guide.targetType === "city"}
      breadcrumbItems={[
        { label: "Admin", href: "/admin/dashboard" },
        { label: "Travel Guides", href: "/admin/dashboard?section=guides" },
        { label: `Preview: ${guide.title}` },
      ]}
      backHref={`/admin/dashboard?section=guides&mode=edit&id=${encodeURIComponent(guide.id)}`}
      backLabel="Back to editor"
      guides={guides}
      cities={cities}
      destinations={guide.citySlug ? destinations.filter((destination) => destination.citySlug === guide.citySlug) : destinations}
      listingDestinations={destinations}
      restaurants={restaurants}
      attractions={guide.citySlug ? attractions.filter((attraction) => attraction.citySlug === guide.citySlug) : attractions}
      descriptionFallback="Admin-only guide preview from Top7Spots."
    />
  );
}
