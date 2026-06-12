import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CarRentalLandingPage } from "@/components/car-rental/car-rental-landing-page";
import { carRentalPageMetadata } from "@/lib/car-rental-seo";
import { globalCarRentalSlug } from "@/lib/car-rental-pages";
import { getPublishedCarRentalPage } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedCarRentalPage("en", globalCarRentalSlug);

  return page ? carRentalPageMetadata(page) : {};
}

export default async function GlobalCarRentalPage() {
  const page = await getPublishedCarRentalPage("en", globalCarRentalSlug);

  if (!page) {
    notFound();
  }

  return <CarRentalLandingPage page={page} />;
}
