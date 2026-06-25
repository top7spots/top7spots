import Link from "next/link";
import { MapPin } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { restaurantImageAlt } from "@/lib/image-seo";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/image-performance";
import { resolveImagePath } from "@/lib/images";
import type { City, Restaurant } from "@/lib/types";

export function RestaurantCard({ restaurant, city }: { restaurant: Restaurant; city?: City }) {
  const image = restaurant.image ? resolveImagePath(restaurant.image) : "";

  return (
    <Link
      href={`/restaurants/${restaurant.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {image ? (
          <SafeImage
            src={image}
            alt={restaurant.imageAlt || restaurantImageAlt({ ...restaurant, city: city?.name, country: city?.country })}
            fill
            sizes={IMAGE_SIZES.threeColumnCard}
            quality={IMAGE_QUALITY.card}
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center px-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Restaurant
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap gap-2">
          {restaurant.cuisineType ? (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
              {restaurant.cuisineType}
            </span>
          ) : null}
          {restaurant.priceRange ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {restaurant.priceRange}
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-6 text-[#111827]">
          {restaurant.name}
        </h3>
        {city ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <MapPin className="size-3.5" aria-hidden="true" />
            {city.name}, {city.country}
          </p>
        ) : null}
        {restaurant.shortDescription ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
            {restaurant.shortDescription}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
