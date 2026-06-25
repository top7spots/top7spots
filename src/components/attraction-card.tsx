import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { attractionImageAlt } from "@/lib/image-seo";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/image-performance";
import { resolveImagePath } from "@/lib/images";
import type { Attraction, City } from "@/lib/types";

type AttractionCardProps = {
  attraction: Attraction;
  city?: Pick<City, "country">;
};

export function AttractionCard({ attraction, city }: AttractionCardProps) {
  const image = resolveImagePath(attraction.image);
  const imageAlt = attraction.imageAlt || attractionImageAlt({ ...attraction, country: city?.country });
  const href = attraction.citySlug ? `/${attraction.citySlug}/attractions/${attraction.slug}` : undefined;

  return (
    <Card className="group overflow-hidden rounded-xl border-slate-200 bg-white p-0 shadow-[0_18px_50px_rgb(15_23_42_/_8%)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_80px_rgb(15_23_42_/_16%)]">
      <div className="relative aspect-[16/11] overflow-hidden bg-slate-100">
        <SafeImage
          src={image}
          alt={imageAlt}
          fill
          sizes={IMAGE_SIZES.threeColumnCard}
          quality={IMAGE_QUALITY.card}
          className="object-cover transition duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/70 to-transparent" />
        <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur">
          <Clock className="size-3.5" aria-hidden="true" />
          {attraction.recommendedTime || "Flexible"}
        </span>
      </div>
      <CardContent className="grid gap-3 p-5">
        <Badge variant="outline" className="w-fit rounded-full border-orange-200 text-[#FF6B00]">
          {attraction.type || "Attraction"}
        </Badge>
        <h3 className="text-lg font-semibold leading-tight text-[#111827]">
          {href ? (
            <Link href={href} className="transition hover:text-[#1D4ED8]">
              {attraction.name}
            </Link>
          ) : (
            attraction.name
          )}
        </h3>
        <p className="line-clamp-3 text-sm leading-6 text-slate-600">
          {attraction.summary || "A recommended place to add to a future travel route."}
        </p>
        <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="size-4" aria-hidden="true" />
            {attraction.city || "Global"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
