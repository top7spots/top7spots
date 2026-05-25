import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CityTopicGuidePage } from "@/components/city-topic-guide-page";
import { getLocalCityDestinations } from "@/lib/city-intelligence";
import {
  getAttractionsByCity,
  getCityBySlug,
  getDestinationsByCity,
  getGuidesByCity,
} from "@/lib/data";
import {
  cityProgrammaticPages,
  citySeoPath,
  getCityProgrammaticContent,
  getCityProgrammaticPage,
  hasMeaningfulCityProgrammaticContent,
} from "@/lib/programmatic-seo";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CitySeoPageProps = {
  params: Promise<{ citySlug: string; seoPage: string }>;
};

export async function generateMetadata({ params }: CitySeoPageProps): Promise<Metadata> {
  const { citySlug, seoPage } = await params;
  const [city, page, destinations, attractions, guides] = await Promise.all([
    getCityBySlug(citySlug),
    Promise.resolve(getCityProgrammaticPage(seoPage)),
    getDestinationsByCity(citySlug),
    getAttractionsByCity(citySlug),
    getGuidesByCity(citySlug),
  ]);

  if (!city || !page || city.status !== "published") {
    return {};
  }
  const localDestinations = getLocalCityDestinations(city, destinations);
  const pageContent = getCityProgrammaticContent(page, {
    destinations: localDestinations,
    attractions,
    guides,
  });
  const hasContent = hasMeaningfulCityProgrammaticContent(page, pageContent);

  return {
    ...seoMetadata({
      title: page.metadataTitle(city),
      description: page.description(city),
      path: citySeoPath(city.slug, page.slug),
      image: city.heroImage || city.featuredImage || city.cardImage,
    }),
    ...(!hasContent ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CitySeoPage({ params }: CitySeoPageProps) {
  const { citySlug, seoPage } = await params;
  const page = getCityProgrammaticPage(seoPage);

  if (!page) {
    notFound();
  }

  const [city, destinations, attractions, guides] = await Promise.all([
    getCityBySlug(citySlug),
    getDestinationsByCity(citySlug),
    getAttractionsByCity(citySlug),
    getGuidesByCity(citySlug),
  ]);

  if (!city || city.status !== "published") {
    notFound();
  }

  const pagePath = citySeoPath(city.slug, page.slug);
  const localDestinations = getLocalCityDestinations(city, destinations);
  const pageContent = getCityProgrammaticContent(page, {
    destinations: localDestinations,
    attractions,
    guides,
  });
  const relatedPages = cityProgrammaticPages.filter((item) => {
    if (item.slug === page.slug) {
      return false;
    }

    return hasMeaningfulCityProgrammaticContent(item, getCityProgrammaticContent(item, {
      destinations: localDestinations,
      attractions,
      guides,
    }));
  });
  const hasContent = hasMeaningfulCityProgrammaticContent(page, pageContent);

  return (
    <CityTopicGuidePage
      city={city}
      page={page}
      pagePath={pagePath}
      pageContent={pageContent}
      relatedPages={relatedPages}
      hasContent={hasContent}
    />
  );
}
