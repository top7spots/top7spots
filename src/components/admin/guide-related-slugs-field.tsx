"use client";

import { useMemo, useState } from "react";

type RelatedOption = {
  slug: string;
  label: string;
  meta?: string;
};

type GuideRelatedSlugsFieldProps = {
  defaultGuideSlugs?: string[];
  defaultPlaceSlugs?: string[];
  guideOptions: RelatedOption[];
  placeOptions: RelatedOption[];
};

export function GuideRelatedSlugsField({
  defaultGuideSlugs = [],
  defaultPlaceSlugs = [],
  guideOptions,
  placeOptions,
}: GuideRelatedSlugsFieldProps) {
  const [guideSlugs, setGuideSlugs] = useState(() => uniqueValues(defaultGuideSlugs));
  const [placeSlugs, setPlaceSlugs] = useState(() => uniqueValues(defaultPlaceSlugs));

  return (
    <div className="grid gap-5">
      <RelatedPicker
        title="Related guides"
        name="relatedGuideSlugs"
        selectedSlugs={guideSlugs}
        options={guideOptions}
        onChange={setGuideSlugs}
      />
      <RelatedPicker
        title="Related places"
        name="relatedPlaceSlugs"
        selectedSlugs={placeSlugs}
        options={placeOptions}
        onChange={setPlaceSlugs}
      />
    </div>
  );
}

function RelatedPicker({
  title,
  name,
  selectedSlugs,
  options,
  onChange,
}: {
  title: string;
  name: string;
  selectedSlugs: string[];
  options: RelatedOption[];
  onChange: (slugs: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selectedSlugs), [selectedSlugs]);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options.slice(0, 40);
    }

    return options
      .filter((option) =>
        [option.label, option.slug, option.meta].some((value) => value?.toLowerCase().includes(normalizedQuery)),
      )
      .slice(0, 40);
  }, [options, query]);
  const selectedOptions = selectedSlugs
    .map((slug) => options.find((option) => option.slug === slug))
    .filter((option): option is RelatedOption => Boolean(option));
  const manualValue = selectedSlugs.join(", ");

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <input type="hidden" name={name} value={manualValue} />
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Select from existing records.
        </p>
      </div>
      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <button
              key={option.slug}
              type="button"
              className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-[#0A2A66] transition hover:border-red-200 hover:text-red-600"
              onClick={() => onChange(selectedSlugs.filter((slug) => slug !== option.slug))}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-500">
          No {title.toLowerCase()} selected yet.
        </p>
      )}
      <label className="grid gap-2">
        <span className="text-xs font-semibold text-slate-600">Search records</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${title.toLowerCase()}...`}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
        />
      </label>
      <div className="grid max-h-64 gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-2">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => {
            const checked = selectedSet.has(option.slug);

            return (
              <label key={option.slug} className="flex gap-3 rounded-lg border border-slate-100 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(checked ? selectedSlugs.filter((slug) => slug !== option.slug) : uniqueValues([...selectedSlugs, option.slug]))
                  }
                  className="mt-1"
                />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-800">{option.label}</span>
                  <span className="mt-1 block truncate text-xs text-slate-500">{option.meta || option.slug}</span>
                </span>
              </label>
            );
          })
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            No matching records found.
          </p>
        )}
      </div>
    </div>
  );
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
