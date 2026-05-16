import type { Metadata } from "next";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { DestinationCard } from "@/components/destination-card";
import { SectionHeading } from "@/components/section-heading";
import { BreadcrumbJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDestinations, getPublishedCities } from "@/lib/data";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = seoMetadata({
  title: "Destinations and Hidden Gems | Top7Spots",
  description:
    "Explore curated destinations, hidden gems, beaches, mountains, city spots, and travel ideas from Top7Spots.",
  path: "/destinations",
});

const filters = [
  "Beaches",
  "Mountains",
  "Desert",
  "Family",
  "Adventure",
  "Luxury",
  "Hidden Gems",
  "Road Trips",
  "Historical",
  "Nature",
];

type DestinationsPageProps = {
  searchParams: Promise<{ city?: string }>;
};

export default async function DestinationsPage({ searchParams }: DestinationsPageProps) {
  const [{ city }, destinations, cities] = await Promise.all([
    searchParams,
    getDestinations(),
    getPublishedCities(),
  ]);
  const filtered = city
    ? destinations.filter((destination) => destination.city.toLowerCase() === city.toLowerCase())
    : destinations;
  const featuredDestinations = filtered.slice(0, 8);
  const cityDestinationSections = cities
    .map((item) => ({
      city: item,
      destinations: destinations.filter((destination) => destination.citySlug === item.slug).slice(0, 4),
    }))
    .filter((section) => section.destinations.length > 0)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <BreadcrumbJsonLd items={[{ name: "Destinations", path: "/destinations" }]} />
      <SiteHeader />
      <main>
        <section className="border-b border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
                  Destinations
                </p>
                <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[#111827] md:text-6xl">
                  Best destinations, hidden gems, and travel ideas
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                  Explore curated places to visit across city guides, scenic routes, beaches,
                  mountains, heritage landmarks, and hidden gems. Each destination page is built to
                  help you understand why a place belongs on your route, when it may fit your trip,
                  and what nearby ideas are worth comparing.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search destinations"
                    className="h-12 rounded-full border-slate-200 bg-white pl-11 shadow-sm"
                  />
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  <Button variant="outline" size="sm" className="shrink-0 rounded-full">
                    <SlidersHorizontal className="size-4" aria-hidden="true" />
                    Filters
                  </Button>
                  {filters.map((filter) => (
                    <Button
                      key={filter}
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-full border-slate-200 bg-white"
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-10 grid gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">
                Explore destinations by city
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Start with a city to see local destination ideas in context. City hubs connect the
                best places to visit with nearby attractions and travel guides, making it easier to
                compare coastal stops, mountain viewpoints, cultural landmarks, and day trip routes.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {cities.slice(0, 10).map((item) => (
                  <Link
                    key={item.id}
                    href={`/${item.slug}`}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#2563EB] hover:bg-blue-50 hover:text-[#0A2A66]"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">
                Popular destination pages
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Use destination detail pages for concise summaries, highlights, practical notes,
                best-season guidance when available, and links back to related city content.
              </p>
              <div className="mt-4 grid gap-2">
                {featuredDestinations.slice(0, 5).map((destination) => (
                  <Link
                    key={destination.id}
                    href={`/${destination.citySlug}/destinations/${destination.slug}`}
                    className="text-sm font-semibold text-[#0A2A66] transition hover:text-[#1D4ED8]"
                  >
                    {destination.name} in {destination.city}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <SectionHeading
            eyebrow={city ? `City: ${city}` : "All travel ideas"}
            title={city ? `Places near ${city}` : "Top destinations and hidden gems"}
          >
            {filtered.length} destination{filtered.length === 1 ? "" : "s"} available. New admin
            entries appear here automatically.
          </SectionHeading>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {filtered.map((destination) => (
              <DestinationCard key={destination.id} destination={destination} />
            ))}
          </div>
        </section>

        {cityDestinationSections.length > 0 ? (
          <section className="border-t border-slate-200 bg-white py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeading eyebrow="Destination hubs" title="Browse destinations by city">
                City-based destination hubs help search engines and travelers understand how each
                place connects to nearby travel ideas, local guides, and parent city pages.
              </SectionHeading>
              <div className="grid gap-5 lg:grid-cols-2">
                {cityDestinationSections.map((section) => (
                  <div key={section.city.id} className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">
                          {section.city.name} destinations
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Explore curated places to visit in {section.city.name}, with links into
                          detailed destination pages and the full city hub.
                        </p>
                      </div>
                      <Link
                        href={`/${section.city.slug}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#0A2A66] transition hover:bg-blue-50"
                      >
                        City hub
                      </Link>
                    </div>
                    <div className="mt-5 grid gap-2">
                      {section.destinations.map((destination) => (
                        <Link
                          key={destination.id}
                          href={`/${destination.citySlug}/destinations/${destination.slug}`}
                          className="text-sm font-semibold text-[#0A2A66] transition hover:text-[#1D4ED8]"
                        >
                          {destination.name}
                          {destination.category ? ` - ${destination.category}` : ""}
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
