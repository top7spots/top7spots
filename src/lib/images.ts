import "server-only";

export const fallbackImage = "/uploads/placeholder.svg";

export function resolveImagePath(image?: string) {
  const rawValue = String(image ?? "").trim();
  const markdownLink = rawValue.match(/^\[[^\]]+\]\(([^)]+)\)?$/);
  const normalized = (markdownLink?.[1] ?? rawValue).trim();
  return normalized || fallbackImage;
}

export function getDestinationGalleryImages(mainImage?: string, galleryImages: string[] = []) {
  const images = [mainImage, ...galleryImages]
    .map((image) => String(image ?? "").trim())
    .filter(Boolean)
    .map(resolveImagePath);

  return images.length > 0 ? Array.from(new Set(images)) : [fallbackImage];
}

export function isRemoteImage(image?: string) {
  return Boolean(image && /^https?:\/\//i.test(image));
}

export function isLocalUpload(image?: string) {
  return Boolean(image && image.startsWith("/uploads/"));
}
