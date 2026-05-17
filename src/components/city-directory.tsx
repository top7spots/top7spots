import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

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

export function CityDirectory({ groups }: CityDirectoryProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {groups.map((group) => (
        <CountryCard key={group.country} group={group} />
      ))}
    </div>
  );
}

function CountryCard({ group }: { group: CityDirectoryGroup }) {
  const cityCountLabel = `${group.cities.length} ${group.cities.length === 1 ? "city" : "cities"}`;

  return (
    <details className="group rounded-[14px] border border-slate-200 bg-white shadow-sm transition duration-300 open:border-blue-200 open:shadow-lg open:shadow-slate-950/5 hover:border-blue-200">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight text-[#111827] transition group-hover:text-[#1D4ED8]">
            {group.country}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{cityCountLabel}</p>
        </div>
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#F8FAFC] text-[#0A2A66] transition duration-300 group-open:rotate-180 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-[#1D4ED8]">
          <ChevronDown className="size-4" aria-hidden="true" />
        </span>
      </summary>

      <div className="border-t border-slate-100 px-4 pb-4 pt-3">
        <div className="flex flex-wrap gap-x-2 gap-y-1.5 text-sm leading-7 text-slate-500">
          {group.cities.map((city, index) => (
            <span key={city.id} className="inline-flex items-center gap-2">
              <Link href={`/${city.slug}`} className="font-semibold text-[#0A2A66] transition hover:text-[#1D4ED8]">
                {city.name}
              </Link>
              {index < group.cities.length - 1 ? <span aria-hidden="true">/</span> : null}
            </span>
          ))}
        </div>

        <Link
          href={group.countryPath}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] underline-offset-4 transition hover:text-[#0A2A66] hover:underline"
        >
          View country guide
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </details>
  );
}
