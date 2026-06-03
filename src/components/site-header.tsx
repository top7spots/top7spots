import Link from "next/link";
import { ArrowRight, ChevronDown, Globe2, Menu } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SearchBox } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { countryPath } from "@/lib/country-hubs";
import { getCanonicalDestinationPath } from "@/lib/city-intelligence";
import { getPublishedCities, getPublishedDestinations, getPublishedGuides } from "@/lib/data";
import { getGuideHref } from "@/lib/guide-routes";
import type { City, Destination, Guide } from "@/lib/types";

export async function SiteHeader() {
  const [cities, destinations, guides] = await Promise.all([
    getPublishedCities(),
    getPublishedDestinations(),
    getPublishedGuides(),
  ]);
  const cityBySlug = new Map(cities.map((city) => [city.slug, city]));
  const cityGroups = groupCitiesByCountry(cities);
  const destinationGroups = groupDestinationsByCity(destinations, cityBySlug);
  const guideGroups = groupGuidesByCity(guides, cityBySlug);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <BrandLogo useHeaderAsset imageClassName="h-9 w-auto sm:h-10 lg:h-11" />

        <div className="hidden flex-1 justify-center px-3 md:flex lg:px-5">
          <SearchBox
            containerClassName="relative w-full max-w-xl"
            placeholder="Search cities, spots, guides..."
          />
        </div>

        <DesktopNavigation
          cityGroups={cityGroups}
          destinationGroups={destinationGroups}
          guideGroups={guideGroups}
        />

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-full border-slate-200"
            aria-label="Select language, English"
          >
            <Globe2 className="size-4" aria-hidden="true" />
            EN
          </Button>
        </div>

        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="rounded-full lg:hidden"
                aria-label="Open menu"
              />
            }
          >
            <Menu className="size-4" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="right" className="z-[70] w-80 max-w-[calc(100vw-1rem)] overflow-y-auto bg-[#0A2A66] text-white">
            <SheetHeader>
              <SheetTitle>
                <BrandLogo variant="dark" useHeaderAsset imageClassName="h-12 w-auto" />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 grid gap-2 overflow-y-auto px-3 pb-6">
              <details className="group rounded-lg">
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white">
                  Cities
                  <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="grid gap-4 px-3 pb-3 pt-1">
                  {cityGroups.slice(0, 8).map((group) => (
                    <div key={group.country}>
                      <Link href={countryPath(group.country)} className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-200">
                        {group.country}
                      </Link>
                      <div className="mt-2 grid gap-1.5">
                        {group.cities.slice(0, 5).map((city) => (
                          <Link key={city.id} href={`/${city.slug}`} className="text-sm font-medium text-white/80 transition hover:text-white">
                            {city.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
              {destinationGroups.length > 0 ? (
                <details className="group rounded-lg">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white">
                    Destinations
                    <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="grid gap-4 px-3 pb-3 pt-1">
                    <Link href="/destinations" className="text-sm font-semibold text-white transition hover:text-orange-200">
                      View all destinations
                    </Link>
                    {destinationGroups.slice(0, 8).map((group) => (
                      <div key={group.label}>
                        {group.href ? (
                          <Link href={group.href} className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-200">
                            {group.label}
                          </Link>
                        ) : (
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-200">
                            {group.label}
                          </p>
                        )}
                        <div className="mt-2 grid gap-1.5">
                          {group.destinations.slice(0, 4).map((destination) => (
                            <Link
                              key={destination.id}
                              href={getCanonicalDestinationPath(destination, cityBySlug.get(destination.citySlug))}
                              className="line-clamp-1 text-sm font-medium text-white/80 transition hover:text-white"
                            >
                              {destination.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  href="/destinations"
                  className="rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                >
                  Destinations
                </Link>
              )}
              {guideGroups.length > 0 ? (
                <details className="group rounded-lg">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white">
                    Travel Guides
                    <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="grid gap-4 px-3 pb-3 pt-1">
                    <Link href="/guides" className="text-sm font-semibold text-white transition hover:text-orange-200">
                      All travel guides
                    </Link>
                    {guideGroups.slice(0, 8).map((group) => (
                      <div key={group.city.id}>
                        <Link href={`/${group.city.slug}/guides`} className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-200">
                          {group.city.name}
                        </Link>
                        <div className="mt-2 grid gap-1.5">
                          {group.guides.slice(0, 3).map((guide) => (
                            <Link
                              key={guide.id}
                              href={getGuideHref(guide)}
                              className="line-clamp-1 text-sm font-medium text-white/80 transition hover:text-white"
                            >
                              {guide.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  href="/guides"
                  className="rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                >
                  Travel Guides
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function DesktopNavigation({
  cityGroups,
  destinationGroups,
  guideGroups,
}: {
  cityGroups: ReturnType<typeof groupCitiesByCountry>;
  destinationGroups: ReturnType<typeof groupDestinationsByCity>;
  guideGroups: ReturnType<typeof groupGuidesByCity>;
}) {
  return (
    <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
      <div className="group relative">
        <Link href="/#all-cities" className="inline-flex items-center gap-1.5 py-5 transition hover:text-[#1D4ED8]">
          Cities
          <ChevronDown className="size-3.5 transition group-hover:rotate-180" aria-hidden="true" />
        </Link>
        {cityGroups.length > 0 ? (
          <div className="invisible absolute left-1/2 top-full z-50 w-[560px] -translate-x-1/2 translate-y-2 rounded-2xl border border-slate-200 bg-white p-5 opacity-0 shadow-2xl shadow-slate-950/15 transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <div className="grid grid-cols-2 gap-4">
              {cityGroups.slice(0, 6).map((group) => (
                <div key={group.country}>
                  <Link href={countryPath(group.country)} className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
                    {group.country}
                  </Link>
                  <div className="mt-2 grid gap-1.5">
                    {group.cities.slice(0, 5).map((city) => (
                      <Link key={city.id} href={`/${city.slug}`} className="text-sm font-semibold text-[#0A2A66] transition hover:text-[#1D4ED8]">
                        {city.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <div className="group relative">
        <Link href="/destinations" className="inline-flex items-center gap-1.5 py-5 transition hover:text-[#1D4ED8]">
          Destinations
          <ChevronDown className="size-3.5 transition group-hover:rotate-180" aria-hidden="true" />
        </Link>
        {destinationGroups.length > 0 ? (
          <div className="invisible absolute left-1/2 top-full z-50 w-[560px] -translate-x-1/2 translate-y-2 rounded-2xl border border-slate-200 bg-white p-5 opacity-0 shadow-2xl shadow-slate-950/15 transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <div className="grid grid-cols-2 gap-4">
              {destinationGroups.slice(0, 6).map((group) => (
                <div key={group.label}>
                  {group.href ? (
                    <Link href={group.href} className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
                      {group.label}
                    </Link>
                  ) : (
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
                      {group.label}
                    </p>
                  )}
                  <div className="mt-2 grid gap-1.5">
                    {group.destinations.slice(0, 4).map((destination) => (
                      <Link
                        key={destination.id}
                        href={getCanonicalDestinationPath(destination, group.city)}
                        className="line-clamp-1 text-sm font-semibold text-[#0A2A66] transition hover:text-[#1D4ED8]"
                      >
                        {destination.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Link href="/destinations" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D4ED8] transition hover:text-[#0A2A66]">
              View all destinations
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        ) : null}
      </div>
      <div className="group relative">
        <Link href="/guides" className="inline-flex items-center gap-1.5 py-5 transition hover:text-[#1D4ED8]">
          Travel Guides
          <ChevronDown className="size-3.5 transition group-hover:rotate-180" aria-hidden="true" />
        </Link>
        {guideGroups.length > 0 ? (
          <div className="invisible absolute right-0 top-full z-50 w-[520px] translate-y-2 rounded-2xl border border-slate-200 bg-white p-5 opacity-0 shadow-2xl shadow-slate-950/15 transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <div className="grid grid-cols-2 gap-4">
              {guideGroups.slice(0, 6).map((group) => (
                <div key={group.city.id}>
                  <Link href={`/${group.city.slug}/guides`} className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
                    {group.city.name}
                  </Link>
                  <div className="mt-2 grid gap-1.5">
                    {group.guides.slice(0, 3).map((guide) => (
                      <Link
                        key={guide.id}
                        href={getGuideHref(guide)}
                        className="line-clamp-1 text-sm font-semibold text-[#0A2A66] transition hover:text-[#1D4ED8]"
                      >
                        {guide.title}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Link href="/guides" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D4ED8] transition hover:text-[#0A2A66]">
              View all guides
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        ) : null}
      </div>
    </nav>
  );
}

function groupCitiesByCountry(cities: City[]) {
  const groups = new Map<string, City[]>();

  for (const city of cities) {
    const country = city.country || "Global";
    groups.set(country, [...(groups.get(country) || []), city]);
  }

  return Array.from(groups.entries())
    .map(([country, groupCities]) => ({
      country,
      cities: [...groupCities].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.country.localeCompare(b.country));
}

function groupDestinationsByCity(destinations: Destination[], cityBySlug: Map<string, City>) {
  const groups = new Map<string, { label: string; href?: string; city?: City; destinations: Destination[] }>();

  for (const destination of sortDestinations(destinations)) {
    if (!destination.name || !destination.slug) {
      continue;
    }

    const city = cityBySlug.get(destination.citySlug);
    const key = city?.slug || destination.city || destination.region || "More destinations";
    const label = city?.name || destination.city || destination.region || "More destinations";
    const current = groups.get(key);

    groups.set(key, {
      label,
      href: city ? `/${city.slug}` : undefined,
      city,
      destinations: [...(current?.destinations || []), destination],
    });
  }

  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function sortDestinations(destinations: Destination[]) {
  return [...destinations].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) {
      return a.isFeatured ? -1 : 1;
    }

    const orderA = a.displayOrder || 999;
    const orderB = b.displayOrder || 999;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const cityCompare = a.city.localeCompare(b.city);
    return cityCompare || a.name.localeCompare(b.name);
  });
}

function groupGuidesByCity(guides: Guide[], cityBySlug: Map<string, City>) {
  const groups = new Map<string, { city: City; guides: Guide[] }>();

  for (const guide of guides) {
    if (guide.targetType !== "city") {
      continue;
    }

    const city = cityBySlug.get(guide.citySlug);

    if (!city) {
      continue;
    }

    const current = groups.get(city.slug);
    groups.set(city.slug, {
      city,
      guides: [...(current?.guides || []), guide],
    });
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      guides: [...group.guides].sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) {
          return a.isFeatured ? -1 : 1;
        }

        const orderA = a.displayOrder || 999;
        const orderB = b.displayOrder || 999;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return a.title.localeCompare(b.title);
      }),
    }))
    .sort((a, b) => a.city.name.localeCompare(b.city.name));
}
