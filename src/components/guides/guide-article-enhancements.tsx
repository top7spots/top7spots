"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ListTree, X } from "lucide-react";

export type GuideTocItem = {
  id: string;
  title: string;
  level: 2 | 3;
};

export type GuideFaqItem = {
  question: string;
  answer: string;
};

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const nextProgress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
        setProgress(Math.min(100, Math.max(0, nextProgress)));
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent" aria-hidden="true">
      <div className="h-full bg-[#1D4ED8] transition-[width] duration-150 ease-out" style={{ width: `${progress}%` }} />
    </div>
  );
}

export function GuideArticleToc({ items }: { items: GuideTocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id || "");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      return undefined;
    }

    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((heading): heading is HTMLElement => Boolean(heading));

    if (headings.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visibleEntry?.target.id) {
          setActiveId(visibleEntry.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0, 1],
      },
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <aside className="hidden xl:block">
        <div className="sticky top-32 rounded-[1.35rem] border border-orange-100 bg-white/88 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#FF6B00]">In this guide</p>
          <TocLinks items={items} activeId={activeId} onSelect={() => undefined} className="mt-3" />
        </div>
      </aside>

      <details className="mb-6 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm xl:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#111827] [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <ListTree className="size-4 text-[#FF6B00]" aria-hidden="true" />
            In this guide
          </span>
          <ChevronDown className="size-4 text-slate-500" aria-hidden="true" />
        </summary>
        <TocLinks items={items} activeId={activeId} onSelect={() => undefined} className="mt-4" />
      </details>

      <button
        type="button"
        className="fixed bottom-5 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#0A2A66] px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-950/20 transition hover:bg-[#123A7A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] xl:hidden"
        aria-label="Open table of contents"
        onClick={() => setMobileOpen(true)}
      >
        <ListTree className="size-4" aria-hidden="true" />
        Jump
      </button>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/40 p-4 backdrop-blur-sm xl:hidden" role="dialog" aria-modal="true" aria-label="Jump to section">
          <div className="ml-auto flex max-h-[80vh] max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <p className="text-sm font-semibold text-[#111827]">In this guide</p>
              <button
                type="button"
                className="rounded-full p-2 text-slate-500 transition hover:bg-orange-50 hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                aria-label="Close table of contents"
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <TocLinks items={items} activeId={activeId} onSelect={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function TocLinks({
  items,
  activeId,
  onSelect,
  className = "",
}: {
  items: GuideTocItem[];
  activeId: string;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <nav aria-label="Guide sections" className={`grid gap-1 ${className}`}>
      {items.map((item) => {
        const active = activeId === item.id;

        return (
          <Link
            key={item.id}
            href={`#${item.id}`}
            onClick={(event) => {
              event.preventDefault();
              document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              window.history.pushState(null, "", `#${item.id}`);
              onSelect();
            }}
            className={`rounded-xl px-3 py-2 text-sm font-semibold leading-5 transition ${
              item.level === 3 ? "ml-3 text-xs" : ""
            } ${
              active
                ? "bg-orange-50 text-[#C24A00]"
                : "text-slate-600 hover:bg-orange-50/70 hover:text-[#111827]"
            }`}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

export function GuideFaqAccordion({ faqs }: { faqs: GuideFaqItem[] }) {
  const [openQuestion, setOpenQuestion] = useState(faqs[0]?.question || "");
  const validFaqs = useMemo(
    () => faqs.filter((faq) => faq.question.trim() && faq.answer.trim()),
    [faqs],
  );

  if (validFaqs.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm md:p-10" aria-labelledby="guide-faq-heading">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#FF6B00]">FAQs</p>
      <h2 id="guide-faq-heading" className="mt-3 text-3xl font-semibold tracking-tight text-[#111827]">
        Common questions
      </h2>
      <div className="mt-6 grid gap-3">
        {validFaqs.map((faq, index) => {
          const open = openQuestion === faq.question;
          const answerId = `guide-faq-answer-${index}`;

          return (
            <div key={faq.question} className="rounded-2xl border border-slate-200 bg-[#FCFBF8]">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold leading-7 text-[#111827] transition hover:text-[#C24A00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF6B00]"
                aria-expanded={open}
                aria-controls={answerId}
                onClick={() => setOpenQuestion(open ? "" : faq.question)}
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`size-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              <div
                id={answerId}
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-7 text-slate-600">{faq.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
