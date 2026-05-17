import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Compass, Search } from "lucide-react";
import { GuideCard } from "@/components/guide-card";
import { SectionHeading } from "@/components/section-heading";
import { BreadcrumbJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import { getGuides, getPublishedCities } from "@/lib/data";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = seoMetadata({
  title: "Travel Guides and Inspiration | Top7Spots",
  description:
    "Read practical travel guides, road trip ideas, seasonal tips, and curated destination inspiration from Top7Spots.",
  path: "/guides",
  type: "article",
});

export default async function GuidesPage() {
  const [guides, cities] = await Promise.all([getGuides(), getPublishedCities()]);
  const guideCategories = Array.from(
    guides.reduce((groups, guide) => {
      const category = guide.category || "Travel planning";
      const current = groups.get(category) || [];
      groups.set(category, [...current, guide]);
      return groups;
    }, new Map<string, typeof guides>()),
  ).slice(0, 6);
  const guideCitySections = cities
    .map((city) => ({
      city,
      guides: guides.filter((guide) => guide.citySlug === city.slug).slice(0, 4),
    }))
    .filter((section) => section.guides.length > 0)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <BreadcrumbJsonLd items={[{ name: "Guides", path: "/guides" }]} />
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-[#0A2A66] px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                <Compass className="size-4" aria-hidden="true" />
                Travel guides
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
                Travel guides, city inspiration, and practical trip ideas
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50 md:text-lg">
                Read city guides, seasonal planning notes, road trip ideas, and destination
                inspiration designed to help you choose where to go next and how each place fits
                into a memorable route.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-blue-100" />
                <Input
                  placeholder="Search travel guides"
                  className="h-12 rounded-full border-white/20 bg-white text-slate-900 pl-11 shadow-sm"
                />
              </div>
              <div className="mt-3 flex items-center gap-2 px-2 text-sm text-blue-50">
                <BookOpen className="size-4" aria-hidden="true" />
                {guides.length} guide{guides.length === 1 ? "" : "s"} in the library
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">
                  Travel articles for smarter city discovery
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Top7Spots guides are built to support destination research without overwhelming
                  the page. As the guide library grows, this section can include first-time
                  itineraries, local etiquette notes, best-season advice, scenic drive ideas,
                  neighborhood explainers, and planning articles connected to each city page.
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">
                  Start with a guide
                </h2>
                <div className="mt-3 grid gap-2">
                  {guides.slice(0, 5).map((guide) => (
                    <Link
                      key={guide.id}
                      href={guide.citySlug ? `/${guide.citySlug}/guides/${guide.slug}` : `/guides/${guide.slug}`}
                      className="text-sm font-semibold text-[#0A2A66] transition hover:text-[#1D4ED8]"
                    >
                      {guide.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <SectionHeading eyebrow="Guide library" title="Essential travel guides">
            Read useful planning guides, then jump back into city pages and destination ideas when
            your route starts taking shape.
          </SectionHeading>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {guides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        </section>

        {(guideCategories.length > 0 || guideCitySections.length > 0) ? (
          <section className="border-t border-slate-200 bg-white py-14">
            <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
              {guideCategories.length > 0 ? (
                <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-6">
                  <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">
                    Browse guides by topic
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Category hubs help connect planning articles around shared travel intent, from
                    city guides to seasonal inspiration and route ideas.
                  </p>
                  <div className="mt-5 grid gap-4">
                    {guideCategories.map(([category, categoryGuides]) => (
                      <div key={category}>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
                          {category}
                        </h3>
                        <div className="mt-2 grid gap-2">
                          {categoryGuides.slice(0, 3).map((guide) => (
                            <Link
                              key={guide.id}
                              href={guide.citySlug ? `/${guide.citySlug}/guides/${guide.slug}` : `/guides/${guide.slug}`}
                              className="text-sm font-semibold text-[#0A2A66] transition hover:text-[#1D4ED8]"
                            >
                              {guide.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {guideCitySections.length > 0 ? (
                <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-6">
                  <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">
                    City guide hubs
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Follow city-specific guides back into their parent city pages and related
                    destinations for cleaner trip research.
                  </p>
                  <div className="mt-5 grid gap-4">
                    {guideCitySections.map((section) => (
                      <div key={section.city.id}>
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
                            {section.city.name}
                          </h3>
                          <Link href={`/${section.city.slug}`} className="text-xs font-semibold text-slate-500 transition hover:text-[#1D4ED8]">
                            City hub
                          </Link>
                        </div>
                        <div className="mt-2 grid gap-2">
                          {section.guides.map((guide) => (
                            <Link
                              key={guide.id}
                              href={`/${section.city.slug}/guides/${guide.slug}`}
                              className="text-sm font-semibold text-[#0A2A66] transition hover:text-[#1D4ED8]"
                            >
                              {guide.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
