import { NextResponse, type NextRequest } from "next/server";
import { createSupabasePublicServerClient, safeNextPath, syncUserProfile } from "@/lib/public-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));
  const oauthError = requestUrl.searchParams.get("error_description") || requestUrl.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(oauthError)}`, requestUrl.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/signin?error=Missing%20auth%20callback%20code.", requestUrl.origin));
  }

  const supabase = await createSupabasePublicServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin));
  }

  if (data.user) {
    await syncUserProfile(data.user);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
