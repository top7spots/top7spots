import { Calendar, Clock, MapPin, ShieldCheck, Sparkles, Star } from "lucide-react";
import { DestinationImageSlider } from "@/components/destination-image-slider";
import { Badge } from "@/components/ui/badge";

type DestinationDetailHeroProps = {
  bestSeason: string;
  category: string;
  destinationName: string;
  duration: string;
  images: string[];
  location: string;
  publishedDate: string;
  snapshotLabel: string;
  summary: string;
  updatedDate: string;
};

export function DestinationDetailHero({
  bestSeason,
  category,
  destinationName,
  duration,
  images,
  location,
  publishedDate,
  snapshotLabel,
  summary,
  updatedDate,
}: DestinationDetailHeroProps) {
  const dateItems = [
    publishedDate ? { label: "Published", value: publishedDate } : undefined,
    updatedDate ? { label: "Updated", value: updatedDate } : undefined,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)] lg:items-center">
      <DestinationImageSlider destinationName={destinationName} images={images} />

      <div className="lg:py-2">
        <Badge className="rounded-full bg-orange-50 px-3 py-1 text-[#FF6B00] hover:bg-orange-50">
          {category}
        </Badge>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#111827] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05]">
          {destinationName}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{summary}</p>

        {dateItems.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
            {dateItems.map((item) => (
              <span key={item.label} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                {item.label}: <span className="text-[#111827]">{item.value}</span>
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2">
            <MapPin className="size-3.5 text-[#1D4ED8]" aria-hidden="true" />
            {location}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2">
            <Clock className="size-3.5 text-[#1D4ED8]" aria-hidden="true" />
            {duration}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-2 text-[#B54708]">
            <Star className="size-3.5 fill-[#FF6B00] text-[#FF6B00]" aria-hidden="true" />
            Top7Spots pick
          </span>
        </div>

        <aside className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-sm font-semibold text-[#0A2A66]">Trip snapshot</p>
          <div className="mt-3 grid gap-2.5 text-sm text-slate-600">
            <span className="flex items-center gap-2.5">
              <Calendar className="size-4 shrink-0 text-[#1D4ED8]" aria-hidden="true" />
              Best time: {bestSeason}
            </span>
            <span className="flex items-center gap-2.5">
              <Sparkles className="size-4 shrink-0 text-[#FF6B00]" aria-hidden="true" />
              {snapshotLabel}
            </span>
            <span className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 shrink-0 text-[#1D4ED8]" aria-hidden="true" />
              Practical tips included
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
