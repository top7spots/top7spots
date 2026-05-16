import type { Metadata } from "next";
import { Search, SlidersHorizontal } from "lucide-react";
import { DestinationCard } from "@/components/destination-card";
import { SectionHeading } from "@/components/section-heading";
import { BreadcrumbJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDestinations } from "@/lib/data";
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
  const [{ city }, destinations] = await Promise.all([searchParams, getDestinations()]);
  const filtered = city
    ? destinations.filter((destination) => destination.city.toLowerCase() === city.toLowerCase())
    : destinations;

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
                  Curated places for your next top seven.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                  Explore beaches, mountains, cities, heritage landmarks, and hidden gems from the
                  Top7Spots travel library.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search UI coming soon"
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
      </main>
      <SiteFooter />
    </div>
  );
}
