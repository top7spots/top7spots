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
    <div className="grid gap-4">
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
    <details className="group rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition duration-300 open:border-blue-200 open:shadow-md sm:px-5">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-[#111827]">
            <Link href={group.countryPath} className="transition hover:text-[#1D4ED8]">
              {group.country}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {group.cities.length} {group.cities.length === 1 ? "city" : "cities"} on Top7Spots
          </p>
        </div>
        <span className="mt-1 inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0A2A66] transition duration-300 group-hover:border-blue-200 group-hover:bg-blue-50">
          {hasExtraCities ? (
            <>
              <span className="group-open:hidden">Show more</span>
              <span className="hidden group-open:inline">Show less</span>
            </>
          ) : (
            <span>Open</span>
          )}
          <ChevronDown className="size-4 transition duration-300 group-open:rotate-180" aria-hidden="true" />
        </span>
      </summary>

      <div className="mt-4 flex flex-wrap gap-x-2 gap-y-2 text-sm leading-7 text-slate-500">
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
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {extraCities.map((city) => (
                  <Link
                    key={city.id}
                    href={`/${city.slug}`}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-[#0A2A66] transition hover:bg-blue-50 hover:text-[#1D4ED8]"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {seoLinks.length > 0 ? (
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-open:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Related travel pages
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {seoLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#0A2A66] transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#1D4ED8]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
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
