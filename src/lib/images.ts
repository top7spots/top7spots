import "server-only";

export const fallbackImage = "/uploads/placeholder.svg";

export function resolveImagePath(image?: string) {
  const normalized = String(image ?? "").trim();
  return normalized || fallbackImage;
}

export function isRemoteImage(image?: string) {
  return Boolean(image && /^https?:\/\//i.test(image));
}

export function isLocalUpload(image?: string) {
  return Boolean(image && image.startsWith("/uploads/"));
}
