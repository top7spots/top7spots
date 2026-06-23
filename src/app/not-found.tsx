import Link from "next/link";
import { ArrowRight, Compass, Home, MapPin } from "lucide-react";
import { DestinationCard } from "@/components/destination-card";
import { GuideCard } from "@/components/guide-card";
import { SearchBox } from "@/components/search-box";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublishedCities, getPublishedDestinations, getPublishedGuides } from "@/lib/data";
import { cityImageAlt } from "@/lib/image-seo";
import { resolveImagePath } from "@/lib/images";
import type { City, Guide } from "@/lib/types";
import { SafeImage } from "@/components/safe-image";

export default async function NotFoundPage() {
  const [destinations, cities, guides] = await Promise.all([
    getPublishedDestinations(),
    getPublishedCities(),
    getPublishedGuides(),
  ]);
  const popularDestinations = destinations.slice(0, 4);
  const popularCities = cities.slice(0, 6);
  const popularGuides = guides.slice(0, 3);
  const cityBySlug = new Map(cities.map((city) => [city.slug, city]));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <SiteHeader />
      <main>
        <section className="border-b border-slate-200 bg-white px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">404 page not found</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-[#111827] md:text-6xl">
                This travel page wandered off route.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Search Top7Spots or jump into popular destinations, city hubs, and travel guides.
              </p>
              <div className="mt-7 max-w-2xl">
                <SearchBox
                  placeholder="Search destinations, cities, guides..."
                  inputClassName="h-14 w-full rounded-full border border-slate-200 bg-[#F8FAFC] pl-12 pr-4 text-base text-slate-900 shadow-sm outline-none transition focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0A2A66] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8]"
                >
                  <Home className="size-4" aria-hidden="true" />
                  Return to homepage
                </Link>
                <Link
                  href="/destinations"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#0A2A66] transition hover:border-blue-200 hover:bg-blue-50"
                >
                  Browse destinations
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-orange-100 bg-orange-50 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <Compass className="size-10 text-[#FF6B00]" aria-hidden="true" />
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[#111827]">Quick recovery links</h2>
              <div className="mt-5 grid gap-2">
                {[
                  { href: "/destinations", label: "All destinations" },
                  { href: "/guides", label: "Travel guides" },
                  { href: "/countries/oman", label: "Oman travel hub" },
                  { href: "/countries/united-arab-emirates", label: "UAE travel hub" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#0A2A66] shadow-sm transition hover:text-[#1D4ED8]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {popularDestinations.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <SectionIntro eyebrow="Popular destinations" title="Pick up from a top travel spot" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {popularDestinations.map((destination) => (
                <DestinationCard key={destination.id} destination={destination} city={cityBySlug.get(destination.citySlug)} />
              ))}
            </div>
          </section>
        ) : null}

        {popularCities.length > 0 ? (
          <section className="border-y border-slate-200 bg-white py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionIntro eyebrow="Popular cities" title="Explore city travel hubs" />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {popularCities.map((city) => (
                  <CityRecoveryCard key={city.id} city={city} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {popularGuides.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <SectionIntro eyebrow="Popular guides" title="Useful reads while you reroute" />
            <div className="grid gap-6 md:grid-cols-3">
              {popularGuides.map((guide) => (
                <GuideCard
                  key={guide.id}
                  guide={guide}
                  cityName={guideCityName(guide, cityBySlug)}
                  imageSizes="(min-width: 768px) 33vw, 100vw"
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

function SectionIntro({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-7">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#111827] md:text-4xl">{title}</h2>
    </div>
  );
}

function CityRecoveryCard({ city }: { city: City }) {
  const image = resolveImagePath(city.cardImage || city.featuredImage || city.heroImage);

  return (
    <Link
      href={`/${city.slug}`}
      className="group grid overflow-hidden rounded-2xl border border-slate-200 bg-[#F8FAFC] shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] bg-slate-100">
        <SafeImage
          src={image}
          alt={cityImageAlt(city, "card")}
          fill
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#FF6B00]">
          <MapPin className="size-3.5" aria-hidden="true" />
          {city.country}
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-[#111827]">{city.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {city.shortDescription || city.region || `Explore travel ideas in ${city.name}.`}
        </p>
        {city.country ? (
          <span className="mt-4 inline-flex text-sm font-semibold text-[#1D4ED8]">
            View {city.country}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function guideCityName(guide: Guide, cityBySlug: Map<string, City>) {
  if (guide.targetType !== "city" || !guide.citySlug) {
    return undefined;
  }

  return cityBySlug.get(guide.citySlug)?.name;
}
