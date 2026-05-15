import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";

const adminCookieName = "top7spots_admin";
const adminCookieValue = "authenticated";
const adminCookieMaxAge = 60 * 60 * 8;
const legacyAdminEmail = `admin@${["xplore", "via.local"].join("")}`;
const adminEmails = ["admin@top7spots.com", legacyAdminEmail];

export function isValidAdminLogin(email: string, password: string) {
  return adminEmails.includes(email.trim()) && password === "oman2026";
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(adminCookieName)?.value === adminCookieValue;
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, adminCookieValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: adminCookieMaxAge,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(adminCookieName);
}

export function setAdminSessionCookie(response: NextResponse) {
  response.cookies.set(adminCookieName, adminCookieValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: adminCookieMaxAge,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.delete(adminCookieName);
}
