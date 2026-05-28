import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SitePageLayout } from "@/components/site-page-layout";
import { seoMetadata } from "@/lib/seo";
import { getPublicTrustPage } from "@/lib/site-pages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublicTrustPage("cookie-policy");

  if (!page) {
    return {};
  }

  return seoMetadata({
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.content.slice(0, 160),
    path: "/cookie-policy",
  });
}

export default async function CookiePolicyPage() {
  const page = await getPublicTrustPage("cookie-policy");

  if (!page) {
    notFound();
  }

  return <SitePageLayout page={page} />;
}
