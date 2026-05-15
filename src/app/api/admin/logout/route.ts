import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const response = NextResponse.redirect(new URL("/admin/login", requestUrl), 303);
  clearAdminSessionCookie(response);
  return response;
}
