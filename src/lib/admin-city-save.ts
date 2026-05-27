import "server-only";

import { revalidatePath } from "next/cache";
import { getCities, updateCityReferences, upsertItem } from "@/lib/data";
import { listFromTextarea, slugify } from "@/lib/format";
import { hasSupabaseConfig, getSupabaseEnvStatus } from "@/lib/supabase";
import type { City, ContentStatus } from "@/lib/types";
import { getImagePathFromForm } from "@/lib/uploads";

type SaveCityResult =
  | { ok: true; city: City; previousSlug: string }
  | { ok: false; message: string; id: string };

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

function logCitySaveError(stage: string, error: unknown, context: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[Top7Spots Admin] City save failed.", {
    stage,
    message,
    ...context,
    supabase: getSupabaseEnvStatus(),
  });
}

function uploadedFileInfo(formData: FormData, fieldName: string) {
  const file = formData.get(`${fieldName}File`);

  if (typeof File === "undefined" || !(file instanceof File) || file.size === 0) {
    return { hasUploadedFile: false };
  }

  return {
    hasUploadedFile: true,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  };
}

async function imageFromForm(
  formData: FormData,
  fieldName: "heroImage" | "cardImage" | "featuredImage",
  slug: string,
) {
  const fallbackByField = {
    heroImage: `${slug}-hero`,
    cardImage: `${slug}-card`,
    featuredImage: `${slug}-featured`,
  };

  return getImagePathFromForm(formData, {
    fieldName,
    folder: "cities",
    fallbackName: fallbackByField[fieldName],
  });
}

export function citySaveErrorRedirectPath(formData: FormData, message: string) {
  const id = value(formData, "id");
  const mode = id ? `&mode=edit&id=${encodeURIComponent(id)}` : "&mode=add";

  return `/admin/dashboard?section=cities${mode}&saveError=${encodeURIComponent(message)}`;
}

export function revalidateCityRoutes(city: Pick<City, "slug">, previousSlug?: string) {
  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/${city.slug}`);

  if (previousSlug && previousSlug !== city.slug) {
    revalidatePath(`/${previousSlug}`);
  }
}

export async function saveCityFromForm(formData: FormData): Promise<SaveCityResult> {
  const name = value(formData, "name");
  const slug = slugify(name);
  const id = value(formData, "id") || slug;
  const previousSlug = slugify(value(formData, "existingSlug"));

  if (!name || !slug) {
    return { ok: false, id, message: "City name is required to generate a URL-safe slug." };
  }

  if (!hasSupabaseConfig()) {
    logCitySaveError("env", new Error("Supabase environment is incomplete."), { id, slug });
    return { ok: false, id, message: "Supabase is not configured for this deployment." };
  }

  try {
    const cities = await getCities();
    const duplicate = cities.find((city) => slugify(city.slug) === slug && city.id !== id);

    if (duplicate) {
      return {
        ok: false,
        id,
        message: `A city with the slug "${slug}" already exists. Use a different city name.`,
      };
    }
  } catch (error) {
    logCitySaveError("duplicate-check", error, { id, slug });
    return {
      ok: false,
      id,
      message: error instanceof Error ? error.message : "Could not check existing cities.",
    };
  }

  let heroImage: string;
  let cardImage: string;
  let featuredImage: string;

  try {
    heroImage = await imageFromForm(formData, "heroImage", slug);
    cardImage = await imageFromForm(formData, "cardImage", slug);
    featuredImage = await imageFromForm(formData, "featuredImage", slug);
  } catch (error) {
    logCitySaveError("image-upload", error, {
      id,
      slug,
      heroImage: uploadedFileInfo(formData, "heroImage"),
      cardImage: uploadedFileInfo(formData, "cardImage"),
      featuredImage: uploadedFileInfo(formData, "featuredImage"),
    });
    return {
      ok: false,
      id,
      message: error instanceof Error ? error.message : "City image upload failed.",
    };
  }

  const item: City = {
    id,
    name,
    slug,
    country: value(formData, "country"),
    countryCode: value(formData, "countryCode"),
    region: value(formData, "region"),
    shortDescription: value(formData, "shortDescription"),
    longDescription: value(formData, "longDescription"),
    heroImage,
    cardImage: cardImage || heroImage,
    featuredImage: featuredImage || heroImage,
    status: statusValue(formData),
    isFeatured: checkboxValue(formData, "isFeatured"),
    displayOrder: numberValue(formData, "displayOrder"),
    seoTitle: value(formData, "seoTitle"),
    seoDescription: value(formData, "seoDescription"),
    seoKeywords: listFromTextarea(formData.get("seoKeywords")),
    createdAt: timestamp(formData),
    updatedAt: new Date().toISOString(),
  };

  try {
    await upsertItem("cities", item);
    await updateCityReferences(previousSlug, item);
  } catch (error) {
    logCitySaveError("upsert", error, {
      id: item.id,
      slug: item.slug,
      status: item.status,
      table: "cities",
    });
    return {
      ok: false,
      id: item.id,
      message: error instanceof Error ? error.message : "City could not be saved.",
    };
  }

  revalidateCityRoutes(item, previousSlug);
  console.info("[Top7Spots Admin] City saved to Supabase.", {
    id: item.id,
    slug: item.slug,
    status: item.status,
    table: "cities",
    supabase: getSupabaseEnvStatus(),
  });

  return { ok: true, city: item, previousSlug };
}
