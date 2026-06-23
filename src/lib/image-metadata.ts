import type { GalleryImageItem } from "@/lib/types";

export function imageMetadataValue(submittedValue: string, previousAutoValue: string, nextAutoValue: string) {
  const submitted = submittedValue.trim();
  const previousAuto = previousAutoValue.trim();
  const nextAuto = nextAutoValue.trim();

  if (!submitted) {
    return nextAuto;
  }

  if (previousAuto && normalizeImageText(submitted) === normalizeImageText(previousAuto)) {
    return nextAuto;
  }

  return submitted;
}

export function parseGalleryImageMetadata(value: unknown): GalleryImageItem[] {
  const parsed = typeof value === "string" ? parseJson(value) : value;

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter(isRecord)
    .map((item) => ({
      src: stringValue(item.src),
      alt: optionalStringValue(item.alt),
      caption: optionalStringValue(item.caption),
      title: optionalStringValue(item.title),
    }))
    .filter((item) => item.src || item.alt || item.caption || item.title);
}

export function normalizeGalleryImageMetadata(images: string[], metadata: GalleryImageItem[] = []) {
  return images.map((src, index) => {
    const matchedBySrc = metadata.find((item) => item.src === src);
    const matchedByIndex = metadata[index];
    const item = matchedBySrc || matchedByIndex;

    return cleanGalleryImageItem({
      src,
      alt: item?.alt,
      caption: item?.caption,
      title: item?.title,
    });
  });
}

export function cleanGalleryImageItem(item: GalleryImageItem): GalleryImageItem {
  return {
    src: item.src.trim(),
    alt: optionalStringValue(item.alt),
    caption: optionalStringValue(item.caption),
    title: optionalStringValue(item.title),
  };
}

function parseJson(value: string) {
  const text = value.trim();

  if (!text) {
    return [];
  }

  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalStringValue(value: unknown) {
  const text = stringValue(value);
  return text || undefined;
}

function normalizeImageText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
