"use client";

import { useEffect, useMemo, useState } from "react";

type GuideSeoPreviewPanelProps = {
  canonicalPath: string;
  defaultTitle?: string;
  defaultExcerpt?: string;
  defaultSeoTitle?: string;
  defaultSeoDescription?: string;
  defaultCoverImageAlt?: string;
};

const siteUrl = "https://www.top7spots.com";

export function GuideSeoPreviewPanel({
  canonicalPath,
  defaultTitle = "",
  defaultExcerpt = "",
  defaultSeoTitle = "",
  defaultSeoDescription = "",
  defaultCoverImageAlt = "",
}: GuideSeoPreviewPanelProps) {
  const [values, setValues] = useState({
    title: defaultTitle,
    excerpt: defaultExcerpt,
    seoTitle: defaultSeoTitle,
    seoDescription: defaultSeoDescription,
    coverImageAlt: defaultCoverImageAlt,
  });

  useEffect(() => {
    const names = ["title", "excerpt", "seoTitle", "seoDescription", "coverImageAlt"] as const;
    const readValues = () => {
      setValues({
        title: inputValue("title"),
        excerpt: inputValue("excerpt"),
        seoTitle: inputValue("seoTitle"),
        seoDescription: inputValue("seoDescription"),
        coverImageAlt: inputValue("coverImageAlt"),
      });
    };
    const elements = names
      .map((name) => document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`))
      .filter((element): element is HTMLInputElement | HTMLTextAreaElement => Boolean(element));

    readValues();
    elements.forEach((element) => {
      element.addEventListener("input", readValues);
      element.addEventListener("change", readValues);
    });

    return () => {
      elements.forEach((element) => {
        element.removeEventListener("input", readValues);
        element.removeEventListener("change", readValues);
      });
    };
  }, []);

  const previewTitle = values.seoTitle.trim() || values.title.trim() || "Guide title";
  const previewDescription = values.seoDescription.trim() || values.excerpt.trim() || "Guide summary";
  const warnings = useMemo(() => seoWarnings(values), [values]);

  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-800">Search preview</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          This mirrors the guide title, meta description, and canonical path used by the public guide route.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="truncate text-xs text-emerald-700">{siteUrl}{canonicalPath}</p>
        <p className="mt-1 line-clamp-2 text-xl font-medium leading-6 text-[#1a0dab]">{previewTitle}</p>
        <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">{previewDescription}</p>
      </div>
      <div className="grid gap-2 text-xs">
        <LengthMeter label="SEO title" value={values.seoTitle} fallback={values.title} ideal={60} />
        <LengthMeter label="Meta description" value={values.seoDescription} fallback={values.excerpt} ideal={155} />
      </div>
      {warnings.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">SEO checks</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          SEO basics look ready.
        </p>
      )}
    </div>
  );
}

function inputValue(name: string) {
  return document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)?.value || "";
}

function LengthMeter({
  label,
  value,
  fallback,
  ideal,
}: {
  label: string;
  value: string;
  fallback: string;
  ideal: number;
}) {
  const current = value.trim() || fallback.trim();
  const tooLong = current.length > ideal;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <span className="font-semibold text-slate-600">{label}</span>
      <span className={tooLong ? "font-semibold text-amber-700" : "text-slate-500"}>
        {current.length}/{ideal} chars
      </span>
    </div>
  );
}

function seoWarnings(values: {
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  coverImageAlt: string;
}) {
  const warnings: string[] = [];
  const seoTitle = values.seoTitle.trim();
  const seoDescription = values.seoDescription.trim();

  if (!seoTitle) warnings.push("Add a dedicated SEO title.");
  if (seoTitle.length > 60) warnings.push("SEO title is longer than 60 characters.");
  if (!seoDescription) warnings.push("Add a meta description.");
  if (seoDescription.length > 155) warnings.push("Meta description is longer than 155 characters.");
  if (!values.excerpt.trim()) warnings.push("Add an excerpt for cards and fallback descriptions.");
  if (!values.coverImageAlt.trim()) warnings.push("Add cover image alt text.");

  return warnings;
}
