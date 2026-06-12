"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type TouchEvent } from "react";
import { SafeImage } from "@/components/safe-image";

type DestinationImageSliderProps = {
  destinationName: string;
  images: string[];
};

const minimumSwipeDistance = 45;

export function DestinationImageSlider({ destinationName, images }: DestinationImageSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const activeImage = images[activeIndex];
  const hasMultipleImages = images.length > 1;

  function showPreviousImage() {
    setActiveIndex((index) => (index === 0 ? images.length - 1 : index - 1));
  }

  function showNextImage() {
    setActiveIndex((index) => (index === images.length - 1 ? 0 : index + 1));
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    setTouchStart(event.touches[0]?.clientX ?? null);
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStart === null) {
      return;
    }

    const distance = touchStart - (event.changedTouches[0]?.clientX ?? touchStart);

    if (Math.abs(distance) >= minimumSwipeDistance) {
      if (distance > 0) {
        showNextImage();
      } else {
        showPreviousImage();
      }
    }

    setTouchStart(null);
  }

  return (
    <div
      className="overflow-hidden rounded-3xl bg-slate-200 shadow-sm"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative aspect-[16/9] w-full">
        <SafeImage
          key={activeImage}
          src={activeImage}
          alt={`${destinationName} travel view ${activeIndex + 1}`}
          fill
          priority={activeIndex === 0}
          loading={activeIndex === 0 ? "eager" : "lazy"}
          quality={72}
          sizes="(min-width: 1280px) 760px, (min-width: 1024px) 62vw, (min-width: 640px) calc(100vw - 3rem), calc(100vw - 2rem)"
          className="object-cover"
        />

        {hasMultipleImages ? (
          <>
            <button
              type="button"
              aria-label={`Show previous image of ${destinationName}`}
              onClick={showPreviousImage}
              className="absolute left-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0A2A66] shadow-md transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`Show next image of ${destinationName}`}
              onClick={showNextImage}
              className="absolute right-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0A2A66] shadow-md transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        ) : null}

        <span
          aria-live="polite"
          className="absolute bottom-3 right-3 rounded-full bg-[#0A2A66]/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
        >
          {activeIndex + 1} / {images.length}
        </span>
      </div>

      {hasMultipleImages ? (
        <div className="flex items-center justify-center gap-2 bg-white px-4 py-3" aria-label="Choose gallery image">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-current={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`size-2.5 rounded-full transition ${
                index === activeIndex ? "bg-[#FF6B00]" : "bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
