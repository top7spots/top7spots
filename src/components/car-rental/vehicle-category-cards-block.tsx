import Link from "next/link";
import { Car } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { getPublishedCarRentalPage } from "@/lib/data";
import { getDefaultCarRentalPath, globalCarRentalSlug } from "@/lib/car-rental-pages";
import { resolveImagePath } from "@/lib/images";
import type { CarRentalVehicleCategoryCard } from "@/lib/types";
import { cn } from "@/lib/utils";

type VehicleCategoryCardsBlockProps = {
  title: string;
  subtitle: string;
  label?: string;
  variant?: "full" | "compact";
  className?: string;
};

export async function VehicleCategoryCardsBlock({
  title,
  subtitle,
  label = "CAR RENTAL",
  variant = "full",
  className,
}: VehicleCategoryCardsBlockProps) {
  const page = await getPublishedCarRentalPage("en", globalCarRentalSlug);
  const cards = page?.vehicleCategoryCards
    .filter((card) => card.title && card.visible !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (!cards || cards.length === 0) {
    return null;
  }

  const isCompact = variant === "compact";

  return (
    <section
      className={cn(
        isCompact
          ? "mx-auto max-w-3xl px-0 py-8"
          : "mx-auto max-w-[88rem] px-4 py-10 sm:px-6 lg:px-8",
        className,
      )}
      aria-label={title}
    >
      <div
        className={cn(
          "overflow-hidden border border-slate-200 bg-white shadow-[0_18px_50px_rgb(15_23_42_/_7%)]",
          isCompact ? "rounded-[1.35rem] p-4 sm:p-5" : "rounded-2xl p-5 sm:p-7 lg:p-8",
        )}
      >
        <div className={cn("flex flex-col gap-3", !isCompact && "md:flex-row md:items-end md:justify-between")}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">{label}</p>
            <h2 className={cn("mt-2 font-semibold tracking-tight text-[#111827]", isCompact ? "text-2xl" : "text-3xl md:text-4xl")}>
              {title}
            </h2>
            <p className={cn("mt-3 max-w-2xl leading-7 text-slate-600", isCompact ? "text-sm" : "text-base")}>
              {subtitle}
            </p>
          </div>
          {!isCompact ? (
            <Link
              href={getDefaultCarRentalPath()}
              className="inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-[#0A2A66] transition hover:bg-blue-100"
            >
              Compare cars
            </Link>
          ) : null}
        </div>

        <div className={cn("mt-5 grid gap-3", isCompact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-5")}>
          {cards.map((card, index) => (
            <VehicleCategoryCard key={`${card.title}-${index}`} card={card} compact={isCompact} />
          ))}
        </div>
      </div>
    </section>
  );
}

function VehicleCategoryCard({ card, compact }: { card: CarRentalVehicleCategoryCard; compact: boolean }) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md">
      <div className={cn("relative bg-slate-100", compact ? "h-28" : "h-32")}>
        {card.image ? (
          <SafeImage
            src={resolveImagePath(card.image)}
            alt={card.title}
            fill
            sizes={compact ? "(max-width: 640px) 100vw, 320px" : "(max-width: 640px) 100vw, 260px"}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 text-[#1D4ED8]">
            <Car className={cn(compact ? "size-8" : "size-10")} aria-hidden="true" />
          </div>
        )}
      </div>
      <div className={cn("grid gap-3", compact ? "p-3" : "p-4")}>
        <div>
          <h3 className={cn("font-semibold tracking-tight text-[#111827]", compact ? "text-base" : "text-lg")}>
            {card.title}
          </h3>
          {card.startingPrice ? (
            <p className="mt-1 text-sm font-semibold text-[#FF6B00]">{card.startingPrice}</p>
          ) : null}
        </div>
        <Link
          href={getDefaultCarRentalPath()}
          className="inline-flex items-center justify-center rounded-full bg-[#0A2A66] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
        >
          {card.buttonText || "Find Available Cars"}
        </Link>
      </div>
    </article>
  );
}
