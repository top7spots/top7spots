import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase";
import type { SiteSettings } from "@/lib/types";

const siteSettingsTag = "site-settings";

export const defaultSiteSettings: SiteSettings = {
  instagramUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
  pinterestUrl: "",
  tiktokUrl: "",
  twitterUrl: "",
  linkedinUrl: "",
  contactEmail: "info@top7spots.com",
  footerDescription:
    "Top7Spots is a premium travel discovery platform for curated destinations, hidden gems, road trips, luxury stays, beaches, mountains, and unforgettable places around the world.",
  footerTrustText:
    "Helping travelers discover the world through curated destinations and practical travel guides.",
  copyrightText: "Copyright 2026 Top7Spots. All rights reserved.",
  newsletterEnabled: false,
};

const settingKeyMap = {
  instagramUrl: "instagram_url",
  facebookUrl: "facebook_url",
  youtubeUrl: "youtube_url",
  pinterestUrl: "pinterest_url",
  tiktokUrl: "tiktok_url",
  twitterUrl: "twitter_url",
  linkedinUrl: "linkedin_url",
  contactEmail: "contact_email",
  footerDescription: "footer_description",
  footerTrustText: "footer_trust_text",
  copyrightText: "copyright_text",
  newsletterEnabled: "newsletter_enabled",
} satisfies Record<keyof SiteSettings, string>;

type SiteSettingRow = {
  key: string;
  value: string | null;
};

export const getSiteSettings = unstable_cache(readSiteSettings, ["site-settings"], {
  tags: [siteSettingsTag],
  revalidate: 300,
});

export async function saveSiteSettings(settings: SiteSettings) {
  const supabase = getSupabaseAdminClient();
  const updatedAt = new Date().toISOString();
  const rows = Object.entries(settingKeyMap).map(([settingKey, dbKey]) => ({
    key: dbKey,
    value: serializeSettingValue(settings[settingKey as keyof SiteSettings]),
    updated_at: updatedAt,
  }));

  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });

  if (error) {
    throw new Error(`Failed to save site settings: ${error.message}`);
  }

  revalidateTag(siteSettingsTag);
}

async function readSiteSettings(): Promise<SiteSettings> {
  if (!hasSupabaseConfig()) {
    return defaultSiteSettings;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("site_settings").select("key,value");

  if (error) {
    if (isMissingTableError(error)) {
      return defaultSiteSettings;
    }

    console.error("[Top7Spots Settings] Failed to read site settings.", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return defaultSiteSettings;
  }

  return mapRowsToSettings((data || []) as SiteSettingRow[]);
}

function mapRowsToSettings(rows: SiteSettingRow[]): SiteSettings {
  const settings = { ...defaultSiteSettings };
  const rowsByKey = new Map(rows.map((row) => [row.key, row.value ?? ""]));

  for (const [settingKey, dbKey] of Object.entries(settingKeyMap)) {
    const value = rowsByKey.get(dbKey);

    if (value === undefined) {
      continue;
    }

    if (settingKey === "newsletterEnabled") {
      settings.newsletterEnabled = value === "true";
    } else {
      settings[settingKey as Exclude<keyof SiteSettings, "newsletterEnabled">] = value;
    }
  }

  return settings;
}

function serializeSettingValue(value: SiteSettings[keyof SiteSettings]) {
  return typeof value === "boolean" ? String(value) : value;
}

function isMissingTableError(error: { code?: string; message?: string }) {
  const message = String(error.message || "").toLowerCase();
  return error.code === "PGRST205" || message.includes("could not find the table");
}
