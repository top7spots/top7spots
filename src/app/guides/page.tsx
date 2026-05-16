import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Compass, Search } from "lucide-react";
import { GuideCard } from "@/components/guide-card";
import { SectionHeading } from "@/components/section-heading";
import { BreadcrumbJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import { getGuides } from "@/lib/data";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = seoMetadata({
  title: "Travel Guides and Inspiration | Top7Spots",
  description:
    "Read practical travel guides, road trip ideas, seasonal tips, and curated destination inspiration from Top7Spots.",
  path: "/guides",
  type: "article",
});

export default async function GuidesPage() {
  const guides = await getGuides();

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
      </main>
      <SiteFooter />
    </div>
  );
}
