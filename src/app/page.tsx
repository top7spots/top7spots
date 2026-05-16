import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Binoculars,
  Car,
  Crown,
  Gem,
  Globe2,
  Mountain,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TentTree,
  Waves,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { getPublishedCities } from "@/lib/data";
import { defaultSeoDescription, defaultSeoTitle, seoMetadata } from "@/lib/seo";
import type { City } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const heroImage = "/uploads/global/home-hero.jpg";

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

const inspiration = [
  "Curated city guides built around the best places to start",
  "Hidden gems, beaches, mountains, and road trips by region",
  "Premium travel inspiration without bookings, carts, or noise",
];

export default async function Home() {
  const cities = await getPublishedCities();
  const featuredCities = cities.filter((city) => city.isFeatured);
  const visibleCities = featuredCities.length > 0 ? featuredCities : cities;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
          <BrandLogo priority imageClassName="h-10 w-auto sm:h-11 lg:h-12" />
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <Link href="#featured-cities" className="transition hover:text-[#1D4ED8]">
              Cities
            </Link>
            <Link href="#categories" className="transition hover:text-[#1D4ED8]">
              Categories
            </Link>
            <Link href="#inspiration" className="transition hover:text-[#1D4ED8]">
              Inspiration
            </Link>
            <Link href="/admin/login" className="transition hover:text-[#1D4ED8]">
              Admin
            </Link>
          </nav>
          <button
            type="button"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Globe2 className="size-4" aria-hidden="true" />
            EN
          </button>
        </div>
      </header>

      <main>
        <section className="relative isolate min-h-[680px] overflow-hidden bg-[#0A2A66] text-white">
          <Image
            src={heroImage}
            alt="Scenic global travel landscape"
            fill
            priority
            sizes="100vw"
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
                Curated travel cities, hidden gems, beaches, mountains, road trips, and
                unforgettable experiences.
              </p>

              <div className="mt-8 flex max-w-3xl flex-col gap-3 rounded-2xl border border-white/15 bg-white/95 p-2 shadow-2xl shadow-blue-950/30 backdrop-blur sm:flex-row">
                <label className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                  <input
                    className="h-12 w-full rounded-xl border border-transparent bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="Search cities, countries, beaches, mountains..."
                  />
                </label>
                <Link
                  href="#featured-cities"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-[#FF6B00] px-6 text-sm font-semibold text-white shadow-lg shadow-orange-950/15 transition duration-300 hover:-translate-y-0.5 hover:bg-orange-600"
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
                  href="#categories"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition duration-300 hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Trending Spots
                  <Sparkles className="size-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
                {[
                  [String(visibleCities.length), "featured cities"],
                  ["Global", "travel scope"],
                  ["MVP", "editorial ready"],
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

            <aside className="hidden rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-blue-950/25 backdrop-blur-xl lg:block">
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

        <section id="featured-cities" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Featured Cities" title="Start with top cities around the world">
            Explore curated city pages that can grow into destination lists, local guides,
            attractions, and travel inspiration.
          </SectionHeading>
          {visibleCities.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {visibleCities.map((city) => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          ) : (
            <EmptyState title="No cities published yet" text="Publish a city in the admin dashboard to show it here." />
          )}
        </section>

        <section id="categories" className="border-y border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Explore By Category" title="Choose the mood of your next trip">
              Category filters are dummy UI for now and ready for city-level browsing later.
            </SectionHeading>
            <div className="flex flex-wrap gap-3">
              {categoryPills.map((category) => (
                <button
                  key={category.label}
                  type="button"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-semibold text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#2563EB] hover:bg-blue-50 hover:text-[#0A2A66]"
                >
                  <category.icon className="size-4" aria-hidden="true" />
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="inspiration" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Travel Inspiration" title="A global travel platform ready to scale">
            Top7Spots keeps discovery visual, fast, and editorial while leaving room for future
            guides and city collections.
          </SectionHeading>
          <div className="grid gap-5 md:grid-cols-3">
            {inspiration.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <Star className="mb-5 size-7 fill-[#FF6B00] text-[#FF6B00]" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-[#111827]">{item}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Built as placeholder inspiration now, with a clean path toward future editorial
                  travel content.
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
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
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
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
            {city.shortDescription || "A curated Top7Spots city ready for travel discovery."}
          </p>
          <Link
            href={`/${city.slug}`}
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A2A66] shadow-lg shadow-slate-950/20 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-50"
          >
            Explore
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
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
