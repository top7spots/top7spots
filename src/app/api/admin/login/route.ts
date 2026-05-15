import { NextResponse } from "next/server";
import { isValidAdminLogin, setAdminSessionCookie } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("admin_user") ?? formData.get("email") ?? "");
  const password = String(formData.get("admin_pass") ?? formData.get("password") ?? "");
  const requestUrl = new URL(request.url);

  if (!isValidAdminLogin(email, password)) {
    return NextResponse.redirect(new URL("/admin/login?error=1", requestUrl), 303);
  }

  const response = NextResponse.redirect(new URL("/admin/dashboard", requestUrl), 303);
  setAdminSessionCookie(response);
  return response;
}
