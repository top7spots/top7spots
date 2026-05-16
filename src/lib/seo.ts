import type { Metadata } from "next";

export const siteName = "Top7Spots";
export const siteBaseUrl = "https://www.top7spots.com";
export const defaultSeoTitle = "Top7Spots – Discover the Best Places to Visit Around the World";
export const defaultSeoDescription =
  "Discover top travel spots, hidden gems, city guides, and destination ideas curated by Top7Spots.";
export const defaultSeoImage = "/uploads/global/home-hero.jpg";

type SeoMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
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

export function seoMetadata({
  title,
  description,
  path,
  image,
  type = "website",
}: SeoMetadataInput): Metadata {
  const url = absoluteUrl(cleanPath(path));
  const imageUrl = absoluteImageUrl(image);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      type,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
