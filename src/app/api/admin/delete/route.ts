import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteItem } from "@/lib/data";
import type { AdminCollection } from "@/lib/types";

const adminCollections: AdminCollection[] = [
  "cities",
  "destinations",
  "guides",
  "attractions",
  "restaurants",
  "homepage_reviews",
  "homepage_faqs",
  "site_pages",
];

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);

  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL("/admin/login", requestUrl), 303);
  }

  const formData = await request.formData();
  const collection = String(formData.get("collection") ?? "");
  const id = String(formData.get("id") ?? "").trim();
  const redirectTo = safeRedirectPath(String(formData.get("redirectTo") ?? ""), collection);

  if (!isAdminCollection(collection) || !id) {
    return NextResponse.redirect(new URL(redirectTo, requestUrl), 303);
  }

  try {
    await deleteItem(collection, id);
    revalidateDeletedContent(collection, formData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Content could not be deleted.";
    const separator = redirectTo.includes("?") ? "&" : "?";
    return NextResponse.redirect(
      new URL(`${redirectTo}${separator}saveError=${encodeURIComponent(message)}`, requestUrl),
      303,
    );
  }

  return NextResponse.redirect(new URL(redirectTo, requestUrl), 303);
}

function isAdminCollection(collection: string): collection is AdminCollection {
  return adminCollections.includes(collection as AdminCollection);
}

function safeRedirectPath(redirectTo: string, collection: string) {
  if (redirectTo.startsWith("/admin/dashboard")) {
    return redirectTo;
  }

  const section = isAdminCollection(collection) ? collection : "dashboard";
  return `/admin/dashboard?section=${section}`;
}

function revalidateDeletedContent(collection: AdminCollection, formData: FormData) {
  const citySlug = String(formData.get("citySlug") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  revalidatePath("/");
  revalidatePath("/admin/dashboard");

  if (collection === "cities") {
    if (slug) {
      revalidatePath(`/${slug}`);
    }
    return;
  }

  if (citySlug) {
    revalidatePath(`/${citySlug}`);
  }

  if (collection === "destinations") {
    revalidatePath("/destinations");
    if (citySlug && slug) {
      revalidatePath(`/${citySlug}/destinations/${slug}`);
      revalidatePath(`/destinations/${slug}`);
    }
  }

  if (collection === "guides") {
    revalidatePath("/guides");
    if (citySlug && slug) {
      revalidatePath(`/${citySlug}/guides/${slug}`);
      revalidatePath(`/guides/${slug}`);
    }
  }

  if (collection === "attractions" && citySlug && slug) {
    revalidatePath(`/${citySlug}/attractions/${slug}`);
  }

  if (collection === "restaurants" && slug) {
    revalidatePath(`/restaurants/${slug}`);
  }

  if (collection === "site_pages" && slug) {
    revalidatePath(`/${slug}`);
  }
}
