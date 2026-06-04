import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CarRentalLandingPage } from "@/components/car-rental/car-rental-landing-page";
import { carRentalPageMetadata } from "@/lib/car-rental-seo";
import { getPublishedCarRentalPage } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ArabicCarRentalPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ArabicCarRentalPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedCarRentalPage("ar", slug);

  return page ? carRentalPageMetadata(page) : {};
}

export default async function ArabicCarRentalPage({ params }: ArabicCarRentalPageProps) {
  const { slug } = await params;
  const page = await getPublishedCarRentalPage("ar", slug);

  if (!page) {
    notFound();
  }

  return <CarRentalLandingPage page={page} />;
}
