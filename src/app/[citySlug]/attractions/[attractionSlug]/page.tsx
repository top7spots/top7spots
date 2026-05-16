import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Sparkles } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  getAttractionByCityAndSlug,
  getCityBySlug,
} from "@/lib/data";
import { resolveImagePath } from "@/lib/images";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AttractionPageProps = {
  params: Promise<{ citySlug: string; attractionSlug: string }>;
};

export async function generateMetadata({ params }: AttractionPageProps): Promise<Metadata> {
  const { citySlug, attractionSlug } = await params;
  const [city, attraction] = await Promise.all([
    getCityBySlug(citySlug),
    getAttractionByCityAndSlug(citySlug, attractionSlug),
  ]);

  if (!city || !attraction) {
    return {};
  }

  return seoMetadata({
    title: attraction.seoTitle || `${attraction.name} in ${city.name} | Top7Spots`,
    description:
      attraction.seoDescription ||
      attraction.description ||
      `Explore ${attraction.name} in ${city.name} with Top7Spots.`,
    path: `/${city.slug}/attractions/${attraction.slug}`,
    image: attraction.image,
  });
}

export default async function AttractionPage({ params }: AttractionPageProps) {
  const { citySlug, attractionSlug } = await params;
  const [city, attraction] = await Promise.all([
    getCityBySlug(citySlug),
    getAttractionByCityAndSlug(citySlug, attractionSlug),
  ]);

  if (!city || !attraction) {
    notFound();
  }

  const image = resolveImagePath(attraction.image);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
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
                <Badge className="rounded-full bg-orange-50 px-3 py-1 text-[#FF6B00] hover:bg-orange-50">
                  {attraction.category || attraction.type || "Attraction"}
                </Badge>
                <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-[#111827] md:text-6xl">
                  {attraction.name}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                  {attraction.description ||
                    attraction.summary ||
                    `A curated attraction to add to your ${city.name} travel route.`}
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                    <MapPin className="size-4 text-[#1D4ED8]" aria-hidden="true" />
                    {city.name}, {city.country}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                    <Clock className="size-4 text-[#1D4ED8]" aria-hidden="true" />
                    {attraction.recommendedTime || "Flexible"}
                  </span>
                </div>
              </div>
              <div className="relative min-h-72 overflow-hidden rounded-3xl bg-slate-200 shadow-2xl shadow-slate-200/80">
                <Image
                  src={image}
                  alt={attraction.name}
                  fill
                  priority
                  sizes="(min-width: 1024px) 420px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#0A2A66] p-6 text-white shadow-xl shadow-blue-950/15 md:p-8">
            <Sparkles className="size-8 text-orange-300" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-semibold">City attraction note</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
              This page is ready for richer attraction content as the city-first architecture grows.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
