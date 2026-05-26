"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useRef } from "react";

type GuideCarouselScrollerProps = {
  children: ReactNode;
};

export function GuideCarouselScroller({ children }: GuideCarouselScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: -1 | 1) {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    const card = scroller.querySelector<HTMLElement>("a[href]");
    const distance = card ? card.getBoundingClientRect().width + 20 : scroller.clientWidth * 0.85;

    scroller.scrollBy({
      left: distance * direction,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      <div className="mb-4 flex justify-end gap-2 sm:absolute sm:-top-14 sm:right-0 sm:mb-0">
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          aria-label="Scroll to previous guides"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          aria-label="Scroll to next guides"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div
        ref={scrollerRef}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto scroll-smooth px-4 pb-7 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}
