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
    slug: "",
    excerpt: defaultExcerpt,
    seoTitle: defaultSeoTitle,
    seoDescription: defaultSeoDescription,
    coverImageAlt: defaultCoverImageAlt,
    coverImage: "",
    contentBlocks: "",
    legacyContent: "",
    legacyFaqs: "",
    status: "",
    hasCoverImageFile: false,
  });

  useEffect(() => {
    const readValues = () => {
      setValues({
        title: inputValue("title"),
        slug: inputValue("slug"),
        excerpt: inputValue("excerpt"),
        seoTitle: inputValue("seoTitle"),
        seoDescription: inputValue("seoDescription"),
        coverImageAlt: inputValue("coverImageAlt"),
        coverImage: inputValue("image"),
        contentBlocks: inputValue("contentBlocks"),
        legacyContent: inputValue("content"),
        legacyFaqs: inputValue("faqs"),
        status: inputValue("status"),
        hasCoverImageFile: hasFileInput("imageFile"),
      });
    };
    const names = [
      "title",
      "slug",
      "excerpt",
      "seoTitle",
      "seoDescription",
      "coverImageAlt",
      "image",
      "contentBlocks",
      "content",
      "faqs",
      "status",
    ] as const;
    const elements = names
      .map((name) => document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${name}"]`))
      .filter((element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement => Boolean(element));

    readValues();
    const interval = window.setInterval(readValues, 800);
    elements.forEach((element) => {
      element.addEventListener("input", readValues);
      element.addEventListener("change", readValues);
    });

    return () => {
      window.clearInterval(interval);
      elements.forEach((element) => {
        element.removeEventListener("input", readValues);
        element.removeEventListener("change", readValues);
      });
    };
  }, []);

  const previewTitle = values.seoTitle.trim() || values.title.trim() || "Guide title";
  const previewDescription = values.seoDescription.trim() || values.excerpt.trim() || "Guide summary";
  const parsedBlocks = useMemo(() => parseContentBlocks(values.contentBlocks), [values.contentBlocks]);
  const warnings = useMemo(() => seoWarnings(values), [values]);
  const checklist = useMemo(() => readinessChecklist(values, parsedBlocks), [values, parsedBlocks]);
  const quality = useMemo(() => qualityIndicators(values, parsedBlocks), [values, parsedBlocks]);
  const readyCount = checklist.filter((item) => item.ready).length;

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
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">Publish readiness</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {readyCount}/{checklist.length} checks look ready. These checks do not block saving.
            </p>
          </div>
          <span className={readyCount === checklist.length ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700" : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"}>
            {readyCount === checklist.length ? "Ready" : "Needs review"}
          </span>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {checklist.map((item) => (
            <div
              key={item.label}
              className={item.ready ? "rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-800" : "rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-800"}
            >
              <span className="font-semibold">{item.ready ? "Ready:" : "Review:"}</span> {item.label}
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-800">Guide quality indicators</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {quality.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
              <p className="mt-1 text-sm font-semibold text-[#0A2A66]">{item.value}</p>
            </div>
          ))}
        </div>
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
  return document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${name}"]`)?.value || "";
}

function hasFileInput(name: string) {
  return Boolean(document.querySelector<HTMLInputElement>(`input[type="file"][name="${name}"]`)?.files?.length);
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

type ParsedContentBlock = {
  type?: string;
  title?: string;
  body?: string;
  image?: string;
  imageAlt?: string;
  tips?: string[];
  faqs?: Array<{ question?: string; answer?: string }>;
  ctaLabel?: string;
  ctaHref?: string;
};

function parseContentBlocks(value: string): ParsedContentBlock[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.filter(isRecord) : [];
  } catch {
    return [];
  }
}

function readinessChecklist(values: {
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  coverImageAlt: string;
  coverImage: string;
  contentBlocks: string;
  legacyContent: string;
  legacyFaqs: string;
  status: string;
  hasCoverImageFile: boolean;
}, blocks: ParsedContentBlock[]) {
  const imageBlocks = blocks.filter((block) => block.image?.trim());
  const faqBlocks = blocks.filter((block) => block.type === "faq");
  const ctaBlocks = blocks.filter((block) => String(block.type || "").includes("cta"));
  const faqRows = faqBlocks.flatMap((block) => block.faqs || []);
  const hasAnyContent = blocks.length > 0 || Boolean(values.legacyContent.trim());

  return [
    { label: "Title present", ready: Boolean(values.title.trim()) },
    { label: "Slug present", ready: Boolean(values.slug.trim()) },
    { label: "Excerpt present", ready: Boolean(values.excerpt.trim()) },
    { label: "SEO title present", ready: Boolean(values.seoTitle.trim()) },
    { label: "SEO description present", ready: Boolean(values.seoDescription.trim()) },
    { label: "Cover image present", ready: Boolean(values.coverImage.trim() || values.hasCoverImageFile) },
    { label: "Cover image alt text present", ready: Boolean(values.coverImageAlt.trim()) },
    { label: "Content blocks or legacy content present", ready: hasAnyContent },
    {
      label: "Image blocks include alt text",
      ready: imageBlocks.every((block) => Boolean(block.imageAlt?.trim())),
    },
    {
      label: "FAQ questions and answers complete",
      ready: faqRows.every((faq) => Boolean(faq.question?.trim() && faq.answer?.trim())),
    },
    {
      label: "CTA button labels and URLs complete",
      ready: ctaBlocks.every((block) => {
        const hasLabel = Boolean(block.ctaLabel?.trim());
        const hasHref = Boolean(block.ctaHref?.trim());
        return hasLabel === hasHref;
      }),
    },
    { label: "Status selected", ready: values.status === "draft" || values.status === "published" },
  ];
}

function qualityIndicators(values: {
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  legacyContent: string;
  legacyFaqs: string;
}, blocks: ParsedContentBlock[]) {
  const text = [
    values.title,
    values.excerpt,
    values.legacyContent,
    ...blocks.flatMap((block) => [
      block.title,
      block.body,
      ...(block.tips || []),
      ...(block.faqs || []).flatMap((faq) => [faq.question, faq.answer]),
    ]),
  ]
    .filter(Boolean)
    .join(" ");
  const wordCount = countWords(text);
  const faqCount = blocks.reduce((total, block) => total + (block.faqs?.length || 0), 0) + legacyFaqCount(values.legacyFaqs);
  const links = countLinks(text, blocks);

  return [
    { label: "SEO title", value: `${values.seoTitle.trim().length}/60 chars` },
    { label: "Meta description", value: `${values.seoDescription.trim().length}/155 chars` },
    { label: "Words", value: wordCount.toLocaleString() },
    { label: "Read time", value: `${Math.max(1, Math.ceil(wordCount / 200))} min` },
    { label: "Content blocks", value: String(blocks.length) },
    { label: "FAQs", value: String(faqCount) },
    { label: "Internal links", value: String(links.internal) },
    { label: "External links", value: String(links.external) },
  ];
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function legacyFaqCount(value: string) {
  return (value.match(/(?:^|\n)\s*Question:/gi) || []).length;
}

function countLinks(text: string, blocks: ParsedContentBlock[]) {
  const hrefs = [
    ...Array.from(text.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)).map((match) => match[1]),
    ...blocks.map((block) => block.ctaHref || "").filter(Boolean),
  ];

  return hrefs.reduce(
    (total, href) => ({
      internal: total.internal + (href.startsWith("/") ? 1 : 0),
      external: total.external + (/^https?:\/\//i.test(href) ? 1 : 0),
    }),
    { internal: 0, external: 0 },
  );
}

function isRecord(value: unknown): value is ParsedContentBlock {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
