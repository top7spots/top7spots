import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Binoculars,
  BookOpen,
  Car,
  ChevronDown,
  Crown,
  Gem,
  Globe2,
  MapPin,
  Menu,
  Mountain,
  Quote,
  ShieldCheck,
  Sparkles,
  TentTree,
  Waves,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { CityDirectory } from "@/components/city-directory";
import { SearchBox } from "@/components/search-box";
import { SectionHeading } from "@/components/section-heading";
import { WebsiteJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
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
import {
  getPublishedCities,
  getPublishedDestinations,
  getPublishedGuides,
  getPublishedHomepageFaqs,
  getPublishedHomepageReviews,
} from "@/lib/data";
import { resolveImagePath } from "@/lib/images";
import { defaultSeoDescription, defaultSeoTitle, seoMetadata } from "@/lib/seo";
import type { City, Destination, Guide } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const heroImage = "/uploads/global/home-hero.jpg";
const featuredCityImageSizes =
  "(min-width: 1280px) 305px, (min-width: 768px) calc((100vw - 3rem) / 2), calc(100vw - 2rem)";
const weeklyDestinationImageSizes =
  "(min-width: 1280px) 630px, (min-width: 768px) calc((100vw - 3rem) / 2), calc(100vw - 2rem)";

export const metadata: Metadata = seoMetadata({
  title: defaultSeoTitle,
  description: defaultSeoDescription,
  path: "/",
  image: heroImage,
});

const categoryPills = [
  { label: "Beaches", icon: Waves },
  { label: "Mountains", icon: Mountain },
  { label: "Desert", icon: TentTree },
  { label: "Luxury", icon: Crown },
  { label: "Adventure", icon: Binoculars },
  { label: "Hidden Gems", icon: Gem },
  { label: "Family", icon: ShieldCheck },
  { label: "Road Trips", icon: Car },
];

const featuredCityPriority = [
  "muscat",
  "salalah",
  "cairo",
  "dubai",
  "doha",
  "istanbul",
  "kochi",
  "nizwa",
  "sohar",
  "sur",
  "khasab",
  "jebel-akhdar",
];

const fallbackTravelerReviews = [
  {
    name: "Maya R.",
    text: "Top7Spots makes trip research feel calm. I can start with a city, compare the highlights, and save the deeper reading for later.",
  },
  {
    name: "Daniel K.",
    text: "The destination pages are concise without feeling thin. They give me enough context to decide what belongs in a route.",
  },
  {
    name: "Aisha M.",
    text: "I like that the guides connect back to cities and nearby places. It feels more organized than jumping between random lists.",
  },
  {
    name: "Jonas L.",
    text: "The site has a polished travel-magazine feel, but the pages are practical when I am actually planning.",
  },
];

const fallbackHomepageFaqs = [
  {
    question: "What is Top7Spots?",
    answer:
      "Top7Spots is a curated travel discovery site for finding standout cities, destinations, attractions, and practical travel guides in one organized place.",
  },
  {
    question: "How are destinations selected?",
    answer:
      "Destinations are organized from the published Top7Spots collection using editorial signals such as featured status, display order, city context, and useful planning detail.",
  },
  {
    question: "Can I explore places by country or city?",
    answer:
      "Yes. The homepage includes featured city hubs and a city directory grouped by country, so you can browse from broad country discovery into specific city pages.",
  },
  {
    question: "What are travel guides?",
    answer:
      "Travel guides are planning articles connected to cities and destinations, covering practical topics such as timing, routes, local context, and trip preparation.",
  },
  {
    question: "Are new destinations added regularly?",
    answer:
      "Yes. The destination library is designed to grow over time as new city hubs, guides, attractions, and curated places are published.",
  },
  {
    question: "Can I suggest a destination?",
    answer:
      "Suggestions are welcome as the collection grows. For now, use the published city and destination pages as the best way to see what is already live.",
  },
];

export default async function Home() {
  const [cities, destinations, guides, publishedReviews, publishedFaqs] = await Promise.all([
    getPublishedCities(),
    getPublishedDestinations(),
    getPublishedGuides(),
    getPublishedHomepageReviews(),
    getPublishedHomepageFaqs(),
  ]);
  const visibleCities = sortHomepageCities(cities).slice(0, 12);
  const cityBySlug = new Map(cities.map((city) => [city.slug, city]));
  const cityGroups = groupCitiesByCountry(cities);
  const destinationGroups = groupDestinationsByCity(destinations, cityBySlug);
  const guideGroups = groupGuidesByCity(guides, cityBySlug);
  const cityDirectoryGroups = cityGroups.map((group) => ({
    country: group.country,
    countryPath: countryPath(group.country),
    cities: group.cities.map((city) => ({
      id: city.id,
      name: city.name,
      slug: city.slug,
      country: city.country,
    })),
  }));
  const weeklyDestinations = selectWeeklyDestinations(destinations).slice(0, 7);
  const homepageGuides = selectHomepageGuides(guides, cityBySlug, visibleCities).slice(0, 6);
  const travelerReviews =
    publishedReviews.length > 0
      ? publishedReviews.map((review) => ({ name: review.name, text: review.reviewText }))
      : fallbackTravelerReviews;
  const homepageFaqs =
    publishedFaqs.length > 0
      ? publishedFaqs.map((faq) => ({ question: faq.question, answer: faq.answer }))
      : fallbackHomepageFaqs;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <WebsiteJsonLd />
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
          <BrandLogo imageClassName="h-10 w-auto sm:h-11 lg:h-12" />
          <HomepageNavigation
            cityGroups={cityGroups}
            destinationGroups={destinationGroups}
            guideGroups={guideGroups}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Select language, English"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Globe2 className="size-4" aria-hidden="true" />
              EN
            </button>
            <MobileHomepageNavigation
              cityGroups={cityGroups}
              destinationGroups={destinationGroups}
              guideGroups={guideGroups}
            />
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate min-h-[680px] overflow-hidden bg-[#0A2A66] text-white">
          <Image
            src={heroImage}
            alt="Scenic global travel landscape"
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={82}
            className="absolute inset-0 -z-20 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(7_27_66_/_92%),rgb(7_27_66_/_70%),rgb(7_27_66_/_28%))]" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/30 to-transparent" />
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end lg:px-8">
            <div className="max-w-4xl">
              <p className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-blue-50 ring-1 ring-white/20">
                Premium global travel discovery
              </p>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-tight md:text-7xl">
                Discover The World&apos;s Best Spots
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-blue-50 md:text-lg">
                Discover top travel spots, hidden gems, city guides, scenic destinations, and
                practical travel inspiration for memorable trips around the world.
              </p>

              <div className="relative z-30 mt-8 flex max-w-3xl flex-col gap-3 rounded-2xl border border-white/15 bg-white/95 p-2 shadow-2xl shadow-blue-950/30 backdrop-blur sm:flex-row">
                <SearchBox
                  containerClassName="relative z-40 min-w-0 flex-1"
                  inputClassName="h-12 w-full rounded-xl border border-transparent bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
                  dropdownClassName="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[100] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-blue-950/20"
                  iconClassName="text-slate-400"
                  placeholder="Search cities, countries, beaches, mountains..."
                />
                <Link
                  href="#featured-cities"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-[#C2410C] px-6 text-sm font-semibold text-white shadow-lg shadow-orange-950/15 transition duration-300 hover:-translate-y-0.5 hover:bg-[#9A3412]"
                >
                  Explore Cities
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="#featured-cities"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0A2A66] shadow-lg shadow-blue-950/15 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  Explore Cities
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="#top-destinations"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition duration-300 hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Top Destinations
                  <Sparkles className="size-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="relative z-0 mt-8 grid max-w-2xl grid-cols-3 gap-3">
                {[
                  [String(visibleCities.length), "featured cities"],
                  ["Global", "travel scope"],
                  ["Curated", "travel ideas"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <p className="text-2xl font-semibold">{value}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-blue-100">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="relative z-0 hidden rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-blue-950/25 backdrop-blur-xl lg:block">
              <p className="text-sm font-semibold text-orange-200">Today&apos;s discovery mood</p>
              <div className="mt-5 grid gap-3">
                {categoryPills.slice(0, 5).map((category) => (
                  <div key={category.label} className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
                    <span className="flex items-center gap-3 text-sm font-semibold">
                      <category.icon className="size-4 text-orange-200" aria-hidden="true" />
                      {category.label}
                    </span>
                    <ArrowRight className="size-4 text-blue-100" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white py-14">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
                Discover top travel spots worldwide
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-[#111827] md:text-4xl">
                A cleaner way to find the best places to visit
              </h2>
            </div>
            <div className="grid gap-5 text-sm leading-7 text-slate-600 md:grid-cols-2">
              <p>
                Top7Spots helps travelers move from broad inspiration to useful destination
                research without losing time in noisy search results. Each page is organized around
                cities, destination ideas, local attractions, and travel guides, so you can compare
                places by mood, geography, season, and trip style.
              </p>
              <p>
                Whether you are looking for beaches, mountains, road trips, historic neighborhoods,
                luxury escapes, family-friendly ideas, or quieter hidden gems, the site is designed
                to make discovery feel visual, calm, and practical. Start with a city, browse its
                best places to visit, then follow related links into guides and nearby destinations.
              </p>
            </div>
          </div>
        </section>

        <section id="featured-cities" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Explore destinations by city" title="Featured city travel hubs">
            City pages bring together the best local places to visit, travel tips, destination
            cards, nearby attractions, and guide links so each trip starts with useful context.
          </SectionHeading>
          {visibleCities.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {visibleCities.map((city) => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          ) : (
            <EmptyState title="More city guides are coming" text="New Top7Spots city hubs will appear here as the collection grows." />
          )}
        </section>

        <section id="top-destinations" className="border-y border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="This week's edit" title="Top 7 Destinations This Week">
              A deterministic weekly-style selection from the published destination library, using
              the current curated order until a dedicated weekly automation exists.
            </SectionHeading>
            {weeklyDestinations.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {weeklyDestinations.map((destination) => (
                  <DestinationFeatureCard
                    key={destination.id}
                    destination={destination}
                    city={cityBySlug.get(destination.citySlug)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="Destination picks are coming" text="Published destination cards will appear here once the collection is available." />
            )}
          </div>
        </section>

        <section id="travel-guides" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Plan with local context" title="Travel Guides">
            Text-first planning guides connected to published city hubs, designed for practical
            route research before you choose the final stops.
          </SectionHeading>
          {homepageGuides.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {homepageGuides.map((guide) => (
                <GuideTextCard key={guide.id} guide={guide} city={cityBySlug.get(guide.citySlug)} />
              ))}
            </div>
          ) : (
            <EmptyState title="Travel guides are coming" text="Published city travel guides will appear here as the guide library grows." />
          )}
        </section>

        <section id="traveler-reviews" className="border-y border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Traveler perspective" title="What Travelers Say">
              Notes from travelers who use Top7Spots as a calmer starting point for comparing city
              hubs, destinations, and guide ideas.
            </SectionHeading>
            <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {travelerReviews.map((review) => (
                <article
                  key={review.name}
                  className="min-w-[280px] snap-start rounded-xl border border-slate-200 bg-[#F8FAFC] p-5 shadow-sm sm:min-w-[360px]"
                >
                  <Quote className="size-6 text-[#FF6B00]" aria-hidden="true" />
                  <p className="mt-4 text-sm leading-7 text-slate-600">{review.text}</p>
                  <p className="mt-5 text-sm font-semibold text-[#111827]">{review.name}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {cityGroups.length > 0 ? (
          <section id="all-cities" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
                      EXPLORE ALL CITIES
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#111827]">
                      City directory by country
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      Browse countries and discover all cities published on Top7Spots.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/destinations"
                      className="rounded-full border border-slate-200 bg-[#F8FAFC] px-4 py-2 text-sm font-semibold text-[#0A2A66] transition hover:border-[#2563EB] hover:bg-blue-50"
                    >
                      Destination hub
                    </Link>
                    <Link
                      href="/guides"
                      className="rounded-full border border-slate-200 bg-[#F8FAFC] px-4 py-2 text-sm font-semibold text-[#0A2A66] transition hover:border-[#2563EB] hover:bg-blue-50"
                    >
                      Guide hub
                    </Link>
                  </div>
                </div>
                <CityDirectory groups={cityDirectoryGroups} />
              </div>
            </div>
          </section>
        ) : null}

        <FaqSection faqs={homepageFaqs} />
      </main>
      <SiteFooter />
    </div>
  );
}

function sortHomepageCities(cities: City[]) {
  return [...cities].sort((a, b) => {
    const priorityA = featuredCityPriority.indexOf(a.slug);
    const priorityB = featuredCityPriority.indexOf(b.slug);
    const scoreA = priorityA === -1 ? 999 : priorityA;
    const scoreB = priorityB === -1 ? 999 : priorityB;

    if (scoreA !== scoreB) {
      return scoreA - scoreB;
    }

    if (a.isFeatured !== b.isFeatured) {
      return a.isFeatured ? -1 : 1;
    }

    const orderA = a.displayOrder || 999;
    const orderB = b.displayOrder || 999;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.name.localeCompare(b.name);
  });
}

function selectWeeklyDestinations(destinations: Destination[]) {
  return [...destinations]
    .filter((destination) => destination.name && destination.slug)
    .sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }

      const orderA = Number.isFinite(a.displayOrder) && a.displayOrder > 0 ? a.displayOrder : 999;
      const orderB = Number.isFinite(b.displayOrder) && b.displayOrder > 0 ? b.displayOrder : 999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      const cityCompare = a.city.localeCompare(b.city);
      return cityCompare || a.name.localeCompare(b.name);
    });
}

function selectHomepageGuides(guides: Guide[], cityBySlug: Map<string, City>, visibleCities: City[]) {
  const visibleCitySlugs = new Set(visibleCities.map((city) => city.slug));
  const guidePool = guides.filter((guide) => guide.citySlug && cityBySlug.has(guide.citySlug));
  const visibleCityGuides = guidePool.filter((guide) => visibleCitySlugs.has(guide.citySlug));
  const fallbackGuides = guidePool.filter((guide) => !visibleCitySlugs.has(guide.citySlug));

  return [...visibleCityGuides, ...fallbackGuides].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) {
      return a.isFeatured ? -1 : 1;
    }

    const orderA = a.displayOrder || 999;
    const orderB = b.displayOrder || 999;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.title.localeCompare(b.title);
  });
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
      cities: sortHomepageCities(groupCities),
    }))
    .sort((a, b) => a.country.localeCompare(b.country));
}

function groupDestinationsByCity(destinations: Destination[], cityBySlug: Map<string, City>) {
  const groups = new Map<string, { label: string; href?: string; city?: City; destinations: Destination[] }>();

  for (const destination of selectWeeklyDestinations(destinations)) {
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

function groupGuidesByCity(guides: Guide[], cityBySlug: Map<string, City>) {
  const groups = new Map<string, { city: City; guides: Guide[] }>();

  for (const guide of guides) {
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
      guides: selectHomepageGuides(group.guides, cityBySlug, [group.city]).slice(0, 4),
    }))
    .sort((a, b) => a.city.name.localeCompare(b.city.name));
}

function HomepageNavigation({
  cityGroups,
  destinationGroups,
  guideGroups,
}: {
  cityGroups: ReturnType<typeof groupCitiesByCountry>;
  destinationGroups: ReturnType<typeof groupDestinationsByCity>;
  guideGroups: ReturnType<typeof groupGuidesByCity>;
}) {
  return (
    <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
      <div className="group relative">
        <Link href="#all-cities" className="inline-flex items-center gap-1.5 py-5 transition hover:text-[#1D4ED8]">
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
        <Link href="#travel-guides" className="inline-flex items-center gap-1.5 py-5 transition hover:text-[#1D4ED8]">
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
                        href={`/${guide.citySlug}/guides/${guide.slug}`}
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

function MobileHomepageNavigation({
  cityGroups,
  destinationGroups,
  guideGroups,
}: {
  cityGroups: ReturnType<typeof groupCitiesByCountry>;
  destinationGroups: ReturnType<typeof groupDestinationsByCity>;
  guideGroups: ReturnType<typeof groupGuidesByCity>;
}) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="rounded-full md:hidden"
            aria-label="Open menu"
          />
        }
      >
        <Menu className="size-4" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="right" className="z-[70] w-80 max-w-[calc(100vw-1rem)] overflow-y-auto bg-[#0A2A66] text-white">
        <SheetHeader>
          <SheetTitle>
            <BrandLogo variant="dark" imageClassName="h-12 w-auto" />
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-8 grid gap-2 overflow-y-auto px-3 pb-6">
          <details className="group rounded-lg">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white">
              Cities
              <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="grid gap-4 px-3 pb-3 pt-1">
              <Link href="#all-cities" className="text-sm font-semibold text-white transition hover:text-orange-200">
                All city hubs
              </Link>
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
                          href={getCanonicalDestinationPath(destination, group.city)}
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
                          href={`/${guide.citySlug}/guides/${guide.slug}`}
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
  );
}

function CityCard({ city }: { city: City }) {
  const image = city.cardImage || city.featuredImage || city.heroImage;

  return (
    <article className="group relative min-h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-[0_18px_50px_rgb(15_23_42_/_10%)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_90px_rgb(15_23_42_/_22%)]">
      <div className="absolute inset-0 overflow-hidden bg-slate-100">
        {image ? (
          <Image
            src={image}
            alt={`${city.name}, ${city.country}`}
            fill
            sizes={featuredCityImageSizes}
            quality={68}
            className="object-cover transition duration-700 ease-out group-hover:scale-110"
          />
        ) : null}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/5" />
      <div className="relative flex min-h-[420px] flex-col justify-between p-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#0A2A66] shadow-sm backdrop-blur">
            {city.isFeatured ? "Featured" : "Trending"}
          </span>
          <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur">
            {city.countryCode}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-orange-200">{city.country}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">{city.name}</h2>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-100">
            {city.shortDescription || "Explore destination ideas, local guides, and travel inspiration for this city."}
          </p>
          <Link
            href={`/${city.slug}`}
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A2A66] shadow-lg shadow-slate-950/20 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-50"
          >
            Explore {city.name}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function DestinationFeatureCard({ destination, city }: { destination: Destination; city?: City }) {
  const image = resolveImagePath(destination.image);
  const href = getCanonicalDestinationPath(destination, city);
  const context = [destination.city || city?.name, city?.country || destination.region]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="group relative min-h-[360px] overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-[0_18px_50px_rgb(15_23_42_/_10%)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_90px_rgb(15_23_42_/_22%)]">
      <div className="absolute inset-0 overflow-hidden bg-slate-100">
        <Image
          src={image}
          alt={`${destination.name}${context ? `, ${context}` : ""}`}
          fill
          sizes={weeklyDestinationImageSizes}
          quality={68}
          className="object-cover transition duration-700 ease-out group-hover:scale-110"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/5" />
      <div className="relative flex min-h-[360px] flex-col justify-between p-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#0A2A66] shadow-sm backdrop-blur">
            {destination.category || "Destination"}
          </span>
          {destination.duration ? (
            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur">
              {destination.duration}
            </span>
          ) : null}
        </div>
        <div>
          {context ? <p className="text-sm font-semibold text-orange-200">{context}</p> : null}
          <h3 className="mt-2 text-3xl font-semibold tracking-tight">{destination.name}</h3>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-100">
            {destination.summary || destination.description || "A curated Top7Spots destination idea ready for deeper discovery."}
          </p>
          <Link
            href={href}
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A2A66] shadow-lg shadow-slate-950/20 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-50"
          >
            Explore {destination.name}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function GuideTextCard({ guide, city }: { guide: Guide; city?: City }) {
  return (
    <article className="group flex min-h-[250px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
          <BookOpen className="size-4" aria-hidden="true" />
          <span>{guide.category || "Guide"}</span>
        </div>
        <h3 className="mt-4 text-xl font-semibold leading-tight tracking-tight text-[#111827]">
          {guide.title}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
          {guide.excerpt || "Curated planning notes from the Top7Spots guide library."}
        </p>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        {city ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500">
            <MapPin className="size-4 text-[#FF6B00]" aria-hidden="true" />
            {city.name}
          </span>
        ) : null}
        <Link
          href={guide.citySlug ? `/${guide.citySlug}/guides/${guide.slug}` : `/guides/${guide.slug}`}
          aria-label={`Read ${guide.title}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D4ED8] transition hover:text-[#0A2A66] group-hover:translate-x-0.5"
        >
          Read guide
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function FaqSection({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  return (
    <section id="faq" className="border-t border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Helpful answers" title="Frequently Asked Questions">
          Quick context for using Top7Spots as a city-first travel discovery and planning resource.
        </SectionHeading>
        <div className="grid gap-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-xl border border-slate-200 bg-[#F8FAFC] shadow-sm transition open:border-blue-200 open:bg-white open:shadow-lg open:shadow-slate-950/5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                <h3 className="text-base font-semibold tracking-tight text-[#111827]">{faq.question}</h3>
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0A2A66] transition group-open:rotate-180 group-hover:border-blue-200 group-hover:text-[#1D4ED8]">
                  <ChevronDown className="size-4" aria-hidden="true" />
                </span>
              </summary>
              <p className="border-t border-slate-100 px-5 pb-5 pt-4 text-sm leading-7 text-slate-600">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <Sparkles className="mx-auto size-8 text-[#FF6B00]" aria-hidden="true" />
      <h3 className="mt-4 text-xl font-semibold text-[#111827]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
