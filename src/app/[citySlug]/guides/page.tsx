import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { BreadcrumbTrail } from "@/components/breadcrumb-trail";
import { GuideCard } from "@/components/guide-card";
import { SectionHeading } from "@/components/section-heading";
import { BreadcrumbJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCityBySlug, getGuidesByCity } from "@/lib/data";
import { getGuideHref } from "@/lib/guide-routes";
import { seoMetadata } from "@/lib/seo";
import type { Guide } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CityGuidesPageProps = {
  params: Promise<{ citySlug: string }>;
};

export async function generateMetadata({ params }: CityGuidesPageProps): Promise<Metadata> {
  const { citySlug } = await params;
  const city = await getCityBySlug(citySlug);

  if (!city || city.status !== "published") {
    return {};
  }

  return seoMetadata({
    title: `${city.name} Travel Guides | Top7Spots`,
    description: `Practical guides for planning your trip to ${city.name}, including transport, airport tips, attractions, and local advice.`,
    path: `/${city.slug}/guides`,
    image: city.featuredImage || city.heroImage || city.cardImage,
    type: "article",
  });
}

export default async function CityGuidesPage({ params }: CityGuidesPageProps) {
  const { citySlug } = await params;
  const [city, guides] = await Promise.all([getCityBySlug(citySlug), getGuidesByCity(citySlug)]);

  if (!city || city.status !== "published") {
    notFound();
  }

  const sortedGuides = sortGuides(guides);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <BreadcrumbJsonLd
        items={[
          { name: city.name, path: `/${city.slug}` },
          { name: "Guides", path: `/${city.slug}/guides` },
        ]}
      />
      <SiteHeader />
      <main>
        <section className="bg-white px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <BreadcrumbTrail
              items={[
                { label: city.name, href: `/${city.slug}` },
                { label: "Guides" },
              ]}
            />
          </div>
        </section>

        <section className="bg-[#0A2A66] px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
              <BookOpen className="size-4" aria-hidden="true" />
              {city.name} guide hub
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
              {city.name} Travel Guides
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50 md:text-lg">
              Practical guides for planning your trip to {city.name}, including transport, airport
              tips, attractions, and local advice.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          {sortedGuides.length > 0 ? (
            <>
              <SectionHeading eyebrow="City guides" title={`Plan ${city.name} smarter`}>
                Use these guides to connect transport, attractions, timing, and local context before
                opening detailed destination pages.
              </SectionHeading>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {sortedGuides.map((guide) => (
                  <GuideCard
                    key={guide.id}
                    guide={guide}
                    cityName={city.name}
                    href={getGuideHref(guide)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <BookOpen className="mx-auto size-8 text-[#1D4ED8]" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-semibold text-[#111827]">No {city.name} guides yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Published city guides will appear here once they are available.
              </p>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function sortGuides(guides: Guide[]) {
  return [...guides].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) {
      return a.isFeatured ? -1 : 1;
    }

    const orderA = Number.isFinite(a.displayOrder) ? a.displayOrder : 999;
    const orderB = Number.isFinite(b.displayOrder) ? b.displayOrder : 999;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.title.localeCompare(b.title);
  });
}
