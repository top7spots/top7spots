import "server-only";

import { existsSync } from "fs";
import path from "path";

export const fallbackImage = "/uploads/placeholder.svg";

export function resolveImagePath(image?: string) {
  const normalized = String(image ?? "").trim();

  if (!normalized) {
    return fallbackImage;
  }

  if (isRemoteImage(normalized)) {
    return normalized;
  }

  if (isLocalUpload(normalized) && !localUploadExists(normalized)) {
    return fallbackImage;
  }

  return normalized;
}

export function isRemoteImage(image?: string) {
  return Boolean(image && /^https?:\/\//i.test(image));
}

export function isLocalUpload(image?: string) {
  return Boolean(image && image.startsWith("/uploads/"));
}

function localUploadExists(image: string) {
  const relativePath = image.replace(/^\/+/, "");
  const absolutePath = path.join(process.cwd(), "public", relativePath);
  const uploadsRoot = path.join(process.cwd(), "public", "uploads");

  return absolutePath.startsWith(uploadsRoot) && existsSync(absolutePath);
}
