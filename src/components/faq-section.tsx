"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqSectionProps = {
  title: string;
  faqs?: FaqItem[] | null;
};

export function FaqSection({ title, faqs }: FaqSectionProps) {
  const sectionId = useId().replace(/:/g, "");
  const validFaqs = (faqs || []).filter((faq) => faq.question?.trim() && faq.answer?.trim());
  const [openIndex, setOpenIndex] = useState(0);

  if (validFaqs.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8" aria-labelledby={`${sectionId}-title`}>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563EB]">FAQs</p>
          <h2 id={`${sectionId}-title`} className="mt-2 text-2xl font-semibold tracking-tight text-[#111827]">
            {title}
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {validFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const buttonId = `${sectionId}-question-${index}`;
            const panelId = `${sectionId}-answer-${index}`;

            return (
              <div key={`${faq.question}-${index}`} className="px-5 sm:px-6">
                <button
                  id={buttonId}
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-4 text-left text-base font-semibold text-[#111827] transition hover:text-[#0A2A66] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
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
                    <p className="pb-5 text-sm leading-6 text-slate-600">{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
