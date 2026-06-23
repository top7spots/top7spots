import type { Metadata } from "next";
import { fallbackImage } from "@/lib/image-constants";

export const siteName = "Top7Spots";
export const siteBaseUrl = "https://www.top7spots.com";
export const defaultSeoTitle = "Top7Spots – Discover the Best Places to Visit Around the World";
export const defaultSeoDescription =
  "Discover top travel spots, hidden gems, city guides, and destination ideas curated by Top7Spots.";
export const defaultSeoImage = "/uploads/global/home-hero.webp";

type SeoMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  keywords?: string[];
  type?: "website" | "article";
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteBaseUrl).toString();
}

export function cleanPath(path = "/") {
  const clean = `/${path.replace(siteBaseUrl, "").replace(/^\/+/, "")}`;
  return clean === "/" ? clean : clean.replace(/\/+$/, "");
}

export function absoluteImageUrl(image?: string) {
  if (image && /^https?:\/\//i.test(image)) {
    return image;
  }

  return absoluteUrl(image || defaultSeoImage);
}

export function isPlaceholderSeoImage(image?: string) {
  const normalized = String(image ?? "").trim();

  if (!normalized) {
    return false;
  }

  if (normalized === fallbackImage) {
    return true;
  }

  try {
    return new URL(normalized, siteBaseUrl).pathname === fallbackImage;
  } catch {
    return false;
  }
}

export function absoluteSeoImageUrl(image?: string) {
  const normalized = String(image ?? "").trim();

  if (!normalized || isPlaceholderSeoImage(normalized)) {
    return undefined;
  }

  return absoluteImageUrl(normalized);
}

export function seoMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  keywords,
  type = "website",
}: SeoMetadataInput): Metadata {
  const url = absoluteUrl(cleanPath(path));
  const hasExplicitImage = image !== undefined;
  const imageUrl = hasExplicitImage ? absoluteSeoImageUrl(image) : absoluteSeoImageUrl(defaultSeoImage);
  const openGraphImages = imageUrl
    ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt?.trim() || title,
        },
      ]
    : undefined;

  return {
    title,
    description,
    keywords: keywords?.length ? keywords : undefined,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      type,
      images: openGraphImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}
