"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { citySeoPages, citySeoPath } from "@/lib/programmatic-seo";

type DirectoryCity = {
  id: string;
  name: string;
  slug: string;
  country: string;
};

export type CityDirectoryGroup = {
  country: string;
  countryPath: string;
  cities: DirectoryCity[];
};

type CityDirectoryProps = {
  groups: CityDirectoryGroup[];
};

const visibleCityCount = 4;

export function CityDirectory({ groups }: CityDirectoryProps) {
  return (
    <div className="divide-y divide-slate-200">
      {groups.map((group) => (
        <CountryCityGroup key={group.country} group={group} />
      ))}
    </div>
  );
}

function CountryCityGroup({ group }: { group: CityDirectoryGroup }) {
  const extraCities = group.cities.slice(visibleCityCount);
  const hasExtraCities = extraCities.length > 0;
  const seoLinks = buildSeoLinks(group.cities);

  return (
    <details className="group py-4 first:pt-0 last:pb-0">
      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            <Link href={group.countryPath} className="transition hover:text-[#1D4ED8]">
              {group.country}
            </Link>
          </h3>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#1D4ED8] transition hover:text-[#0A2A66]">
          {hasExtraCities ? (
            <>
              <span className="group-open:hidden">Show more</span>
              <span className="hidden group-open:inline">Show less</span>
            </>
          ) : (
            <span>Open</span>
          )}
          <ChevronDown className="size-3.5 transition duration-300 group-open:rotate-180" aria-hidden="true" />
        </span>
      </summary>

      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1.5 text-sm leading-7 text-slate-500">
        {group.cities.slice(0, visibleCityCount).map((city, index) => (
          <CityTextLink
            key={city.id}
            city={city}
            showSeparator={index < Math.min(group.cities.length, visibleCityCount) - 1}
          />
        ))}
      </div>

      {hasExtraCities ? (
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-open:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1.5 text-sm leading-7 text-slate-500">
                {extraCities.map((city) => (
                  <CityTextLink key={city.id} city={city} showSeparator={false} />
                ))}
            </div>
          </div>
        </div>
      ) : null}

      {seoLinks.length > 0 ? (
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-open:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-3">
                {seoLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs font-semibold text-slate-500 underline-offset-4 transition hover:text-[#1D4ED8] hover:underline"
                  >
                    {link.label}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      ) : null}
    </details>
  );
}

function CityTextLink({
  city,
  showSeparator,
}: {
  city: DirectoryCity;
  showSeparator: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <Link href={`/${city.slug}`} className="font-semibold text-[#0A2A66] transition hover:text-[#1D4ED8]">
        {city.name}
      </Link>
      {showSeparator ? <span aria-hidden="true">/</span> : null}
    </span>
  );
}

function buildSeoLinks(cities: DirectoryCity[]) {
  return cities.slice(0, 3).map((city, index) => {
    const page = citySeoPages[index] || citySeoPages[0];

    return {
      href: citySeoPath(city.slug, page.slug),
      label: seoLinkLabel(city.name, page.slug),
    };
  });
}

function seoLinkLabel(cityName: string, pageSlug: string) {
  if (pageSlug === "best-places") {
    return `Best places in ${cityName}`;
  }

  if (pageSlug === "things-to-do") {
    return `Things to do in ${cityName}`;
  }

  return `${cityName} travel guide`;
}
