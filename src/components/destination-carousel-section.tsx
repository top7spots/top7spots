import Link from "next/link";
import { MapPin } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { getCanonicalDestinationPath } from "@/lib/city-intelligence";
import { destinationImageAlt } from "@/lib/image-seo";
import { resolveImagePath } from "@/lib/images";
import type { Destination } from "@/lib/types";

type DestinationCarouselSectionProps = {
  title: string;
  description: string;
  destinations: Destination[];
};

export function DestinationCarouselSection({
  title,
  description,
  destinations,
}: DestinationCarouselSectionProps) {
  if (destinations.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8" aria-labelledby="destination-carousel-title">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
            Related destinations
          </p>
          <h2 id="destination-carousel-title" className="text-2xl font-semibold tracking-tight text-[#111827] md:text-3xl">
            {title}
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-3 [scrollbar-width:thin] sm:mx-0 sm:px-0"
        aria-label={title}
        tabIndex={0}
      >
        {destinations.map((destination) => (
          <CompactDestinationCarouselCard key={destination.id} destination={destination} />
        ))}
      </div>
    </section>
  );
}

function CompactDestinationCarouselCard({ destination }: { destination: Destination }) {
  const image = resolveImagePath(destination.image);
  const category = destination.category || "Travel spot";
  const href = getCanonicalDestinationPath(destination);
  const location =
    [destination.location, destination.city].filter(Boolean).join(", ") ||
    [destination.city, destination.region].filter(Boolean).join(", ") ||
    "Top7Spots";
  const imageAlt = destination.imageAlt || destinationImageAlt(destination);

  return (
    <Link
      href={href}
      className="group flex h-[274px] w-[76vw] min-w-[238px] max-w-[312px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_38px_rgb(15_23_42_/_7%)] outline-none transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgb(15_23_42_/_13%)] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 sm:w-[292px] lg:w-[300px]"
    >
      <div className="relative h-36 overflow-hidden bg-slate-100">
        <SafeImage
          src={image}
          alt={imageAlt}
          fill
          sizes="(max-width: 639px) 76vw, 300px"
          quality={65}
          loading="lazy"
          className="object-cover transition duration-500 ease-out group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#0A2A66] shadow-sm backdrop-blur">
          {category}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[#111827]">
            {destination.name}
          </h3>
          <p className="mt-2 flex items-start gap-1.5 text-sm leading-5 text-slate-500">
            <MapPin className="mt-0.5 size-4 shrink-0 text-[#1D4ED8]" aria-hidden="true" />
            <span className="line-clamp-2">{location}</span>
          </p>
        </div>
        <span className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#FF6B00]">
          Explore spot
        </span>
      </div>
    </Link>
  );
}
