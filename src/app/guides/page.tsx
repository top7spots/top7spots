import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Compass } from "lucide-react";
import { BreadcrumbTrail } from "@/components/breadcrumb-trail";
import { GuideCard } from "@/components/guide-card";
import { SectionHeading } from "@/components/section-heading";
import { BreadcrumbJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublishedCities, getPublishedGuides } from "@/lib/data";
import { seoMetadata } from "@/lib/seo";
import type { City, Guide } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = seoMetadata({
  title: "Travel Guides | Top7Spots",
  description:
    "Practical travel guides, destination tips, car rental advice, airport guides, and local travel planning from Top7Spots.",
  path: "/guides",
  type: "article",
});

export default async function GuidesPage() {
  const [guides, cities] = await Promise.all([getPublishedGuides(), getPublishedCities()]);
  const sortedGuides = sortGuides(guides);
  const cityBySlug = new Map(cities.map((city) => [city.slug, city]));
  const featuredGuides = sortedGuides.filter((guide) => guide.isFeatured).slice(0, 4);
  const guideCategories = Array.from(
    sortedGuides.reduce((groups, guide) => {
      if (!guide.category) {
        return groups;
      }

      const current = groups.get(guide.category) || [];
      groups.set(guide.category, [...current, guide]);
      return groups;
    }, new Map<string, Guide[]>()),
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <BreadcrumbJsonLd items={[{ name: "Guides", path: "/guides" }]} />
      <SiteHeader />
      <main>
        <section className="bg-white px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <BreadcrumbTrail items={[{ label: "Guides" }]} />
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#0A2A66] px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                <Compass className="size-4" aria-hidden="true" />
                Top7Spots guide library
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
                Travel Guides
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50 md:text-lg">
                Practical travel guides, destination tips, car rental advice, airport guides, and
                local travel planning from Top7Spots.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur">
              <BookOpen className="size-8 text-orange-300" aria-hidden="true" />
              <p className="mt-4 text-3xl font-semibold">{sortedGuides.length}</p>
              <p className="mt-1 text-sm leading-6 text-blue-50">
                published guide{sortedGuides.length === 1 ? "" : "s"} for destination planning.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          {sortedGuides.length > 0 ? (
            <>
              {featuredGuides.length > 0 ? (
                <div className="mb-14">
                  <SectionHeading eyebrow="Featured guides" title="Start with these travel guides">
                    High-priority planning guides selected from the Top7Spots library.
                  </SectionHeading>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {featuredGuides.map((guide) => (
                      <GuideCard
                        key={guide.id}
                        guide={guide}
                        href={`/guides/${guide.slug}`}
                        cityName={cityLabel(cityBySlug, guide)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <SectionHeading eyebrow="All guides" title="Browse practical travel guides">
                Read useful planning guides, then jump into city pages and destination ideas when
                your route starts taking shape.
              </SectionHeading>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {sortedGuides.map((guide) => (
                  <GuideCard
                    key={guide.id}
                    guide={guide}
                    href={`/guides/${guide.slug}`}
                    cityName={cityLabel(cityBySlug, guide)}
                  />
                ))}
              </div>
            </>
          ) : (
            <EmptyGuides />
          )}
        </section>

        {guideCategories.length > 0 ? (
          <section className="border-t border-slate-200 bg-white py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeading eyebrow="Guide categories" title="Explore guides by topic">
                Category sections help connect planning articles around shared travel intent.
              </SectionHeading>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {guideCategories.map(([category, categoryGuides]) => (
                  <div key={category} className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-6">
                    <h2 className="text-xl font-semibold tracking-tight text-[#111827]">{category}</h2>
                    <div className="mt-4 grid gap-3">
                      {categoryGuides.map((guide) => (
                        <Link
                          key={guide.id}
                          href={`/guides/${guide.slug}`}
                          className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#0A2A66] shadow-sm transition hover:text-[#1D4ED8]"
                        >
                          {guide.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
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

function cityLabel(cities: Map<string, City>, guide: Guide) {
  return guide.citySlug ? cities.get(guide.citySlug)?.name || guide.citySlug : "";
}

function EmptyGuides() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <BookOpen className="mx-auto size-8 text-[#1D4ED8]" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold text-[#111827]">No guides published yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Travel guides will appear here once they are published in the Top7Spots library.
      </p>
    </div>
  );
}
