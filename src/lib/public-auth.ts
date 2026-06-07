import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase";

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  created_at: string;
  updated_at: string;
};

export function hasPublicAuthConfig() {
  return Boolean(getPublicSupabaseUrl() && getPublicSupabaseAnonKey());
}

export async function createSupabasePublicServerClient() {
  const supabaseUrl = getPublicSupabaseUrl();
  const supabaseAnonKey = getPublicSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase public auth is not configured.");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies; actions and route handlers can.
        }
      },
    },
  });
}

export async function getCurrentUser() {
  if (!hasPublicAuthConfig()) {
    return null;
  }

  try {
    const supabase = await createSupabasePublicServerClient();
    const { data, error } = await supabase.auth.getUser();
    return error ? null : data.user;
  } catch {
    return null;
  }
}

export async function syncUserProfile(user: User) {
  try {
    const supabase = getSupabaseAdminClient();
    const metadata = user.user_metadata || {};
    const provider = typeof user.app_metadata?.provider === "string" ? user.app_metadata.provider : null;
    const fullName = stringMetadata(metadata.full_name) || stringMetadata(metadata.name);
    const avatarUrl = stringMetadata(metadata.avatar_url) || stringMetadata(metadata.picture);

    await supabase.from("user_profiles").upsert(
      {
        id: user.id,
        email: user.email || null,
        full_name: fullName,
        avatar_url: avatarUrl,
        provider,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  } catch (error) {
    console.warn("[Top7Spots Auth] User profile sync skipped.", error);
  }
}

export async function getUserProfile(userId: string) {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle<UserProfile>();

    if (error) {
      console.warn("[Top7Spots Auth] User profile read skipped.", error);
      return null;
    }

    return data;
  } catch (error) {
    console.warn("[Top7Spots Auth] User profile read skipped.", error);
    return null;
  }
}

export function userDisplayName(user: User | null, profile?: UserProfile | null) {
  if (!user) {
    return "";
  }

  return (
    profile?.full_name ||
    stringMetadata(user.user_metadata?.full_name) ||
    stringMetadata(user.user_metadata?.name) ||
    user.email ||
    "Traveler"
  );
}

export function userAvatarUrl(user: User | null, profile?: UserProfile | null) {
  if (!user) {
    return "";
  }

  return (
    profile?.avatar_url ||
    stringMetadata(user.user_metadata?.avatar_url) ||
    stringMetadata(user.user_metadata?.picture)
  );
}

export function userInitials(nameOrEmail: string) {
  const name = nameOrEmail.trim();

  if (!name) {
    return "T";
  }

  const parts = name
    .replace(/@.+$/, "")
    .split(/\s+|[._-]+/)
    .filter(Boolean);

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "T";
}

export function safeNextPath(value: FormDataEntryValue | string | null | undefined, fallback = "/account") {
  if (typeof value !== "string") {
    return fallback;
  }

  const next = value.trim();

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  return next;
}

function stringMetadata(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function getPublicSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!url) {
    return "";
  }

  try {
    return new URL(url).origin;
  } catch {
    return url.replace(/\/+$/, "");
  }
}

function getPublicSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
}
