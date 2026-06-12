import "server-only";

import { fallbackImage } from "@/lib/image-constants";
import { getSupabasePublicUrl, supabaseStorageBucket } from "@/lib/supabase";

const missingImageValues = new Set(["", "null", "undefined", "none", "n/a", "-"]);
const localImagePathPattern = /^\/(?:uploads|images)\//i;
const imageExtensionPattern = /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i;

export function resolveImagePath(image?: string) {
  const rawValue = String(image ?? "").trim();
  const markdownLink = rawValue.match(/^\[[^\]]+\]\(([^)]+)\)?$/);
  const normalized = normalizeImageValue(markdownLink?.[1] ?? rawValue);
  return normalized || fallbackImage;
}

export function getDestinationGalleryImages(mainImage?: string, galleryImages: string[] = []) {
  const images = [mainImage, ...galleryImages]
    .map(resolveImagePath)
    .filter(Boolean)
    .filter((image) => image !== fallbackImage);

  return images.length > 0 ? Array.from(new Set(images)) : [fallbackImage];
}

export function isRemoteImage(image?: string) {
  return Boolean(image && /^https?:\/\//i.test(image));
}

export function isLocalUpload(image?: string) {
  return Boolean(image && image.startsWith("/uploads/"));
}

function normalizeImageValue(value: string) {
  const trimmed = value.trim();

  if (missingImageValues.has(trimmed.toLowerCase())) {
    return "";
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  if (isRemoteImage(trimmed)) {
    return trimmed;
  }

  if (localImagePathPattern.test(trimmed)) {
    return encodePathSegments(trimmed);
  }

  if (/^(?:uploads|images)\//i.test(trimmed)) {
    return encodePathSegments(`/${trimmed}`);
  }

  const publicStorageMatch = trimmed.match(
    new RegExp(`^(?:/?storage/v1/object/public/)?${escapeRegExp(supabaseStorageBucket)}/(.+)$`, "i"),
  );

  if (publicStorageMatch?.[1]) {
    return getSupabasePublicUrl(publicStorageMatch[1]);
  }

  const storageObjectMatch = trimmed.match(/^\/?storage\/v1\/object\/public\/([^/]+)\/(.+)$/i);

  if (storageObjectMatch?.[1] === supabaseStorageBucket && storageObjectMatch[2]) {
    return getSupabasePublicUrl(storageObjectMatch[2]);
  }

  if (imageExtensionPattern.test(trimmed) && !trimmed.startsWith("/")) {
    return getSupabasePublicUrl(trimmed);
  }

  if (trimmed.startsWith("/")) {
    return encodePathSegments(trimmed);
  }

  return "";
}

function encodePathSegments(path: string) {
  const [pathname, suffix = ""] = path.split(/([?#].*)/, 2);
  return `${pathname
    .split("/")
    .map((segment, index) => (index === 0 ? segment : encodeURIComponent(safeDecodeURIComponent(segment))))
    .join("/")}${suffix}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
