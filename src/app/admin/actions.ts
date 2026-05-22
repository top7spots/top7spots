"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAdminSession, isValidAdminLogin, setAdminSession } from "@/lib/admin-auth";
import { citySaveErrorRedirectPath, saveCityFromForm } from "@/lib/admin-city-save";
import { deleteItem, getCityBySlug, getGuides, upsertItem } from "@/lib/data";
import { listFromTextarea, slugify } from "@/lib/format";
import type {
  AdminCollection,
  Attraction,
  ContentStatus,
  Destination,
  Guide,
  GuideFaq,
  GuideTableOfContentsItem,
  HomepageFaq,
  HomepageReview,
} from "@/lib/types";
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

function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

function parseCommaSeparatedList(value: FormDataEntryValue | null) {
  return uniqueValues(
    String(value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function optionalCommaSeparatedListValue(formData: FormData, key: string, fallback: string[]) {
  return formData.has(key) ? parseCommaSeparatedList(formData.get(key)) : fallback;
}

function parseFaqText(value: FormDataEntryValue | null): GuideFaq[] {
  const text = String(value ?? "").trim();

  if (!text) {
    return [];
  }

  return text
    .split(/\n\s*\n/)
    .map((block) => {
      const questionMatch = block.match(/(?:^|\n)\s*Question:\s*(.+)/i);
      const answerMatch = block.match(/(?:^|\n)\s*Answer:\s*([\s\S]+)/i);

      return {
        question: questionMatch?.[1]?.trim() ?? "",
        answer: answerMatch?.[1]?.trim() ?? "",
      };
    })
    .filter((faq) => faq.question && faq.answer);
}

function parseTableOfContentsText(value: FormDataEntryValue | null): GuideTableOfContentsItem[] {
  return String(value ?? "")
    .split("\n")
    .map((line) => {
      const [label, anchor] = line.split("|").map((item) => item.trim());
      return { label: label || "", anchor: anchor || "" };
    })
    .filter((item) => item.label && item.anchor);
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
  const existingGuide = value(formData, "id")
    ? (await getGuides()).find((guide) => guide.id === value(formData, "id"))
    : undefined;
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
    seoKeywords: optionalCommaSeparatedListValue(
      formData,
      "seoKeywords",
      existingGuide?.seoKeywords ?? [],
    ),
    coverImageAlt: formData.has("coverImageAlt")
      ? value(formData, "coverImageAlt")
      : existingGuide?.coverImageAlt ?? "",
    faqs: formData.has("faqs") ? parseFaqText(formData.get("faqs")) : existingGuide?.faqs ?? [],
    relatedGuideSlugs: optionalCommaSeparatedListValue(
      formData,
      "relatedGuideSlugs",
      existingGuide?.relatedGuideSlugs ?? [],
    ),
    relatedPlaceSlugs: optionalCommaSeparatedListValue(
      formData,
      "relatedPlaceSlugs",
      existingGuide?.relatedPlaceSlugs ?? [],
    ),
    tableOfContents: formData.has("tableOfContents")
      ? parseTableOfContentsText(formData.get("tableOfContents"))
      : existingGuide?.tableOfContents ?? [],
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

export async function saveHomepageReviewAction(formData: FormData) {
  const name = value(formData, "name");
  const reviewText = value(formData, "reviewText");

  if (!name || !reviewText) {
    redirectWithSaveError(
      "homepage_reviews",
      new Error("A reviewer name and review text are required."),
      value(formData, "id"),
    );
  }

  const item: HomepageReview = {
    id: value(formData, "id") || idFrom("review", name),
    name,
    reviewText,
    isPublished: checkboxValue(formData, "isPublished"),
    sortOrder: numberValue(formData, "sortOrder"),
    createdAt: timestamp(formData),
    updatedAt: new Date().toISOString(),
  };

  try {
    await upsertItem("homepage_reviews", item);
  } catch (error) {
    redirectWithSaveError("homepage_reviews", error, item.id);
  }

  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard?section=homepage_reviews&updated=homepage_reviews");
}

export async function saveHomepageFaqAction(formData: FormData) {
  const question = value(formData, "question");
  const answer = value(formData, "answer");

  if (!question || !answer) {
    redirectWithSaveError(
      "homepage_faqs",
      new Error("A FAQ question and answer are required."),
      value(formData, "id"),
    );
  }

  const item: HomepageFaq = {
    id: value(formData, "id") || idFrom("faq", question),
    question,
    answer,
    isPublished: checkboxValue(formData, "isPublished"),
    sortOrder: numberValue(formData, "sortOrder"),
    createdAt: timestamp(formData),
    updatedAt: new Date().toISOString(),
  };

  try {
    await upsertItem("homepage_faqs", item);
  } catch (error) {
    redirectWithSaveError("homepage_faqs", error, item.id);
  }

  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard?section=homepage_faqs&updated=homepage_faqs");
}
