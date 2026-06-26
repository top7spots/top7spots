import "server-only";

import { revalidatePath } from "next/cache";
import { getCityBySlug, getDestinations, upsertItem } from "@/lib/data";
import { listFromTextarea, slugify } from "@/lib/format";
import {
  destinationImageAlt,
  destinationImageCaption,
  galleryImageAlt,
  galleryImageCaption,
} from "@/lib/image-seo";
import { imageMetadataValue, normalizeGalleryImageMetadata, parseGalleryImageMetadata } from "@/lib/image-metadata";
import type { ContentStatus, Destination, GuideFaq } from "@/lib/types";
import { getImagePathFromForm, getImagePathsFromForm } from "@/lib/uploads";

type SaveDestinationResult =
  | { ok: true; destination: Destination; isCreating: boolean }
  | { ok: false; message: string; id?: string };

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function statusValue(formData: FormData): ContentStatus {
  return value(formData, "status") === "draft" ? "draft" : "published";
}

function checkboxValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function numberValue(formData: FormData, key: string) {
  const parsed = Number(value(formData, key));
  return Number.isFinite(parsed) ? parsed : 0;
}

function timestamp(formData: FormData, key = "createdAt") {
  return value(formData, key) || new Date().toISOString();
}

function idFrom(prefix: string, name: string) {
  return `${prefix}-${slugify(name)}-${Date.now().toString(36)}`;
}

function parseFaqText(input: FormDataEntryValue | null): GuideFaq[] {
  const raw = String(input ?? "").trim();

  if (!raw) {
    return [];
  }

  return raw
    .split(/\n\s*\n/)
    .map((block) => {
      const questionMatch = block.match(/question\s*:\s*(.+)/i);
      const answerMatch = block.match(/answer\s*:\s*([\s\S]+)/i);
      return {
        question: questionMatch?.[1]?.trim() ?? "",
        answer: answerMatch?.[1]?.trim() ?? "",
      };
    })
    .filter((faq) => faq.question && faq.answer);
}

async function cityContext(formData: FormData) {
  const citySlug = slugify(value(formData, "citySlug")) || "muscat";
  const city = await getCityBySlug(citySlug);

  return {
    cityId: city?.id || citySlug,
    cityName: city?.name || citySlug,
    citySlug,
    countryName: city?.country || "",
    countrySlug: slugify(city?.country || ""),
  };
}

export function destinationSaveErrorRedirectPath(formData: FormData, message: string, id?: string) {
  const destinationId = id || value(formData, "id");
  const mode = destinationId ? `&mode=edit&id=${encodeURIComponent(destinationId)}` : "&mode=add";

  return `/admin/dashboard?section=destinations${mode}&saveError=${encodeURIComponent(message)}`;
}

export function destinationEditRedirectPath(id: string) {
  return `/admin/dashboard?section=destinations&mode=edit&id=${encodeURIComponent(id)}&updated=destinations`;
}

export function destinationListRedirectPath() {
  return "/admin/dashboard?section=destinations";
}

export async function saveDestinationFromForm(formData: FormData): Promise<SaveDestinationResult> {
  const name = value(formData, "name");
  const id = value(formData, "id");
  const isCreating = !id;
  const { cityId, cityName, citySlug, countryName, countrySlug } = await cityContext(formData);
  const slug = value(formData, "slug") || slugify(name);
  const existingDestination = id ? (await getDestinations()).find((destination) => destination.id === id) : undefined;
  let image: string;
  let galleryImages: string[];

  try {
    image = await getImagePathFromForm(formData, {
      fieldName: "image",
      folder: "destinations",
      fallbackName: [countrySlug, citySlug, slug, "hero"].filter(Boolean).join("-"),
    });
    galleryImages = await getImagePathsFromForm(formData, {
      fieldName: "galleryImages",
      folder: "destinations",
      fallbackName: [countrySlug, citySlug, slug, "gallery"].filter(Boolean).join("-"),
    });
  } catch (error) {
    return {
      ok: false,
      id,
      message: error instanceof Error ? error.message : "Image upload failed. Please choose another image.",
    };
  }

  const destinationContext = {
    ...existingDestination,
    name,
    city: cityName,
    country: countryName,
    category: value(formData, "category"),
    location: value(formData, "location"),
    region: value(formData, "region"),
  };
  const previousDestinationContext = existingDestination
    ? { ...existingDestination, country: countryName }
    : destinationContext;
  const imageAlt = imageMetadataValue(
    value(formData, "imageAlt"),
    value(formData, "imageAltAuto") || destinationImageAlt(previousDestinationContext),
    destinationImageAlt(destinationContext),
  );
  const imageCaption = imageMetadataValue(
    value(formData, "imageCaption"),
    value(formData, "imageCaptionAuto") || destinationImageCaption(previousDestinationContext),
    destinationImageCaption(destinationContext),
  );
  const submittedGalleryMetadata = parseGalleryImageMetadata(formData.get("galleryImagesMetadata"));
  const galleryImagesMetadata = normalizeGalleryImageMetadata(galleryImages, submittedGalleryMetadata).map((item, index) => {
    const previousContext = previousDestinationContext;
    const nextContext = destinationContext;
    const previousAlt = galleryImageAlt(previousContext, index);
    const previousCaption = galleryImageCaption(previousContext, index);

    return {
      ...item,
      alt: imageMetadataValue(item.alt || "", previousAlt, galleryImageAlt(nextContext, index)),
      caption: imageMetadataValue(item.caption || "", previousCaption, galleryImageCaption(nextContext, index)),
    };
  });
  const item: Destination = {
    id: id || idFrom("dst", name),
    cityId,
    citySlug,
    slug,
    name,
    city: cityName,
    region: value(formData, "region"),
    category: value(formData, "category"),
    location: value(formData, "location"),
    duration: value(formData, "duration"),
    bestSeason: value(formData, "bestSeason"),
    image,
    imageAlt,
    imageCaption,
    galleryImages,
    galleryImagesMetadata,
    summary: value(formData, "summary"),
    description: value(formData, "description"),
    highlights: listFromTextarea(formData.get("highlights")),
    practicalInfo: listFromTextarea(formData.get("practicalInfo")),
    howToGo: value(formData, "howToGo"),
    travelTips: listFromTextarea(formData.get("travelTips")),
    nearbyAttractions: listFromTextarea(formData.get("nearbyAttractions")),
    faqs: parseFaqText(formData.get("faqs")),
    status: statusValue(formData),
    isFeatured: checkboxValue(formData, "isFeatured"),
    displayOrder: numberValue(formData, "displayOrder"),
    seoTitle: value(formData, "seoTitle"),
    seoDescription: value(formData, "seoDescription"),
    createdAt: timestamp(formData),
    updatedAt: new Date().toISOString(),
  };

  try {
    await upsertItem("destinations", item);
  } catch (error) {
    return {
      ok: false,
      id: item.id,
      message: error instanceof Error ? error.message : "Destination could not be saved.",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  revalidatePath("/destinations");

  if (item.citySlug) {
    revalidatePath(`/${item.citySlug}`);
    revalidatePath(`/${item.citySlug}/destinations/${item.slug}`);
  }

  return { ok: true, destination: item, isCreating };
}
