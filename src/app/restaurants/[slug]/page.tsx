import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin, Utensils } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { BreadcrumbTrail } from "@/components/breadcrumb-trail";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getPublishedCities, getPublishedGuides, getPublishedRestaurant } from "@/lib/data";
import { slugify } from "@/lib/format";
import { getGuideHref } from "@/lib/guide-routes";
import { restaurantImageAlt } from "@/lib/image-seo";
import { resolveImagePath } from "@/lib/images";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RestaurantPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: RestaurantPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [restaurant, cities] = await Promise.all([getPublishedRestaurant(slug), getPublishedCities()]);

  if (!restaurant) {
    return {};
  }

  const city = cities.find((item) => item.id === restaurant.cityId);

  const metadata = seoMetadata({
    title: `${restaurant.name} | Top7Spots`,
    description: restaurant.shortDescription || `A Top7Spots restaurant pick for ${restaurant.name}.`,
    path: `/restaurants/${restaurant.slug}`,
    image: restaurant.image,
    imageAlt: restaurant.imageAlt || restaurantImageAlt({ ...restaurant, city: city?.name, country: city?.country }),
  });

  return {
    ...metadata,
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
      },
    },
  };
}

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { slug } = await params;
  const [restaurant, cities, guides] = await Promise.all([
    getPublishedRestaurant(slug),
    getPublishedCities(),
    getPublishedGuides(),
  ]);

  if (!restaurant) {
    notFound();
  }

  const city = cities.find((item) => item.id === restaurant.cityId);
  const citySlug = city?.slug || slugify(restaurant.cityId);
  const image = restaurant.image ? resolveImagePath(restaurant.image) : "";
  const relatedGuides = guides
    .filter((guide) => guide.citySlug === citySlug || guide.countryId === restaurant.countrySlug)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <SiteHeader />
      <main>
        <section className="bg-white px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <BreadcrumbTrail
              items={[
                { label: "Restaurants" },
                { label: restaurant.name },
              ]}
            />
            <Link
              href={city ? `/${city.slug}` : "/"}
              className={buttonVariants({
                variant: "ghost",
                className: "mb-5 rounded-full px-0 text-slate-600 hover:bg-transparent",
              })}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {city ? `Back to ${city.name}` : "Back to home"}
            </Link>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
              <div>
                <div className="flex flex-wrap gap-2">
                  {restaurant.cuisineType ? (
                    <Badge className="rounded-full bg-blue-50 px-3 py-1 text-[#1D4ED8] hover:bg-blue-50">
                      {restaurant.cuisineType}
                    </Badge>
                  ) : null}
                  {restaurant.priceRange ? (
                    <Badge className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-100">
                      {restaurant.priceRange}
                    </Badge>
                  ) : null}
                </div>
                <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-[#111827] md:text-6xl">
                  {restaurant.name}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                  {restaurant.shortDescription}
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium text-slate-600">
                  {city ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                      <MapPin className="size-4 text-[#1D4ED8]" aria-hidden="true" />
                      {city.name}, {city.country}
                    </span>
                  ) : null}
                  {restaurant.address ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                      <Utensils className="size-4 text-[#1D4ED8]" aria-hidden="true" />
                      {restaurant.address}
                    </span>
                  ) : null}
                </div>
              </div>
              {image ? (
                <div className="relative min-h-72 overflow-hidden rounded-3xl bg-slate-200 shadow-2xl shadow-slate-200/80">
                  <SafeImage
                    src={image}
                    alt={restaurant.imageAlt || restaurantImageAlt({ ...restaurant, city: city?.name, country: city?.country })}
                    fill
                    priority
                    sizes="(min-width: 1024px) 420px, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
              Overview
            </p>
            <div className="mt-4 grid gap-4 text-base leading-8 text-slate-600">
              {(restaurant.longDescription || restaurant.shortDescription)
                .split(/\n+/)
                .filter(Boolean)
                .map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
            </div>
            {restaurant.tags.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {restaurant.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            {restaurant.googleMapsUrl ? (
              <Link
                href={restaurant.googleMapsUrl}
                className={buttonVariants({
                  className: "mt-6 rounded-full bg-[#0A2A66] text-white hover:bg-[#1D4ED8]",
                })}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>

          {relatedGuides.length > 0 ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">Related guides</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {relatedGuides.map((guide) => (
                  <Link
                    key={guide.id}
                    href={getGuideHref(guide)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-blue-50"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
                      {guide.category || "Guide"}
                    </p>
                    <h3 className="mt-2 text-base font-semibold leading-6 text-[#111827]">{guide.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
