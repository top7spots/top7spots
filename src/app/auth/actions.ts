"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSupabasePublicServerClient,
  safeNextPath,
  syncUserProfile,
} from "@/lib/public-auth";

export async function signInAction(formData: FormData) {
  const email = value(formData, "email");
  const password = value(formData, "password");
  const next = safeNextPath(formData.get("next"));

  if (!email || !password) {
    redirect(`/signin?error=${encodeURIComponent("Enter your email and password.")}&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createSupabasePublicServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect(`/signin?error=${encodeURIComponent(error?.message || "Sign in failed.")}&next=${encodeURIComponent(next)}`);
  }

  await syncUserProfile(data.user);
  redirect(next);
}

export async function signUpAction(formData: FormData) {
  const fullName = value(formData, "fullName");
  const email = value(formData, "email");
  const password = value(formData, "password");
  const next = safeNextPath(formData.get("next"));

  if (!email || !password) {
    redirect(`/signup?error=${encodeURIComponent("Enter your email and password.")}&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createSupabasePublicServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || undefined,
      },
      emailRedirectTo: `${await requestOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  if (data.user && data.session) {
    await syncUserProfile(data.user);
    redirect(next);
  }

  redirect(`/signin?message=${encodeURIComponent("Check your email to confirm your account, then sign in.")}&next=${encodeURIComponent(next)}`);
}

export async function googleSignInAction(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const supabase = await createSupabasePublicServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await requestOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect(`/signin?error=${encodeURIComponent(error?.message || "Google sign in is unavailable.")}&next=${encodeURIComponent(next)}`);
  }

  redirect(data.url);
}

export async function signOutAction() {
  const supabase = await createSupabasePublicServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

function value(formData: FormData, name: string) {
  const field = formData.get(name);
  return typeof field === "string" ? field.trim() : "";
}

async function requestOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const host = headerStore.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}
