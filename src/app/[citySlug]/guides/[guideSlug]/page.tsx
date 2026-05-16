import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Clock, Sparkles } from "lucide-react";
import { GuideCard } from "@/components/guide-card";
import { SectionHeading } from "@/components/section-heading";
import { BreadcrumbJsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  getCityBySlug,
  getGuideByCityAndSlug,
  getGuidesByCity,
} from "@/lib/data";
import { resolveImagePath } from "@/lib/images";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GuideDetailPageProps = {
  params: Promise<{ citySlug: string; guideSlug: string }>;
};

export async function generateMetadata({ params }: GuideDetailPageProps): Promise<Metadata> {
  const { citySlug, guideSlug } = await params;
  const [city, guide] = await Promise.all([
    getCityBySlug(citySlug),
    getGuideByCityAndSlug(citySlug, guideSlug),
  ]);

  if (!city || !guide) {
    return {};
  }

  return seoMetadata({
    title: guide.seoTitle || `${guide.title} | Top7Spots`,
    description:
      guide.seoDescription ||
      guide.excerpt ||
      `A practical ${city.name} travel guide from Top7Spots.`,
    path: `/${city.slug}/guides/${guide.slug}`,
    image: guide.coverImage || guide.image,
    type: "article",
  });
}

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { citySlug, guideSlug } = await params;
  const [city, guide, guides] = await Promise.all([
    getCityBySlug(citySlug),
    getGuideByCityAndSlug(citySlug, guideSlug),
    getGuidesByCity(citySlug),
  ]);

  if (!city || !guide) {
    notFound();
  }

  const image = resolveImagePath(guide.coverImage || guide.image);
  const relatedGuides = guides.filter((item) => item.id !== guide.id);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <BreadcrumbJsonLd
        items={[
          { name: city.name, path: `/${city.slug}` },
          { name: guide.title, path: `/${city.slug}/guides/${guide.slug}` },
        ]}
      />
      <SiteHeader />
      <main>
        <section className="bg-white px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Link
              href={`/${city.slug}`}
              className={buttonVariants({
                variant: "ghost",
                className: "mb-5 rounded-full px-0 text-slate-600 hover:bg-transparent",
              })}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to {city.name}
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
                  {guide.excerpt || `Curated planning guidance for ${city.name} from Top7Spots.`}
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                    <BookOpen className="size-4 text-[#1D4ED8]" aria-hidden="true" />
                    {city.name} guide
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
                  alt={guide.title}
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
              Top7Spots is built for city discovery and inspiration, keeping travel planning fast,
              visual, and easy to revisit.
            </p>
          </aside>
        </article>

        {relatedGuides.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Related guides" title={`More ${city.name} travel inspiration`}>
              Keep planning with city-specific editorial ideas.
            </SectionHeading>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {relatedGuides.map((item) => (
                <GuideCard key={item.id} guide={item} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
