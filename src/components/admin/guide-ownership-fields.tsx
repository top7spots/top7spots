"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { City, Destination, GuideTargetType } from "@/lib/types";
import { slugify } from "@/lib/format";

type GuideOwnershipFieldsProps = {
  cities: City[];
  destinations: Destination[];
  defaultTargetType: GuideTargetType;
  defaultCountryId?: string;
  defaultCitySlug?: string;
  defaultDestinationId?: string;
};

export function GuideOwnershipFields({
  cities,
  destinations,
  defaultTargetType,
  defaultCountryId,
  defaultCitySlug,
  defaultDestinationId,
}: GuideOwnershipFieldsProps) {
  const [targetType, setTargetType] = useState<GuideTargetType>(defaultTargetType);
  const countries = useMemo(() => {
    const countryMap = new Map<string, { id: string; label: string }>();

    for (const city of cities) {
      if (!city.country) {
        continue;
      }

      const id = slugify(city.country);
      countryMap.set(id, { id, label: city.country });
    }

    return Array.from(countryMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [cities]);

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <span className="text-sm font-medium leading-none">Guide belongs to</span>
        <div className="flex flex-wrap gap-3">
          {guideTargetOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
            >
              <input
                name="targetType"
                type="radio"
                value={option.value}
                checked={targetType === option.value}
                onChange={() => setTargetType(option.value)}
                className="size-4 border-slate-300 text-[#1D4ED8]"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {targetType === "country" ? (
        <GuideSelect label="Country" name="countryId" defaultValue={defaultCountryId || countries[0]?.id || ""}>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.label}
            </option>
          ))}
        </GuideSelect>
      ) : null}

      {targetType === "city" ? (
        <GuideSelect label="City" name="citySlug" defaultValue={defaultCitySlug || cities[0]?.slug || "muscat"}>
          {cities.map((city) => (
            <option key={city.id} value={city.slug}>
              {city.name}, {city.country}
            </option>
          ))}
        </GuideSelect>
      ) : null}

      {targetType === "destination" ? (
        <GuideSelect
          label="Destination"
          name="destinationId"
          defaultValue={defaultDestinationId || destinations[0]?.id || ""}
        >
          {destinations.map((destination) => (
            <option key={destination.id} value={destination.id}>
              {destination.name}
              {destination.city ? `, ${destination.city}` : ""}
            </option>
          ))}
        </GuideSelect>
      ) : null}
    </div>
  );
}

const guideTargetOptions: Array<{ value: GuideTargetType; label: string }> = [
  { value: "country", label: "Country" },
  { value: "city", label: "City" },
  { value: "destination", label: "Destination" },
];

function GuideSelect({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  );
}
