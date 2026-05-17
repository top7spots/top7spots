import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;
let loggedUrlNormalization = false;

export const supabaseStorageBucket = process.env.SUPABASE_STORAGE_BUCKET || "top7spots-media";

export function hasSupabaseConfig() {
  return Boolean(getSupabaseUrl() && getSupabaseKey());
}

export function getSupabaseEnvStatus() {
  const rawSupabaseUrl = getRawSupabaseUrl();
  const supabaseUrl = normalizeSupabaseProjectUrl(rawSupabaseUrl);

  return {
    hasUrl: Boolean(supabaseUrl),
    urlHost: safeUrlHost(supabaseUrl),
    rawUrlPath: safeUrlPath(rawSupabaseUrl),
    normalizedUrlPath: safeUrlPath(supabaseUrl),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    storageBucket: supabaseStorageBucket,
  };
}

export function getSupabaseAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  if (!cachedClient) {
    logUrlNormalization();
    cachedClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: loggingFetch,
      },
    });
  }

  return cachedClient;
}

export function getSupabasePublicUrl(path: string) {
  const supabaseUrl = getSupabaseUrl();

  if (!supabaseUrl) {
    return path;
  }

  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${supabaseStorageBucket}/${path.replace(/^\/+/, "")}`;
}

function getRawSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
}

function getSupabaseUrl() {
  return normalizeSupabaseProjectUrl(getRawSupabaseUrl());
}

function getSupabaseKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

function safeUrlHost(url?: string) {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
}

function safeUrlPath(url?: string) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "invalid-url";
  }
}

function normalizeSupabaseProjectUrl(url?: string) {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url).origin;
  } catch {
    return url.replace(/\/+$/, "");
  }
}

function logUrlNormalization() {
  if (loggedUrlNormalization) {
    return;
  }

  loggedUrlNormalization = true;
  const status = getSupabaseEnvStatus();

  console.info("[Top7Spots Supabase] Client initialized.", status);

  if (status.rawUrlPath && status.rawUrlPath !== "/" && status.rawUrlPath !== status.normalizedUrlPath) {
    console.warn("[Top7Spots Supabase] NEXT_PUBLIC_SUPABASE_URL contained a path and was normalized.", status);
  }
}

async function loggingFetch(input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) {
  const requestUrl = requestUrlFromFetchInput(input);
  const noStoreInit = {
    ...init,
    cache: "no-store",
    next: {
      ...(init as (RequestInit & { next?: Record<string, unknown> }) | undefined)?.next,
      revalidate: 0,
    },
  } as RequestInit;

  if (requestUrl) {
    console.info("[Top7Spots Supabase] Request URL generated.", {
      method: noStoreInit.method || requestMethodFromFetchInput(input) || "GET",
      url: requestUrl,
      cache: noStoreInit.cache,
    });
  }

  return fetch(input, noStoreInit);
}

function requestUrlFromFetchInput(input: Parameters<typeof fetch>[0]) {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.href;
  }

  return input.url;
}

function requestMethodFromFetchInput(input: Parameters<typeof fetch>[0]) {
  if (typeof input === "string" || input instanceof URL) {
    return undefined;
  }

  return input.method;
}
