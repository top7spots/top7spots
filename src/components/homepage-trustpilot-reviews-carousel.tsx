"use client";

import { ChevronLeft, ChevronRight, ExternalLink, Star } from "lucide-react";
import { useRef } from "react";
import type { HomepageReview } from "@/lib/types";

type HomepageTrustpilotReviewsCarouselProps = {
  reviews: HomepageReview[];
};

function TrustpilotRating({ rating }: { rating: number }) {
  const ratingCount = Math.min(5, Math.max(1, Math.round(rating || 5)));

  return (
    <div className="flex items-center gap-1" aria-label={`${ratingCount} out of 5 star Trustpilot rating`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < ratingCount;

        return (
          <span
            key={index}
            className={`flex size-7 items-center justify-center rounded-[4px] ${
              filled ? "bg-[#00B67A] text-white" : "bg-slate-200 text-slate-400"
            }`}
          >
            <Star className="size-4 fill-current" aria-hidden="true" />
          </span>
        );
      })}
    </div>
  );
}

function ReviewCard({ review }: { review: HomepageReview }) {
  const source = review.source || "Trustpilot";
  const className =
    "group flex min-h-[330px] shrink-0 basis-[88%] snap-start flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/10 sm:basis-[48%] lg:basis-[31.5%]";
  const content = (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <TrustpilotRating rating={review.rating} />
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          {source}
        </span>
      </div>

      <p className="line-clamp-7 grow text-sm leading-7 text-slate-700">{review.reviewText}</p>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <p className="font-bold text-slate-950">{review.name}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 transition group-hover:text-emerald-700">
          Review from {source}
          {review.reviewUrl ? <ExternalLink className="size-3.5" aria-hidden="true" /> : null}
        </p>
      </div>
    </>
  );

  if (review.reviewUrl) {
    return (
      <a href={review.reviewUrl} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return <article className={className}>{content}</article>;
}

export function HomepageTrustpilotReviewsCarousel({ reviews }: HomepageTrustpilotReviewsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: "left" | "right") => {
    const node = scrollerRef.current;

    if (!node) {
      return;
    }

    node.scrollBy({
      left: direction === "left" ? -node.clientWidth * 0.85 : node.clientWidth * 0.85,
      behavior: "smooth",
    });
  };

  if (!reviews.length) {
    return null;
  }

  return (
    <div className="relative mt-10">
      <div className="mb-5 flex items-center justify-end gap-2">
        <button
          type="button"
          aria-label="Previous reviews"
          onClick={() => scroll("left")}
          className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label="Next reviews"
          onClick={() => scroll("right")}
          className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
