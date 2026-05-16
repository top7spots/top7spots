import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Clock, Sparkles } from "lucide-react";
import { BreadcrumbTrail } from "@/components/breadcrumb-trail";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { countryPath } from "@/lib/country-hubs";
import { getDestinations, getGuide, getPublishedCities } from "@/lib/data";
import { resolveImagePath } from "@/lib/images";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GuideDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: GuideDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);

  if (!guide) {
    return {};
  }

  return seoMetadata({
    title: guide.seoTitle || `${guide.title} | Top7Spots`,
    description: guide.seoDescription || guide.excerpt || "A practical travel guide from Top7Spots.",
    path: guide.citySlug ? `/${guide.citySlug}/guides/${guide.slug}` : `/guides/${guide.slug}`,
    image: guide.coverImage || guide.image,
    type: "article",
  });
}

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { slug } = await params;
  const [guide, destinations, cities] = await Promise.all([
    getGuide(slug),
    getDestinations(),
    getPublishedCities(),
  ]);

  if (!guide) {
    notFound();
  }

  const image = resolveImagePath(guide.coverImage || guide.image);
  const canonicalPath = guide.citySlug ? `/${guide.citySlug}/guides/${guide.slug}` : `/guides/${guide.slug}`;
  const parentCity = guide.citySlug ? cities.find((city) => city.slug === guide.citySlug) : undefined;
  const countryHref = parentCity?.country ? countryPath(parentCity.country) : "";
  const relatedDestinations = destinations
    .filter((destination) => guide.citySlug && destination.citySlug === guide.citySlug)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <BreadcrumbJsonLd
        items={[
          { name: "Guides", path: "/guides" },
          ...(countryHref && parentCity ? [{ name: parentCity.country, path: countryHref }] : []),
          {
            name: guide.title,
            path: canonicalPath,
          },
        ]}
      />
      <ArticleJsonLd
        title={guide.title}
        description={guide.seoDescription || guide.excerpt || "A practical travel guide from Top7Spots."}
        image={guide.coverImage || guide.image}
        path={canonicalPath}
        author={guide.author}
        datePublished={guide.createdAt}
        dateModified={guide.updatedAt}
        section={guide.category || "Travel guide"}
      />
      <SiteHeader />
      <main>
        <section className="bg-white px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <BreadcrumbTrail
              items={[
                { label: "Guides", href: "/guides" },
                ...(countryHref && parentCity ? [{ label: parentCity.country, href: countryHref }] : []),
                ...(guide.citySlug ? [{ label: "City hub", href: `/${guide.citySlug}` }] : []),
                { label: guide.title },
              ]}
            />
            <Link
              href="/guides"
              className={buttonVariants({
                variant: "ghost",
                className: "mb-5 rounded-full px-0 text-slate-600 hover:bg-transparent",
              })}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to guides
            </Link>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
              <div>
                <Badge className="rounded-full bg-blue-50 px-3 py-1 text-[#1D4ED8] hover:bg-blue-50">
                  {guide.category || "Travel guide"}
                </Badge>
                <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-[#111827] md:text-6xl">
                  {guide.title}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                  {guide.excerpt || "Curated planning guidance from Top7Spots."}
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                    <BookOpen className="size-4 text-[#1D4ED8]" aria-hidden="true" />
                    Top7Spots guide
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                    <Clock className="size-4 text-[#1D4ED8]" aria-hidden="true" />
                    {guide.readTime || "Quick read"}
                  </span>
                </div>
              </div>
              <div className="relative min-h-72 overflow-hidden rounded-3xl bg-slate-200 shadow-2xl shadow-slate-200/80">
                <Image
                  src={image}
                  alt={`${guide.title} travel guide on Top7Spots`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 420px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <article className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
              Travel inspiration
            </p>
            <div className="mt-6 grid gap-7">
              {(guide.content.length > 0
                ? guide.content
                : ["This guide is ready for richer editorial content from the admin dashboard."]
              ).map((paragraph) => (
                <p key={paragraph} className="text-base leading-8 text-slate-600 md:text-lg">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
          <aside className="h-fit rounded-3xl bg-[#0A2A66] p-6 text-white shadow-xl shadow-blue-950/15 lg:sticky lg:top-24">
            <Sparkles className="size-8 text-orange-300" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-semibold">Use this guide to shape a route</h2>
            <p className="mt-3 text-sm leading-7 text-blue-50">
              Top7Spots is built for discovery and inspiration, keeping travel planning fast,
              visual, and easy to revisit.
            </p>
            <div className="mt-5 grid gap-2 border-t border-white/10 pt-5">
              {countryHref && parentCity ? (
                <Link href={countryHref} className="text-sm font-semibold text-white transition hover:text-orange-200">
                  Explore {parentCity.country}
                </Link>
              ) : null}
              {guide.citySlug ? (
                <Link href={`/${guide.citySlug}`} className="text-sm font-semibold text-white transition hover:text-orange-200">
                  Open city hub
                </Link>
              ) : null}
              {relatedDestinations.map((destination) => (
                <Link
                  key={destination.id}
                  href={`/${destination.citySlug}/destinations/${destination.slug}`}
                  className="text-sm font-semibold text-blue-50 transition hover:text-orange-200"
                >
                  {destination.name}
                </Link>
              ))}
            </div>
          </aside>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
