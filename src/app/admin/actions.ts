"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAdminSession, isValidAdminLogin, setAdminSession } from "@/lib/admin-auth";
import { citySaveErrorRedirectPath, saveCityFromForm } from "@/lib/admin-city-save";
import { deleteItem, getCityBySlug, upsertItem } from "@/lib/data";
import { listFromTextarea, slugify } from "@/lib/format";
import type { AdminCollection, Attraction, ContentStatus, Destination, Guide } from "@/lib/types";
import { getImagePathFromForm, getImagePathsFromForm } from "@/lib/uploads";

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

async function cityContext(formData: FormData) {
  const citySlug = slugify(value(formData, "citySlug")) || "muscat";
  const city = await getCityBySlug(citySlug);

  return {
    cityId: city?.id || citySlug,
    cityName: city?.name || citySlug,
    citySlug,
  };
}

function redirectWithUploadError(error: unknown): never {
  const message =
    error instanceof Error ? error.message : "Image upload failed. Please choose another image.";
  redirect(`/admin/dashboard?uploadError=${encodeURIComponent(message)}`);
}

function redirectWithSaveError(section: AdminCollection, error: unknown, id?: string): never {
  const message = error instanceof Error ? error.message : "Content could not be saved.";
  const mode = id ? `&mode=edit&id=${encodeURIComponent(id)}` : "";

  redirect(`/admin/dashboard?section=${section}${mode}&saveError=${encodeURIComponent(message)}`);
}

function revalidateCoreRoutes(citySlug?: string, itemSlug?: string, type?: "destinations" | "guides") {
  revalidatePath("/");

  if (citySlug) {
    revalidatePath(`/${citySlug}`);
  }

  if (citySlug && itemSlug && type) {
    revalidatePath(`/${citySlug}/${type}/${itemSlug}`);
  }
}

export async function loginAction(formData: FormData) {
  const email = value(formData, "email");
  const password = value(formData, "password");

  if (isValidAdminLogin(email, password)) {
    await setAdminSession();
    redirect("/admin/dashboard");
  }

  redirect("/admin/login?error=1");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function saveCityAction(formData: FormData) {
  const result = await saveCityFromForm(formData);

  if (!result.ok) {
    redirect(citySaveErrorRedirectPath(formData, result.message));
  }

  redirect("/admin/dashboard?section=cities&updated=cities");
}

export async function deleteCityAction(formData: FormData) {
  const slug = value(formData, "slug");
  try {
    await deleteItem("cities", value(formData, "id"));
  } catch (error) {
    redirectWithSaveError("cities", error);
  }
  revalidateCoreRoutes(slug);
  redirect("/admin/dashboard?section=cities&deleted=cities");
}

export async function saveDestinationAction(formData: FormData) {
  const name = value(formData, "name");
  const { cityId, cityName, citySlug } = await cityContext(formData);
  let image: string;
  let galleryImages: string[];

  try {
    image = await getImagePathFromForm(formData, {
      fieldName: "image",
      folder: "destinations",
      fallbackName: slugify(name),
    });
  } catch (error) {
    redirectWithUploadError(error);
  }

  const slug = value(formData, "slug") || slugify(name);

  try {
    galleryImages = await getImagePathsFromForm(formData, {
      fieldName: "galleryImages",
      folder: "destinations",
      fallbackName: `${slug}-gallery`,
    });
  } catch (error) {
    redirectWithUploadError(error);
  }

  const item: Destination = {
    id: value(formData, "id") || idFrom("dst", name),
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
    galleryImages,
    summary: value(formData, "summary"),
    description: value(formData, "description"),
    highlights: listFromTextarea(formData.get("highlights")),
    practicalInfo: listFromTextarea(formData.get("practicalInfo")),
    howToGo: value(formData, "howToGo"),
    travelTips: listFromTextarea(formData.get("travelTips")),
    nearbyAttractions: listFromTextarea(formData.get("nearbyAttractions")),
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
    redirectWithSaveError("destinations", error, item.id);
  }

  revalidateCoreRoutes(item.citySlug, item.slug, "destinations");
  revalidatePath("/destinations");
  redirect("/admin/dashboard?section=destinations&updated=destinations");
}

export async function deleteDestinationAction(formData: FormData) {
  const citySlug = value(formData, "citySlug");
  try {
    await deleteItem("destinations", value(formData, "id"));
  } catch (error) {
    redirectWithSaveError("destinations", error);
  }
  revalidateCoreRoutes(citySlug);
  revalidatePath("/destinations");
  redirect("/admin/dashboard?section=destinations&deleted=destinations");
}

export async function saveGuideAction(formData: FormData) {
  const title = value(formData, "title");
  const { cityId, citySlug } = await cityContext(formData);
  let image: string;

  try {
    image = await getImagePathFromForm(formData, {
      fieldName: "image",
      folder: "guides",
      fallbackName: slugify(title),
    });
  } catch (error) {
    redirectWithUploadError(error);
  }

  const slug = value(formData, "slug") || slugify(title);
  const item: Guide = {
    id: value(formData, "id") || idFrom("guide", title),
    cityId,
    citySlug,
    slug,
    title,
    category: value(formData, "category"),
    readTime: value(formData, "readTime"),
    image,
    coverImage: image,
    author: value(formData, "author"),
    excerpt: value(formData, "excerpt"),
    content: listFromTextarea(formData.get("content")),
    status: statusValue(formData),
    isFeatured: checkboxValue(formData, "isFeatured"),
    displayOrder: numberValue(formData, "displayOrder"),
    seoTitle: value(formData, "seoTitle"),
    seoDescription: value(formData, "seoDescription"),
    createdAt: timestamp(formData),
    updatedAt: new Date().toISOString(),
  };

  try {
    await upsertItem("guides", item);
  } catch (error) {
    redirectWithSaveError("guides", error, item.id);
  }

  revalidateCoreRoutes(item.citySlug, item.slug, "guides");
  revalidatePath("/guides");
  redirect("/admin/dashboard?section=guides&updated=guides");
}

export async function deleteGuideAction(formData: FormData) {
  const citySlug = value(formData, "citySlug");
  try {
    await deleteItem("guides", value(formData, "id"));
  } catch (error) {
    redirectWithSaveError("guides", error);
  }
  revalidateCoreRoutes(citySlug);
  revalidatePath("/guides");
  redirect("/admin/dashboard?section=guides&deleted=guides");
}

export async function saveAttractionAction(formData: FormData) {
  const name = value(formData, "name");
  const { cityId, cityName, citySlug } = await cityContext(formData);
  let image: string;

  try {
    image = await getImagePathFromForm(formData, {
      fieldName: "image",
      folder: "attractions",
      fallbackName: slugify(name),
    });
  } catch (error) {
    redirectWithUploadError(error);
  }

  const category = value(formData, "category") || value(formData, "type");
  const item: Attraction = {
    id: value(formData, "id") || idFrom("att", name),
    cityId,
    citySlug,
    name,
    slug: value(formData, "slug") || slugify(name),
    city: cityName,
    image,
    category,
    type: category,
    description: value(formData, "description"),
    summary: value(formData, "summary") || value(formData, "description"),
    recommendedTime: value(formData, "recommendedTime"),
    status: statusValue(formData),
    displayOrder: numberValue(formData, "displayOrder"),
    seoTitle: value(formData, "seoTitle"),
    seoDescription: value(formData, "seoDescription"),
  };

  try {
    await upsertItem("attractions", item);
  } catch (error) {
    redirectWithSaveError("attractions", error, item.id);
  }

  revalidateCoreRoutes(item.citySlug);
  redirect("/admin/dashboard?section=attractions&updated=attractions");
}

export async function deleteAttractionAction(formData: FormData) {
  const citySlug = value(formData, "citySlug");
  try {
    await deleteItem("attractions", value(formData, "id"));
  } catch (error) {
    redirectWithSaveError("attractions", error);
  }
  revalidateCoreRoutes(citySlug);
  redirect("/admin/dashboard?section=attractions&deleted=attractions");
}
