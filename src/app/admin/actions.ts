"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAdminSession, isValidAdminLogin, setAdminSession } from "@/lib/admin-auth";
import { citySaveErrorRedirectPath, saveCityFromForm } from "@/lib/admin-city-save";
import {
  defaultDiscoverCarsAffiliateLink,
  defaultDiscoverCarsWidgetCode,
  normalizeCarRentalImport,
  normalizeCarRentalPageDraft,
  parseJsonArray,
} from "@/lib/car-rental-pages";
import {
  deleteItem,
  getCities,
  getCityBySlug,
  getDestinations,
  getGuides,
  upsertItem,
} from "@/lib/data";
import { listFromTextarea, slugify } from "@/lib/format";
import { normalizeGuideContentBlocks } from "@/lib/guide-content-blocks";
import { normalizeGuideListingBlocks } from "@/lib/guide-listing-blocks";
import {
  attractionImageAlt,
  attractionImageCaption,
  destinationImageAlt,
  destinationImageCaption,
  galleryImageAlt,
  galleryImageCaption,
  restaurantImageAlt,
  restaurantImageCaption,
} from "@/lib/image-seo";
import { imageMetadataValue, normalizeGalleryImageMetadata, parseGalleryImageMetadata } from "@/lib/image-metadata";
import {
  normalizeHomeHeroOverlayOpacity,
  normalizeHomeHeroOverlayStyle,
} from "@/lib/home-hero-settings";
import { saveSiteSettings } from "@/lib/site-settings";
import type {
  AdminCollection,
  Author,
  Attraction,
  CarRentalPage,
  CarRentalVehicleCategoryCard,
  ContentStatus,
  Destination,
  Guide,
  GuideFaq,
  GuideTargetType,
  GuideTableOfContentsItem,
  HomepageFaq,
  HomepageReview,
  Restaurant,
  SiteSettings,
  SitePage,
} from "@/lib/types";
import { getImagePathFromForm, getImagePathsFromForm } from "@/lib/uploads";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function statusValue(formData: FormData): ContentStatus {
  return value(formData, "status") === "draft" ? "draft" : "published";
}

function authorStatusValue(formData: FormData): Author["status"] {
  return value(formData, "status") === "inactive" ? "inactive" : "active";
}

function carRentalLanguageValue(formData: FormData) {
  return value(formData, "language") === "ar" ? "ar" : "en";
}

function carRentalPageTypeValue(formData: FormData) {
  const pageType = value(formData, "pageType");
  return pageType === "global" || pageType === "country" || pageType === "city" || pageType === "airport" ? pageType : "";
}

function parseCarRentalJsonArray<T>(formData: FormData, key: string, label: string): T[] {
  try {
    return parseJsonArray<T>(formData.get(key));
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Invalid JSON.";
    throw new Error(`${label} must be valid JSON array. ${detail}`);
  }
}

async function vehicleCategoryCardsFromForm(formData: FormData) {
  const cards = parseCarRentalJsonArray<CarRentalVehicleCategoryCard>(
    formData,
    "vehicleCategoryCards",
    "Vehicle category cards",
  );

  const locationSlug = [slugify(value(formData, "countryName")), slugify(value(formData, "cityName"))]
    .filter(Boolean)
    .join("-");

  return Promise.all(
    cards.map(async (card, index) => ({
      ...card,
      image: await getImagePathFromForm(formData, {
        fieldName: `vehicleCategoryImage_${index}`,
        folder: "car-rental",
        fallbackName: [locationSlug, "vehicle-category", slugify(card.title || String(index + 1))]
          .filter(Boolean)
          .join("-"),
      }),
    })),
  );
}

function checkboxValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function numberValue(formData: FormData, key: string) {
  const parsed = Number(value(formData, key));
  return Number.isFinite(parsed) ? parsed : 0;
}

function ratingValue(formData: FormData, key: string) {
  const parsed = numberValue(formData, key);
  return Math.min(5, Math.max(1, parsed || 5));
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
    countryName: city?.country || "",
    countrySlug: slugify(city?.country || ""),
  };
}

function guideTargetTypeValue(formData: FormData): GuideTargetType {
  const targetType = value(formData, "targetType");
  return targetType === "country" || targetType === "destination" ? targetType : "city";
}

async function guideOwnershipContext(formData: FormData) {
  const targetType = guideTargetTypeValue(formData);

  if (targetType === "country") {
    const countryId = slugify(value(formData, "countryId"));
    const countries = new Set((await getCities()).map((city) => slugify(city.country)).filter(Boolean));

    if (!countryId || !countries.has(countryId)) {
      throw new Error("Choose a valid country for this guide.");
    }

    return { targetType, countryId, cityId: "", citySlug: "", destinationId: "" };
  }

  if (targetType === "destination") {
    const destinationId = value(formData, "destinationId");
    const destination = (await getDestinations()).find(
      (item) => item.id === destinationId || item.slug === slugify(destinationId),
    );

    if (!destination) {
      throw new Error("Choose a valid destination for this guide.");
    }

    const city = (await getCities()).find(
      (item) => item.id === destination.cityId || item.slug === destination.citySlug,
    );

    return {
      targetType,
      countryId: slugify(city?.country || ""),
      cityId: destination.cityId || city?.id || "",
      citySlug: destination.citySlug || city?.slug || "",
      destinationId: destination.id,
    };
  }

  const { cityId, citySlug, countrySlug } = await cityContext(formData);

  if (!citySlug) {
    throw new Error("Choose a valid city for this guide.");
  }

  return { targetType, countryId: countrySlug, cityId, citySlug, destinationId: "" };
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

function redirectToAdminSection(section: AdminCollection): never {
  redirect(`/admin/dashboard?section=${section}`);
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

async function revalidateGuideRoutes(guide: Guide) {
  revalidatePath("/");

  if (guide.targetType === "city") {
    revalidateCoreRoutes(guide.citySlug, guide.slug, "guides");
    return;
  }

  if (guide.targetType === "country" && guide.countryId) {
    revalidatePath(`/countries/${guide.countryId}`);
    return;
  }

  if (guide.targetType === "destination" && guide.destinationId) {
    const destination = (await getDestinations()).find((item) => item.id === guide.destinationId);

    if (destination) {
      revalidatePath(`/destinations/${destination.slug}`);

      if (destination.citySlug) {
        revalidatePath(`/${destination.citySlug}`);
        revalidatePath(`/${destination.citySlug}/destinations/${destination.slug}`);
      }
    }
  }
}

async function guideContentBlocksFromForm(
  formData: FormData,
  title: string,
  existingGuide?: Guide,
  fallbackPrefix?: string,
) {
  if (!formData.has("contentBlocks")) {
    return existingGuide?.contentBlocks ?? [];
  }

  const blocks = normalizeGuideContentBlocks(formData.get("contentBlocks"));

  try {
    const uploadedBlocks = await Promise.all(
      blocks.map(async (block, index) => {
        const fieldName = `contentBlockImage_${block.id}`;
        const image = await getImagePathFromForm(formData, {
          fieldName,
          folder: "guides",
          currentImage: block.image || "",
          fallbackName: [fallbackPrefix || slugify(title) || "guide", "block", block.id || index + 1]
            .filter(Boolean)
            .join("-"),
        });

        return { ...block, image };
      }),
    );
    return normalizeGuideContentBlocks(uploadedBlocks);
  } catch (error) {
    redirectWithUploadError(error);
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

  redirectToAdminSection("cities");
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
  const id = value(formData, "id");
  const { cityId, cityName, citySlug, countryName, countrySlug } = await cityContext(formData);
  let image: string;
  let galleryImages: string[];
  const slug = value(formData, "slug") || slugify(name);
  const existingDestination = id ? (await getDestinations()).find((destination) => destination.id === id) : undefined;

  try {
    image = await getImagePathFromForm(formData, {
      fieldName: "image",
      folder: "destinations",
      fallbackName: [countrySlug, citySlug, slug, "hero"].filter(Boolean).join("-"),
    });
  } catch (error) {
    redirectWithUploadError(error);
  }

  try {
    galleryImages = await getImagePathsFromForm(formData, {
      fieldName: "galleryImages",
      folder: "destinations",
      fallbackName: [countrySlug, citySlug, slug, "gallery"].filter(Boolean).join("-"),
    });
  } catch (error) {
    redirectWithUploadError(error);
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
    redirectWithSaveError("destinations", error, item.id);
  }

  revalidateCoreRoutes(item.citySlug, item.slug, "destinations");
  revalidatePath("/destinations");
  redirectToAdminSection("destinations");
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
  const id = value(formData, "id");
  const slug = value(formData, "slug") || slugify(title);
  let ownership: Awaited<ReturnType<typeof guideOwnershipContext>>;
  let image: string;

  try {
    ownership = await guideOwnershipContext(formData);
  } catch (error) {
    redirectWithSaveError("guides", error, id);
  }

  try {
    image = await getImagePathFromForm(formData, {
      fieldName: "image",
      folder: "guides",
      fallbackName: [ownership.countryId, ownership.citySlug, slug, "guide-cover"].filter(Boolean).join("-"),
    });
  } catch (error) {
    redirectWithUploadError(error);
  }

  const existingGuide = id
    ? (await getGuides()).find((guide) => guide.id === id)
    : undefined;
  const item: Guide = {
    id: id || idFrom("guide", title),
    targetType: ownership.targetType,
    countryId: ownership.countryId,
    cityId: ownership.cityId,
    citySlug: ownership.citySlug,
    destinationId: ownership.destinationId,
    slug,
    title,
    category: value(formData, "category"),
    readTime: value(formData, "readTime"),
    image,
    coverImage: image,
    authorId: value(formData, "authorId"),
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
    listingBlocks: formData.has("listingBlocks")
      ? normalizeGuideListingBlocks(formData.get("listingBlocks"))
      : existingGuide?.listingBlocks ?? [],
    contentBlocks: await guideContentBlocksFromForm(
      formData,
      title,
      existingGuide,
      [ownership.countryId, ownership.citySlug, slug, "guide"].filter(Boolean).join("-"),
    ),
    createdAt: timestamp(formData),
    updatedAt: new Date().toISOString(),
  };

  try {
    await upsertItem("guides", item);
  } catch (error) {
    redirectWithSaveError("guides", error, item.id);
  }

  await revalidateGuideRoutes(item);
  revalidatePath("/guides");
  redirectToAdminSection("guides");
}

export async function deleteGuideAction(formData: FormData) {
  const citySlug = value(formData, "citySlug");
  const existingGuide = (await getGuides()).find((guide) => guide.id === value(formData, "id"));
  try {
    await deleteItem("guides", value(formData, "id"));
  } catch (error) {
    redirectWithSaveError("guides", error);
  }
  if (existingGuide) {
    await revalidateGuideRoutes(existingGuide);
  } else {
    revalidateCoreRoutes(citySlug);
  }
  revalidatePath("/guides");
  redirect("/admin/dashboard?section=guides&deleted=guides");
}

export async function saveAuthorAction(formData: FormData) {
  const name = value(formData, "name");
  const id = value(formData, "id");
  const slug = value(formData, "slug") || slugify(name);
  let profileImage: string;

  try {
    profileImage = await getImagePathFromForm(formData, {
      fieldName: "profileImage",
      folder: "authors",
      fallbackName: slug || slugify(name),
    });
  } catch (error) {
    redirectWithUploadError(error);
  }

  const item: Author = {
    id: id || idFrom("author", name),
    name,
    slug,
    role: value(formData, "role"),
    shortBio: value(formData, "shortBio"),
    fullBio: value(formData, "fullBio"),
    profileImage,
    profileImageAlt: value(formData, "profileImageAlt"),
    expertise: listFromTextarea(formData.get("expertise")),
    location: value(formData, "location"),
    websiteUrl: value(formData, "websiteUrl"),
    linkedinUrl: value(formData, "linkedinUrl"),
    instagramUrl: value(formData, "instagramUrl"),
    xUrl: value(formData, "xUrl"),
    email: value(formData, "email"),
    seoTitle: value(formData, "seoTitle"),
    seoDescription: value(formData, "seoDescription"),
    status: authorStatusValue(formData),
    displayOrder: numberValue(formData, "displayOrder"),
    createdAt: timestamp(formData),
    updatedAt: new Date().toISOString(),
  };

  try {
    await upsertItem("authors", item);
  } catch (error) {
    redirectWithSaveError("authors", error, item.id);
  }

  revalidatePath("/guides");
  revalidatePath(`/authors/${item.slug}`);
  revalidatePath("/sitemap.xml");
  redirectToAdminSection("authors");
}

export async function saveAttractionAction(formData: FormData) {
  const name = value(formData, "name");
  const id = value(formData, "id");
  const { cityId, cityName, citySlug, countryName, countrySlug } = await cityContext(formData);
  let image: string;
  const slug = value(formData, "slug") || slugify(name);

  try {
    image = await getImagePathFromForm(formData, {
      fieldName: "image",
      folder: "attractions",
      fallbackName: [countrySlug, citySlug, slug, "attraction"].filter(Boolean).join("-"),
    });
  } catch (error) {
    redirectWithUploadError(error);
  }

  const category = value(formData, "category") || value(formData, "type");
  const attractionContext = { name, city: cityName, country: countryName, category, type: category };
  const imageAlt = imageMetadataValue(
    value(formData, "imageAlt"),
    value(formData, "imageAltAuto"),
    attractionImageAlt(attractionContext),
  );
  const imageCaption = imageMetadataValue(
    value(formData, "imageCaption"),
    value(formData, "imageCaptionAuto"),
    attractionImageCaption(attractionContext),
  );
  const item: Attraction = {
    id: id || idFrom("att", name),
    cityId,
    citySlug,
    name,
    slug,
    city: cityName,
    image,
    imageAlt,
    imageCaption,
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
  redirectToAdminSection("attractions");
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

export async function saveRestaurantAction(formData: FormData) {
  const name = value(formData, "name");
  const id = value(formData, "id");
  const { cityId, cityName, citySlug, countryName, countrySlug } = await cityContext(formData);
  const destinationId = value(formData, "destinationId");
  let image: string;
  const slug = value(formData, "slug") || slugify(name);

  try {
    image = await getImagePathFromForm(formData, {
      fieldName: "image",
      folder: "restaurants",
      fallbackName: [countrySlug, citySlug, slug, "restaurant"].filter(Boolean).join("-"),
    });
  } catch (error) {
    redirectWithUploadError(error);
  }

  if (destinationId) {
    const destination = (await getDestinations()).find((item) => item.id === destinationId);

    if (!destination) {
      redirectWithSaveError("restaurants", new Error("Choose a valid destination."), value(formData, "id"));
    }
  }

  const restaurantContext = {
    name,
    city: cityName,
    country: countryName,
    countrySlug,
    cuisineType: value(formData, "cuisineType"),
  };
  const imageAlt = imageMetadataValue(
    value(formData, "imageAlt"),
    value(formData, "imageAltAuto"),
    restaurantImageAlt(restaurantContext),
  );
  const imageCaption = imageMetadataValue(
    value(formData, "imageCaption"),
    value(formData, "imageCaptionAuto"),
    restaurantImageCaption(restaurantContext),
  );
  const item: Restaurant = {
    id: id || crypto.randomUUID(),
    slug,
    name,
    shortDescription: value(formData, "shortDescription"),
    longDescription: value(formData, "longDescription"),
    image,
    imageAlt,
    imageCaption,
    cityId,
    destinationId,
    countrySlug,
    cuisineType: value(formData, "cuisineType"),
    priceRange: value(formData, "priceRange"),
    address: value(formData, "address"),
    googleMapsUrl: value(formData, "googleMapsUrl"),
    tags: listFromTextarea(formData.get("tags")),
    featured: checkboxValue(formData, "featured"),
    published: checkboxValue(formData, "published"),
    createdAt: timestamp(formData),
    updatedAt: new Date().toISOString(),
  };

  try {
    await upsertItem("restaurants", item);
  } catch (error) {
    redirectWithSaveError("restaurants", error, item.id);
  }

  revalidateCoreRoutes(citySlug);
  revalidatePath(`/restaurants/${item.slug}`);
  redirectToAdminSection("restaurants");
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
    rating: ratingValue(formData, "rating"),
    source: value(formData, "source") || "Trustpilot",
    reviewUrl: value(formData, "reviewUrl"),
    isPublished: checkboxValue(formData, "isPublished"),
    showOnHomepage: checkboxValue(formData, "showOnHomepage"),
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
  redirectToAdminSection("homepage_reviews");
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
  redirectToAdminSection("homepage_faqs");
}

export async function saveSitePageAction(formData: FormData) {
  const title = value(formData, "title");
  const slug = slugify(value(formData, "slug") || title);
  const content = String(formData.get("content") ?? "").trim();
  const id = value(formData, "id") || slug || idFrom("page", title);

  if (!title || !slug || !content) {
    redirectWithSaveError(
      "site_pages",
      new Error("A title, slug, and page content are required."),
      value(formData, "id"),
    );
  }

  const item: SitePage = {
    id,
    title,
    slug,
    content,
    metaTitle: value(formData, "metaTitle"),
    metaDescription: value(formData, "metaDescription"),
    status: statusValue(formData),
    createdAt: timestamp(formData),
    updatedAt: new Date().toISOString(),
  };

  try {
    await upsertItem("site_pages", item);
  } catch (error) {
    redirectWithSaveError("site_pages", error, item.id);
  }

  revalidatePath(`/${item.slug}`);
  revalidatePath("/admin/dashboard");
  redirectToAdminSection("site_pages");
}

export async function saveCarRentalPageAction(formData: FormData) {
  const id = value(formData, "id");
  const pageTitle = value(formData, "pageTitle");
  const slug = slugify(value(formData, "slug") || pageTitle);
  const translationGroup = slugify(value(formData, "translationGroup") || slug);

  if (!pageTitle || !slug || !translationGroup || !value(formData, "heroTitle")) {
    redirectWithSaveError(
      "car_rental_pages",
      new Error("Page title, slug, translation group, and hero title are required."),
      id,
    );
  }

  let item: CarRentalPage;

  try {
    item = normalizeCarRentalPageDraft({
      id: id || crypto.randomUUID(),
      language: carRentalLanguageValue(formData),
      slug,
      translationGroup,
      countryName: value(formData, "countryName"),
      countrySlug: slugify(value(formData, "countrySlug") || value(formData, "countryName")),
      cityName: value(formData, "cityName"),
      citySlug: slugify(value(formData, "citySlug") || value(formData, "cityName")),
      pageType: carRentalPageTypeValue(formData),
      status: statusValue(formData),
      pageTitle,
      seoTitle: value(formData, "seoTitle"),
      metaDescription: value(formData, "metaDescription"),
      canonicalUrl: value(formData, "canonicalUrl"),
      ogImage: value(formData, "ogImage"),
      heroTitle: value(formData, "heroTitle"),
      heroSubtitle: value(formData, "heroSubtitle"),
      heroChips: listFromTextarea(formData.get("heroChips")),
      widgetHeading: value(formData, "widgetHeading"),
      widgetIntroText: value(formData, "widgetIntroText"),
      discovercarsWidgetCode: value(formData, "discovercarsWidgetCode") || defaultDiscoverCarsWidgetCode,
      discovercarsAffiliateLink: value(formData, "discovercarsAffiliateLink") || defaultDiscoverCarsAffiliateLink,
      discovercarsAffiliateId: value(formData, "discovercarsAffiliateId") || "top7spots",
      discovercarsChannel: value(formData, "discovercarsChannel") || "locations",
      benefits: parseCarRentalJsonArray(formData, "benefits", "Benefits"),
      vehicleCategoryCards: await vehicleCategoryCardsFromForm(formData),
      descriptionTitle: value(formData, "descriptionTitle"),
      descriptionPreviewText: value(formData, "descriptionPreviewText"),
      descriptionFullText: value(formData, "descriptionFullText"),
      descriptionImage: value(formData, "descriptionImage"),
      popularLocationCards: parseCarRentalJsonArray(formData, "popularLocationCards", "Popular location cards"),
      guideCards: parseCarRentalJsonArray(formData, "guideCards", "Guide cards"),
      destinationCards: parseCarRentalJsonArray(formData, "destinationCards", "Destination cards"),
      directoryGroups: parseCarRentalJsonArray(formData, "directoryGroups", "Directory groups"),
      faqs: parseCarRentalJsonArray(formData, "faqs", "FAQs"),
      createdAt: timestamp(formData),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    redirectWithSaveError("car_rental_pages", error, id);
  }

  try {
    await upsertItem("car_rental_pages", item);
  } catch (error) {
    redirectWithSaveError("car_rental_pages", error, item.id);
  }

  revalidatePath(`/${item.slug}`);
  revalidatePath(`/ar/${item.slug}`);
  revalidatePath("/admin/dashboard");
  redirectToAdminSection("car_rental_pages");
}

export async function importCarRentalPageAction(formData: FormData) {
  const json = String(formData.get("carRentalJson") ?? "").trim();

  if (!json) {
    redirectWithSaveError("car_rental_pages", new Error("Paste one car rental page JSON object."));
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    redirectWithSaveError("car_rental_pages", new Error("Invalid JSON. Check commas, quotes, and braces."));
  }

  const result = normalizeCarRentalImport(parsed as Record<string, unknown>);

  if (!result.ok) {
    redirectWithSaveError("car_rental_pages", new Error(result.errors.join(" ")));
  }

  const status = value(formData, "importStatus");
  const item: CarRentalPage = {
    ...result.page,
    status: status === "published" ? "published" : "draft",
  };

  try {
    await upsertItem("car_rental_pages", item);
  } catch (error) {
    redirectWithSaveError("car_rental_pages", error, item.id);
  }

  revalidatePath(`/${item.slug}`);
  revalidatePath(`/ar/${item.slug}`);
  revalidatePath("/admin/dashboard");
  redirect(`/admin/dashboard?section=car_rental_pages&mode=edit&id=${encodeURIComponent(item.id)}&updated=car_rental_pages`);
}

export async function saveSiteSettingsAction(formData: FormData) {
  try {
    const homeHeroImage = await getImagePathFromForm(formData, {
      fieldName: "homeHeroImage",
      folder: "homepage",
      fallbackName: "home-hero",
    });
    const carRentalCoverImage = await getImagePathFromForm(formData, {
      fieldName: "carRentalCoverImage",
      folder: "car-rental",
      fallbackName: "car-rental-cover",
    });

    const settings: SiteSettings = {
      homeHeroImage,
      homeHeroImageAlt: value(formData, "homeHeroImageAlt"),
      homeHeroOverlayOpacity: String(normalizeHomeHeroOverlayOpacity(value(formData, "homeHeroOverlayOpacity"))),
      homeHeroOverlayStyle: normalizeHomeHeroOverlayStyle(value(formData, "homeHeroOverlayStyle")),
      carRentalCoverImage,
      instagramUrl: value(formData, "instagramUrl"),
      facebookUrl: value(formData, "facebookUrl"),
      youtubeUrl: value(formData, "youtubeUrl"),
      pinterestUrl: value(formData, "pinterestUrl"),
      tiktokUrl: value(formData, "tiktokUrl"),
      twitterUrl: value(formData, "twitterUrl"),
      linkedinUrl: value(formData, "linkedinUrl"),
      contactEmail: value(formData, "contactEmail") || "info@top7spots.com",
      footerDescription: value(formData, "footerDescription"),
      footerTrustText: value(formData, "footerTrustText"),
      copyrightText: value(formData, "copyrightText"),
      newsletterEnabled: checkboxValue(formData, "newsletterEnabled"),
    };

    await saveSiteSettings(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Settings could not be saved.";
    redirect(`/admin/dashboard?section=settings&saveError=${encodeURIComponent(message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  revalidatePath("/sitemap.xml");
  redirect("/admin/dashboard?section=settings&updated=settings");
}
