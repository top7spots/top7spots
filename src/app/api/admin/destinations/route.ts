import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  destinationEditRedirectPath,
  destinationListRedirectPath,
  destinationSaveErrorRedirectPath,
  saveDestinationFromForm,
} from "@/lib/admin-destination-save";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);

  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL("/admin/login", requestUrl), 303);
  }

  const formData = await request.formData();
  const result = await saveDestinationFromForm(formData);

  if (!result.ok) {
    return NextResponse.redirect(
      new URL(destinationSaveErrorRedirectPath(formData, result.message, result.id), requestUrl),
      303,
    );
  }

  const redirectPath = result.isCreating
    ? destinationEditRedirectPath(result.destination.id)
    : destinationListRedirectPath();

  return NextResponse.redirect(new URL(redirectPath, requestUrl), 303);
}
