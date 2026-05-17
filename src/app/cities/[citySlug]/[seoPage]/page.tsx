import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Compass, MapPin, Sparkles } from "lucide-react";
import { AttractionCard } from "@/components/attraction-card";
import { BreadcrumbTrail } from "@/components/breadcrumb-trail";
import { DestinationCard } from "@/components/destination-card";
import { GuideCard } from "@/components/guide-card";
import { SectionHeading } from "@/components/section-heading";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { countryPath } from "@/lib/country-hubs";
import {
  getAttractionsByCity,
  getCityBySlug,
  getDestinationsByCity,
  getGuidesByCity,
} from "@/lib/data";
import {
  citySeoPages,
  citySeoPath,
  getCitySeoPage,
  hasMeaningfulCitySeoContent,
} from "@/lib/programmatic-seo";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CitySeoPageProps = {
  params: Promise<{ citySlug: string; seoPage: string }>;
};

export async function generateMetadata({ params }: CitySeoPageProps): Promise<Metadata> {
  const { citySlug, seoPage } = await params;
  const [city, page, destinations, attractions, guides] = await Promise.all([
    getCityBySlug(citySlug),
    Promise.resolve(getCitySeoPage(seoPage)),
    getDestinationsByCity(citySlug),
    getAttractionsByCity(citySlug),
    getGuidesByCity(citySlug),
  ]);

  if (!city || !page || city.status !== "published") {
    return {};
  }
  const hasContent = hasMeaningfulCitySeoContent(page.slug, {
    destinations: destinations.length,
    attractions: attractions.length,
    guides: guides.length,
  });

  return {
    ...seoMetadata({
      title: page.metadataTitle(city),
      description: page.description(city),
      path: citySeoPath(city.slug, page.slug),
      image: city.heroImage || city.featuredImage || city.cardImage,
    }),
    ...(!hasContent ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CitySeoPage({ params }: CitySeoPageProps) {
  const { citySlug, seoPage } = await params;
  const page = getCitySeoPage(seoPage);

  if (!page) {
    notFound();
  }

  const [city, destinations, attractions, guides] = await Promise.all([
    getCityBySlug(citySlug),
    getDestinationsByCity(citySlug),
    getAttractionsByCity(citySlug),
    getGuidesByCity(citySlug),
  ]);

  if (!city || city.status !== "published") {
    notFound();
  }

  const pagePath = citySeoPath(city.slug, page.slug);
  const countryHref = city.country ? countryPath(city.country) : "";
  const relatedPages = citySeoPages.filter((item) => item.slug !== page.slug);
  const hasContent = hasMeaningfulCitySeoContent(page.slug, {
    destinations: destinations.length,
    attractions: attractions.length,
    guides: guides.length,
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <BreadcrumbJsonLd
        items={[
          ...(countryHref ? [{ name: city.country, path: countryHref }] : []),
          { name: city.name, path: `/${city.slug}` },
          { name: page.label, path: pagePath },
        ]}
      />
      <ArticleJsonLd
        title={page.metadataTitle(city)}
        description={page.description(city)}
        image={city.heroImage || city.featuredImage || city.cardImage}
        path={pagePath}
        section={`${city.name} travel`}
        dateModified={city.updatedAt || city.createdAt}
      />
      <SiteHeader />
      <main>
        <section className="border-b border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <BreadcrumbTrail
              items={[
                ...(countryHref ? [{ label: city.country, href: countryHref }] : []),
                { label: city.name, href: `/${city.slug}` },
                { label: page.label },
              ]}
            />
            <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
                  {page.eyebrow}
                </p>
                <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-[#111827] md:text-6xl">
                  {page.title(city)}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                  {page.intro(city)}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Badge className="rounded-full bg-blue-50 px-3 py-1 text-[#0A2A66] hover:bg-blue-50">
                    {destinations.length} destinations
                  </Badge>
                  <Badge className="rounded-full bg-orange-50 px-3 py-1 text-[#FF6B00] hover:bg-orange-50">
                    {attractions.length} attractions
                  </Badge>
                  <Badge className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-100">
                    {guides.length} guides
                  </Badge>
                </div>
              </div>
              <aside className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5 shadow-sm">
                <p className="text-sm font-semibold text-[#0A2A66]">Explore {city.name}</p>
                <div className="mt-4 grid gap-2">
                  <Link href={`/${city.slug}`} className="text-sm font-semibold text-[#0A2A66] transition hover:text-[#1D4ED8]">
                    City hub
                  </Link>
                  {countryHref ? (
                    <Link href={countryHref} className="text-sm font-semibold text-[#0A2A66] transition hover:text-[#1D4ED8]">
                      {city.country} travel hub
                    </Link>
                  ) : null}
                  <Link href="/destinations" className="text-sm font-semibold text-[#0A2A66] transition hover:text-[#1D4ED8]">
                    Destination hub
                  </Link>
                  <Link href="/guides" className="text-sm font-semibold text-[#0A2A66] transition hover:text-[#1D4ED8]">
                    Guide hub
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {hasContent ? (
            <div className="grid gap-5 lg:grid-cols-3">
              {relatedPages.map((item) => (
                <Link
                  key={item.slug}
                  href={citySeoPath(city.slug, item.slug)}
                  className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2563EB] hover:shadow-xl"
                >
                  <Sparkles className="size-6 text-[#FF6B00]" aria-hidden="true" />
                  <h2 className="mt-4 text-xl font-semibold tracking-tight text-[#111827]">
                    {item.title(city)}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description(city)}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0A2A66] transition group-hover:text-[#1D4ED8]">
                    Open page
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <Compass className="mx-auto size-8 text-[#FF6B00]" aria-hidden="true" />
              <h2 className="mt-4 text-2xl font-semibold text-[#111827]">More {city.name} content is coming</h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Publish destinations, attractions, and guides in the admin dashboard to expand this
                programmatic SEO page automatically.
              </p>
            </div>
          )}
        </section>

        {destinations.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Destination ideas" title={`Places to visit in ${city.name}`}>
              Published destination pages connected to {city.name}, with routes back to this city
              hub and its SEO category pages.
            </SectionHeading>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {destinations.map((destination) => (
                <DestinationCard key={destination.id} destination={destination} />
              ))}
            </div>
          </section>
        ) : null}

        {attractions.length > 0 ? (
          <section className="border-y border-slate-200 bg-white py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeading eyebrow="Things to do" title={`Attractions and things to do in ${city.name}`}>
                Existing attraction pages can support things-to-do discovery without adding any new
                database fields.
              </SectionHeading>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {attractions.map((attraction) => (
                  <AttractionCard key={attraction.id} attraction={attraction} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {guides.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Planning guides" title={`${city.name} travel guides`}>
              Guide pages add route planning, seasonal, and first-time visitor context to this
              programmatic landing page.
            </SectionHeading>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {guides.map((guide) => (
                <GuideCard key={guide.id} guide={guide} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="border-t border-slate-200 bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 rounded-xl border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm md:grid-cols-3">
              <InternalLink href={`/${city.slug}`} icon={MapPin} label={`${city.name} city hub`} />
              <InternalLink href={citySeoPath(city.slug, "best-places")} icon={Compass} label="Best places page" />
              <InternalLink href={citySeoPath(city.slug, "things-to-do")} icon={BookOpen} label="Things to do page" />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function InternalLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof MapPin;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0A2A66] transition hover:border-[#2563EB] hover:bg-blue-50"
    >
      <span className="flex items-center gap-2">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </span>
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}
