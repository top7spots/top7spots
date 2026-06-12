"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Calendar, CheckCircle2, ChevronDown, Info, ListTree, MapPinned } from "lucide-react";
import { GuideFaqAccordion, type GuideFaqItem } from "@/components/guides/guide-article-enhancements";

type DestinationArticleContentProps = {
  bestSeason: string;
  description: string;
  destinationName: string;
  faqs: GuideFaqItem[];
  highlights: string[];
  howToGo: string;
  practicalInfo: string[];
  carRentalBlock?: ReactNode;
  travelTips: string[];
};

type TocItem = {
  id: string;
  title: string;
};

const descriptionWordLimit = 420;
const descriptionParagraphLimit = 3;

export function DestinationArticleContent({
  bestSeason,
  description,
  destinationName,
  faqs,
  highlights,
  howToGo,
  practicalInfo,
  carRentalBlock,
  travelTips,
}: DestinationArticleContentProps) {
  const descriptionParagraphs = splitParagraphs(
    description ||
      "Top7Spots curates every destination as a practical travel idea, with enough context to help you decide how it fits your route.",
  );
  const validFaqs = faqs.filter((faq) => faq.question?.trim() && faq.answer?.trim());
  const visibleHighlights =
    highlights.length > 0 ? highlights : ["Signature views", "Local character", "Flexible route planning"];
  const tocItems = useMemo(
    () =>
      [
        { id: "overview", title: "Overview" },
        { id: "highlights", title: "Highlights" },
        howToGo.trim() ? { id: "how-to-go", title: "How to Go" } : undefined,
        practicalInfo.length > 0 ? { id: "practical-info", title: "Practical Info" } : undefined,
        bestSeason.trim() ? { id: "best-time", title: "Best Time to Visit" } : undefined,
        travelTips.length > 0 ? { id: "travel-tips", title: "Travel Tips" } : undefined,
        validFaqs.length > 0 ? { id: "faq", title: "FAQ" } : undefined,
      ].filter((item): item is TocItem => Boolean(item)),
    [bestSeason, howToGo, practicalInfo.length, travelTips.length, validFaqs.length],
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        <DestinationToc items={tocItems} />
        <article className="min-w-0">
          <div className="mx-auto max-w-3xl">
            <section id="overview" className="scroll-mt-28">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#FF6B00]">Overview</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827] md:text-4xl">
                Why visit {destinationName}
              </h2>
              <DestinationDescription paragraphs={descriptionParagraphs} />
            </section>

            <section id="highlights" className="mt-12 scroll-mt-28">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">Highlights</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827]">What stands out</h2>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {visibleHighlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="max-w-full rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-semibold leading-6 text-slate-700 shadow-sm"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </section>

            {howToGo.trim() ? (
              <ArticleSection
                id="how-to-go"
                eyebrow="Getting there"
                title="How to Go"
                icon={<MapPinned className="size-5" aria-hidden="true" />}
              >
                <div className="space-y-4">
                  {splitParagraphs(howToGo).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </ArticleSection>
            ) : null}

            {practicalInfo.length > 0 ? (
              <ArticleSection
                id="practical-info"
                eyebrow="Before you go"
                title="Practical Info"
                icon={<Info className="size-5" aria-hidden="true" />}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {practicalInfo.map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm ring-1 ring-slate-100">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </ArticleSection>
            ) : null}

            {bestSeason.trim() ? (
              <ArticleSection
                id="best-time"
                eyebrow="Seasonality"
                title="Best Time to Visit"
                icon={<Calendar className="size-5" aria-hidden="true" />}
              >
                <p>{bestSeason}</p>
              </ArticleSection>
            ) : null}

            {travelTips.length > 0 ? (
              <ArticleSection id="travel-tips" eyebrow="On the ground" title="Travel Tips">
                <ul className="grid gap-3">
                  {travelTips.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-3 size-1.5 shrink-0 rounded-full bg-[#FF6B00]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </ArticleSection>
            ) : null}

            {carRentalBlock}

            {validFaqs.length > 0 ? (
              <div id="faq" className="scroll-mt-28">
                <GuideFaqAccordion faqs={validFaqs} />
              </div>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}

function DestinationToc({ items }: { items: TocItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
        <div className="rounded-[1.35rem] border border-orange-100 bg-white/88 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#FF6B00]">In this destination</p>
          <TocLinks items={items} className="mt-3" />
        </div>
      </aside>

      <details className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#111827] [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <ListTree className="size-4 text-[#FF6B00]" aria-hidden="true" />
            In this destination
          </span>
          <ChevronDown className="size-4 text-slate-500" aria-hidden="true" />
        </summary>
        <TocLinks items={items} className="mt-4" />
      </details>
    </>
  );
}

function TocLinks({ items, className = "" }: { items: TocItem[]; className?: string }) {
  return (
    <nav aria-label="Destination sections" className={`grid gap-1 ${className}`}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`#${item.id}`}
          className="rounded-xl px-3 py-2 text-sm font-semibold leading-5 text-slate-600 transition hover:bg-orange-50/70 hover:text-[#111827]"
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}

function DestinationDescription({ paragraphs }: { paragraphs: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const wordCount = paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  const shouldCollapse = paragraphs.length > descriptionParagraphLimit || wordCount > descriptionWordLimit;

  return (
    <div className="mt-6">
      <div
        className={`relative space-y-5 text-lg leading-9 text-slate-700 ${
          shouldCollapse && !expanded ? "max-h-[34rem] overflow-hidden" : ""
        }`}
      >
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {shouldCollapse && !expanded ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#F8FAFC] to-transparent" />
        ) : null}
      </div>
      {shouldCollapse ? (
        <button
          type="button"
          className="mt-5 rounded-full border border-orange-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#C24A00] shadow-sm transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}

function ArticleSection({
  children,
  eyebrow,
  icon,
  id,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  icon?: ReactNode;
  id: string;
  title: string;
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-28">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#FF6B00]">{eyebrow}</p>
      <div className="mt-3 flex items-center gap-2 text-[#1D4ED8]">
        {icon}
        <h2 className="text-3xl font-semibold tracking-tight text-[#111827]">{title}</h2>
      </div>
      <div className="mt-5 text-base leading-8 text-slate-700">{children}</div>
    </section>
  );
}

function splitParagraphs(text: string) {
  return text
    .split(/\r?\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
