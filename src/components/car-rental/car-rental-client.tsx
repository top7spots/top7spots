"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CarRentalDirectoryGroup, CarRentalFaq } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DiscoverCarsWidget({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !code.trim()) {
      return;
    }

    container.innerHTML = "";
    const template = document.createElement("template");
    template.innerHTML = code;
    const script = template.content.querySelector("script[src]");
    const src = script?.getAttribute("src") || "";

    if (!script || !/^https:\/\/www\.discovercars\.com\/widget\.js/i.test(src)) {
      container.textContent = "";
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "relative z-50 min-h-[300px] w-full overflow-visible";
    const safeScript = document.createElement("script");

    for (const attribute of Array.from(script.attributes)) {
      if (
        attribute.name === "src" ||
        attribute.name === "id" ||
        attribute.name === "async" ||
        attribute.name.startsWith("data-")
      ) {
        safeScript.setAttribute(attribute.name, attribute.value);
      }
    }

    safeScript.async = true;
    wrapper.appendChild(safeScript);
    container.appendChild(wrapper);
  }, [code]);

  return <div ref={containerRef} className="relative z-50 min-h-[320px] w-full overflow-visible" />;
}

export function ReadMoreText({ preview, fullText, isRtl }: { preview: string; fullText: string; isRtl: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hasFullText = fullText.trim().length > 0;

  return (
    <div className="text-base leading-8 text-slate-600">
      {preview ? <p className="whitespace-pre-line">{preview}</p> : null}
      {hasFullText ? (
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200",
            expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <p className="mt-4 whitespace-pre-line">{fullText}</p>
          </div>
        </div>
      ) : null}
      {hasFullText ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-5 inline-flex rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-[#0A2A66] transition hover:bg-blue-100"
        >
          {expanded ? (isRtl ? "عرض أقل" : "Show less") : isRtl ? "اقرأ المزيد" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}

export function DirectoryTabs({ groups, isRtl }: { groups: CarRentalDirectoryGroup[]; isRtl: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeGroup = groups[activeIndex] || groups[0];

  if (!activeGroup) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={isRtl ? "دليل تأجير السيارات" : "Rental directory"}>
        {groups.map((group, index) => (
          <button
            key={group.title}
            type="button"
            role="tab"
            aria-selected={activeIndex === index}
            onClick={() => setActiveIndex(index)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              activeIndex === index
                ? "bg-[#0A2A66] text-white shadow-lg shadow-blue-950/15"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-[#0A2A66]",
            )}
          >
            {group.title}
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="tabpanel">
        {activeGroup.links.map((link) => (
          <a
            key={`${link.text}-${link.url}`}
            href={link.url}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-[#0A2A66] transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm"
          >
            {link.text}
          </a>
        ))}
      </div>
    </div>
  );
}

export function CarRentalFAQ({ faqs, isRtl }: { faqs: CarRentalFaq[]; isRtl: boolean }) {
  const sectionId = useId().replace(/:/g, "");
  const [openIndex, setOpenIndex] = useState(0);

  if (faqs.length === 0) {
    return null;
  }

  return (
    <div
      className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm"
      aria-label={isRtl ? "أسئلة شائعة" : "Frequently asked questions"}
    >
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        const buttonId = `${sectionId}-question-${index}`;
        const panelId = `${sectionId}-answer-${index}`;

        return (
          <div key={`${faq.question}-${index}`} className="px-5 sm:px-6">
            <button
              id={buttonId}
              type="button"
              className="flex w-full items-center justify-between gap-4 py-5 text-start text-base font-semibold text-[#111827] transition hover:text-[#0A2A66] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
            >
              <span>{faq.question}</span>
              <ChevronDown
                className={cn("size-5 shrink-0 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")}
                aria-hidden="true"
              />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="pb-5 text-sm leading-7 text-slate-600">{faq.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
