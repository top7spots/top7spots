import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCanonicalDestinationPath } from "@/lib/city-intelligence";
import { resolveImagePath } from "@/lib/images";
import type { Destination } from "@/lib/types";

type DestinationCardProps = {
  destination: Destination;
  imageSizes?: string;
};

const defaultDestinationCardImageSizes =
  "(min-width: 1280px) 305px, (min-width: 768px) calc((100vw - 3rem) / 2), calc(100vw - 2rem)";

export function DestinationCard({ destination, imageSizes = defaultDestinationCardImageSizes }: DestinationCardProps) {
  const image = resolveImagePath(destination.image);
  const category = destination.category || "Travel spot";
  const imageAlt = `${destination.name}${destination.city ? ` in ${destination.city}` : ""}${
    destination.category ? ` ${destination.category.toLowerCase()}` : " travel destination"
  }`;
  const location =
    [destination.location, destination.city].filter(Boolean).join(", ") ||
    [destination.city, destination.region].filter(Boolean).join(", ") ||
    "Global";
  const href = getCanonicalDestinationPath(destination);

  return (
    <Card className="group overflow-hidden rounded-xl border-slate-200 bg-white p-0 shadow-[0_18px_50px_rgb(15_23_42_/_8%)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_80px_rgb(15_23_42_/_16%)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes={imageSizes}
          quality={68}
          className="object-cover transition duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/70 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#0A2A66] shadow-sm backdrop-blur">
          {category}
        </div>
      </div>
      <CardContent className="grid gap-4 p-5">
        <Badge variant="secondary" className="w-fit rounded-full bg-orange-50 text-[#FF6B00]">
          Top spot
        </Badge>
        <div>
          <h3 className="text-lg font-semibold leading-tight text-[#111827] sm:text-xl">
            {destination.name}
          </h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="size-4 text-[#1D4ED8]" aria-hidden="true" />
            {location}
          </p>
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-slate-600">
          {destination.summary || "A curated Top7Spots travel idea ready for deeper discovery."}
        </p>
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs font-medium text-slate-500">
            {destination.duration || "Flexible"}
          </span>
          <Link
            href={href}
            className="flex items-center gap-1 rounded-full bg-[#0A2A66] px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:bg-[#1D4ED8] group-hover:translate-x-0.5"
          >
            Explore {destination.name}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
