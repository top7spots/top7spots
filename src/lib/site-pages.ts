import "server-only";

import { getSitePageBySlug } from "@/lib/data";
import type { SitePage } from "@/lib/types";

export const trustPageSlugs = [
  "about",
  "contact",
  "privacy-policy",
  "terms-and-conditions",
  "cookie-policy",
  "disclaimer",
] as const;

export type TrustPageSlug = (typeof trustPageSlugs)[number];

const fallbackPages: Record<TrustPageSlug, SitePage> = {
  about: fallbackPage(
    "About Top7Spots",
    "about",
    "Top7Spots is a curated travel discovery platform built to help travelers find standout destinations, city guides, attractions, and practical trip ideas around the world.",
    "Learn about Top7Spots and how we curate travel discovery pages, guides, and destination ideas.",
  ),
  contact: fallbackPage(
    "Contact Top7Spots",
    "contact",
    "Have a question, correction, partnership idea, or destination suggestion? Send a message and the Top7Spots team will review it.",
    "Contact Top7Spots for questions, corrections, partnerships, and destination suggestions.",
  ),
  "privacy-policy": fallbackPage(
    "Privacy Policy",
    "privacy-policy",
    "This privacy policy explains how Top7Spots may collect, use, and protect information when you use our website. Update this page from the admin CMS with your full legal policy before relying on it in production.",
    "Read the Top7Spots privacy policy.",
  ),
  "terms-and-conditions": fallbackPage(
    "Terms & Conditions",
    "terms-and-conditions",
    "These terms and conditions outline the rules for using Top7Spots. Update this page from the admin CMS with your full legal terms before relying on it in production.",
    "Read the Top7Spots terms and conditions.",
  ),
  "cookie-policy": fallbackPage(
    "Cookie Policy",
    "cookie-policy",
    "This cookie policy explains how Top7Spots may use cookies and similar technologies. Update this page from the admin CMS with your complete cookie policy before relying on it in production.",
    "Read the Top7Spots cookie policy.",
  ),
  disclaimer: fallbackPage(
    "Disclaimer",
    "disclaimer",
    "Top7Spots provides travel information for general discovery and planning. Details can change, so travelers should verify important information before booking or visiting.",
    "Read the Top7Spots travel information disclaimer.",
  ),
};

export async function getPublicTrustPage(slug: TrustPageSlug) {
  const cmsPage = await getSitePageBySlug(slug);

  if (cmsPage) {
    return cmsPage.status === "published" ? cmsPage : undefined;
  }

  return fallbackPages[slug];
}

function fallbackPage(title: string, slug: TrustPageSlug, content: string, metaDescription: string): SitePage {
  return {
    id: slug,
    title,
    slug,
    content,
    metaTitle: title.includes("Top7Spots") ? title : `${title} | Top7Spots`,
    metaDescription,
    status: "published",
    createdAt: "",
    updatedAt: "",
  };
}
