import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { citySaveErrorRedirectPath, saveCityFromForm } from "@/lib/admin-city-save";

export const dynamic = "force-dynamic";

function hasUploadedFile(formData: FormData, fieldName: string) {
  const file = formData.get(`${fieldName}File`);
  return typeof File !== "undefined" && file instanceof File && file.size > 0;
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);

  if (!(await isAdminAuthenticated())) {
    console.warn("[Top7Spots Admin] Unauthorized city save request.", {
      path: requestUrl.pathname,
    });
    return NextResponse.redirect(new URL("/admin/login", requestUrl), 303);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid city save request.";
    console.error("[Top7Spots Admin] City save request parsing failed.", {
      path: requestUrl.pathname,
      message,
    });
    return NextResponse.redirect(
      new URL(`/admin/dashboard?section=cities&saveError=${encodeURIComponent(message)}`, requestUrl),
      303,
    );
  }

  console.info("[Top7Spots Admin] City save request received.", {
    path: requestUrl.pathname,
    hasName: Boolean(String(formData.get("name") ?? "").trim()),
    id: String(formData.get("id") ?? "").trim() || null,
    uploadedFiles: {
      heroImage: hasUploadedFile(formData, "heroImage"),
      cardImage: hasUploadedFile(formData, "cardImage"),
      featuredImage: hasUploadedFile(formData, "featuredImage"),
    },
  });

  const result = await saveCityFromForm(formData);

  if (!result.ok) {
    return NextResponse.redirect(new URL(citySaveErrorRedirectPath(formData, result.message), requestUrl), 303);
  }

  return NextResponse.redirect(new URL("/admin/dashboard?section=cities", requestUrl), 303);
}
