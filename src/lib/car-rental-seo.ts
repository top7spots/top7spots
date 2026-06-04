import type { Metadata } from "next";
import { carRentalCanonicalUrl, carRentalPublicPath } from "@/lib/car-rental-pages";
import { getPublishedCarRentalTranslations } from "@/lib/data";
import { absoluteUrl, cleanPath, seoMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings";
import type { CarRentalPage } from "@/lib/types";

export async function carRentalPageMetadata(page: CarRentalPage): Promise<Metadata> {
  const [translations, settings] = await Promise.all([
    getPublishedCarRentalTranslations(page.translationGroup),
    getSiteSettings(),
  ]);
  const englishPage = translations.find((item) => item.language === "en");
  const arabicPage = translations.find((item) => item.language === "ar");
  const languages: Record<string, string> = {};

  if (englishPage) {
    languages.en = absoluteUrl(cleanPath(carRentalPublicPath(englishPage)));
    languages["x-default"] = languages.en;
  }

  if (arabicPage) {
    languages.ar = absoluteUrl(cleanPath(carRentalPublicPath(arabicPage)));
  }

  return {
    ...seoMetadata({
      title: page.seoTitle || `${page.pageTitle} | Top7Spots`,
      description:
        page.metaDescription ||
        page.heroSubtitle ||
        page.descriptionPreviewText ||
        `Compare rental cars and plan ${page.pageTitle} with Top7Spots.`,
      path: carRentalPublicPath(page),
      image: page.ogImage || settings.carRentalCoverImage,
    }),
    alternates: {
      canonical: carRentalCanonicalUrl(page),
      languages,
    },
  };
}
