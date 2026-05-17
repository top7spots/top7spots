import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
    <Link
      href={group.countryPath}
      className="group rounded-[14px] border border-slate-200 bg-white px-4 py-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-950/5"
    >
      <article className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight text-[#111827] transition group-hover:text-[#1D4ED8]">
            {group.country}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{cityCountLabel}</p>
        </div>
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#F8FAFC] text-[#0A2A66] transition duration-300 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-[#1D4ED8]">
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </article>
    </Link>
  );
}
