"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { fallbackImage } from "@/lib/image-constants";

type SafeImageProps = Omit<ImageProps, "src"> & {
  fallbackSrc?: string;
  src?: string | null;
};

export function SafeImage({
  alt,
  fallbackSrc = fallbackImage,
  onError,
  src,
  unoptimized,
  ...props
}: SafeImageProps) {
  const initialSrc = usableImageSrc(src) ? src : fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const shouldBypassOptimization = unoptimized ?? isSvgImage(currentSrc);

  useEffect(() => {
    setCurrentSrc(initialSrc);
  }, [initialSrc]);

  return (
    <Image
      {...props}
      alt={alt}
      src={currentSrc}
      unoptimized={shouldBypassOptimization}
      onError={(event) => {
        onError?.(event);

        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}

function usableImageSrc(src: string | null | undefined): src is string {
  const value = String(src ?? "").trim();
  return value.startsWith("/") || /^https?:\/\//i.test(value);
}

function isSvgImage(src: string) {
  return /\.svg(?:[?#].*)?$/i.test(src);
}
