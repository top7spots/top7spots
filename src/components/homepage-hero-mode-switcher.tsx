"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Car, Search, Sparkles } from "lucide-react";
import { SearchBox } from "@/components/search-box";
import { cn } from "@/lib/utils";

type HomepageHeroModeSwitcherProps = {
  featuredCityCount: number;
};

const stats = [
  ["Global", "travel scope"],
  ["Curated", "travel ideas"],
] as const;

export function HomepageHeroModeSwitcher({ featuredCityCount }: HomepageHeroModeSwitcherProps) {
  return (
    <div className="mt-8 max-w-3xl">
      <div
        className="inline-flex rounded-full border border-white/15 bg-white/10 p-1 text-sm font-semibold text-blue-50 backdrop-blur"
        aria-label="Hero actions"
      >
        <ModeLink
          active
          href="#featured-cities"
          icon={<Search className="size-4" aria-hidden="true" />}
          label="Explore Places"
        />
        <ModeLink
          href="/carrental"
          icon={<Car className="size-4" aria-hidden="true" />}
          label="Rent a Car"
        />
      </div>

      <div className="block" aria-label="Explore Places">
        <div className="relative z-30 mt-4 flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/95 p-2 shadow-2xl shadow-blue-950/30 backdrop-blur sm:flex-row">
          <SearchBox
            containerClassName="relative z-40 min-w-0 flex-1"
            inputClassName="h-12 w-full rounded-xl border border-transparent bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
            dropdownClassName="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[100] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-blue-950/20"
            iconClassName="text-slate-400"
            placeholder="Search cities, countries, beaches, mountains..."
          />
          <Link
            href="#featured-cities"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[#C2410C] px-6 text-sm font-semibold text-white shadow-lg shadow-orange-950/15 transition duration-300 hover:-translate-y-0.5 hover:bg-[#9A3412]"
          >
            Explore Cities
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="#featured-cities"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0A2A66] shadow-lg shadow-blue-950/15 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-50"
          >
            Explore Cities
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="#top-destinations"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition duration-300 hover:-translate-y-0.5 hover:bg-white/15"
          >
            Top Destinations
            <Sparkles className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="relative z-0 mt-8 grid max-w-2xl grid-cols-3 gap-3">
          {[[String(featuredCityCount), "featured cities"], ...stats].map(([value, label]) => (
            <div key={label} className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-semibold">{value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-blue-100">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModeLink({
  active = false,
  href,
  icon,
  label,
}: {
  active?: boolean;
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-200",
        active
          ? "bg-white text-[#0A2A66] shadow-sm"
          : "text-blue-50 hover:bg-white/10 hover:text-white",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
