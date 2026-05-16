import Image from "next/image";
import { Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { resolveImagePath } from "@/lib/images";
import type { Attraction } from "@/lib/types";

type AttractionCardProps = {
  attraction: Attraction;
};

export function AttractionCard({ attraction }: AttractionCardProps) {
  const image = resolveImagePath(attraction.image);
  const imageAlt = `${attraction.name}${attraction.city ? ` in ${attraction.city}` : ""}${
    attraction.type ? ` ${attraction.type.toLowerCase()}` : " attraction"
  }`;

  return (
    <Card className="group overflow-hidden rounded-xl border-slate-200 bg-white p-0 shadow-[0_18px_50px_rgb(15_23_42_/_8%)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_80px_rgb(15_23_42_/_16%)]">
      <div className="relative aspect-[16/11] overflow-hidden bg-slate-100">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
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
        <h3 className="text-lg font-semibold leading-tight text-[#111827]">{attraction.name}</h3>
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
