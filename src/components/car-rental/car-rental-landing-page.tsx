import Image from "next/image";
import { Car, CheckCircle2, Compass, MapPinned, Route, ShieldCheck } from "lucide-react";
import { BreadcrumbJsonLd, FAQPageJsonLd, JsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  CarRentalFAQ,
  DirectoryTabs,
  DiscoverCarsWidget,
  ReadMoreText,
} from "@/components/car-rental/car-rental-client";
import { carRentalCanonicalUrl, carRentalPublicPath } from "@/lib/car-rental-pages";
import { absoluteImageUrl, absoluteUrl, cleanPath, siteName } from "@/lib/seo";
import { resolveImagePath } from "@/lib/images";
import { getSiteSettings } from "@/lib/site-settings";
import type { CarRentalBenefit, CarRentalLinkCard, CarRentalPage } from "@/lib/types";
import { cn } from "@/lib/utils";

type CarRentalLandingPageProps = {
  page: CarRentalPage;
};

export async function CarRentalLandingPage({ page }: CarRentalLandingPageProps) {
  const isRtl = page.language === "ar";
  const publicPath = carRentalPublicPath(page);
  const description = page.metaDescription || page.heroSubtitle || page.descriptionPreviewText;
  const settings = await getSiteSettings();
  const coverImage = settings.carRentalCoverImage;
  const socialImage = page.ogImage || coverImage;

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <BreadcrumbJsonLd items={[{ name: page.pageTitle, path: publicPath }]} />
      <FAQPageJsonLd faqs={page.faqs} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${absoluteUrl(cleanPath(publicPath))}#webpage`,
          name: page.seoTitle || page.pageTitle,
          headline: page.heroTitle || page.pageTitle,
          description,
          url: carRentalCanonicalUrl(page),
          inLanguage: page.language,
          image: absoluteImageUrl(socialImage),
          publisher: {
            "@type": "Organization",
            name: siteName,
          },
        }}
      />
      <SiteHeader />
      <main>
        <CarRentalHero page={page} isRtl={isRtl} coverImage={coverImage} />
        <CarRentalBenefits benefits={page.benefits} />
        <CarRentalDescriptionReadMore page={page} isRtl={isRtl} />
        <CarRentalPopularLocations cards={page.popularLocationCards} isRtl={isRtl} />
        <CarRentalGuideCards cards={page.guideCards} isRtl={isRtl} />
        <CarRentalDestinationCards cards={page.destinationCards} isRtl={isRtl} />
        <CarRentalDirectoryTabs page={page} isRtl={isRtl} />
        <CarRentalFAQSection page={page} isRtl={isRtl} />
      </main>
      <SiteFooter />
    </div>
  );
}

export function CarRentalHero({
  page,
  isRtl,
  coverImage,
}: {
  page: CarRentalPage;
  isRtl: boolean;
  coverImage: string;
}) {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-[88rem] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-8 lg:py-12 xl:grid-cols-[minmax(0,1fr)_500px]">
        <div className="flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
            {isRtl ? "تأجير سيارات" : "Car rental"}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-[#111827] md:text-5xl">
            {page.heroTitle || page.pageTitle}
          </h1>
          {page.heroSubtitle ? (
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
              {page.heroSubtitle}
            </p>
          ) : null}
          {page.heroChips.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2.5">
              {page.heroChips.map((chip) => (
                <span key={chip} className="rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-sm font-semibold text-[#0A2A66]">
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
          {coverImage ? (
            <div className="relative mt-8 min-h-72 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-[0_18px_50px_rgb(15_23_42_/_9%)]">
              <Image
                src={resolveImagePath(coverImage)}
                alt={page.pageTitle}
                fill
                priority
                sizes="(min-width: 1024px) 720px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
            </div>
          ) : null}
        </div>
        <CarRentalWidgetCard page={page} isRtl={isRtl} />
      </div>
    </section>
  );
}

export function CarRentalWidgetCard({ page, isRtl }: { page: CarRentalPage; isRtl: boolean }) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_70px_rgb(15_23_42_/_10%)] sm:p-5">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#FF6B00]">
          {isRtl ? "قارن الأسعار" : "Compare prices"}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#111827]">
          {page.widgetHeading || (isRtl ? "ابحث عن سيارتك" : "Find your rental car")}
        </h2>
        {page.widgetIntroText ? (
          <p className="mt-2 text-sm leading-6 text-slate-600">{page.widgetIntroText}</p>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-[#fff7e6] p-2">
        <DiscoverCarsWidget code={page.discovercarsWidgetCode} />
      </div>
      {page.discovercarsAffiliateLink ? (
        <a
          href={page.discovercarsAffiliateLink}
          rel="nofollow sponsored noopener noreferrer"
          target="_blank"
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#0A2A66] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
        >
          {isRtl ? "فتح DiscoverCars" : "Open DiscoverCars"}
        </a>
      ) : null}
    </aside>
  );
}

export function CarRentalBenefits({ benefits }: { benefits: CarRentalBenefit[] }) {
  if (benefits.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[88rem] px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-3">
        {benefits.map((benefit, index) => (
          <div key={`${benefit.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="inline-flex size-11 items-center justify-center rounded-xl bg-blue-50 text-[#1D4ED8]">
              <BenefitIcon icon={benefit.icon} />
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight text-[#111827]">{benefit.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{benefit.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CarRentalDescriptionReadMore({ page, isRtl }: { page: CarRentalPage; isRtl: boolean }) {
  if (!page.descriptionTitle && !page.descriptionPreviewText && !page.descriptionFullText) {
    return null;
  }

  return (
    <section className="mx-auto grid max-w-[88rem] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
          {isRtl ? "دليل القيادة" : "Driving guide"}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827]">
          {page.descriptionTitle || page.pageTitle}
        </h2>
        <div className="mt-5">
          <ReadMoreText preview={page.descriptionPreviewText} fullText={page.descriptionFullText} isRtl={isRtl} />
        </div>
      </div>
    </section>
  );
}

export function CarRentalPopularLocations({ cards, isRtl }: { cards: CarRentalLinkCard[]; isRtl: boolean }) {
  return <CardSection eyebrow={isRtl ? "مواقع شائعة" : "Popular locations"} title={isRtl ? "مواقع تأجير السيارات" : "Popular Car Rental Locations"} cards={cards} icon="map" />;
}

export function CarRentalGuideCards({ cards, isRtl }: { cards: CarRentalLinkCard[]; isRtl: boolean }) {
  return <CardSection eyebrow={isRtl ? "أدلة مفيدة" : "Helpful guides"} title={isRtl ? "أدلة تأجير سيارات مفيدة" : "Helpful Car Rental Guides"} cards={cards} icon="route" />;
}

export function CarRentalDestinationCards({ cards, isRtl }: { cards: CarRentalLinkCard[]; isRtl: boolean }) {
  return <CardSection eyebrow={isRtl ? "أماكن بالسيارة" : "Road trip ideas"} title={isRtl ? "أماكن للزيارة بسيارة مستأجرة" : "Places to Visit by Rental Car"} cards={cards} icon="compass" />;
}

export function CarRentalDirectoryTabs({ page, isRtl }: { page: CarRentalPage; isRtl: boolean }) {
  if (page.directoryGroups.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[88rem] px-4 py-10 sm:px-6 lg:px-8">
      <SectionIntro eyebrow={isRtl ? "دليل التأجير" : "Rental directory"} title={isRtl ? "روابط تأجير سيارات مفيدة" : "Car Rental Directory"} />
      <DirectoryTabs groups={page.directoryGroups} isRtl={isRtl} />
    </section>
  );
}

export function CarRentalFAQSection({ page, isRtl }: { page: CarRentalPage; isRtl: boolean }) {
  if (page.faqs.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[88rem] px-4 py-10 sm:px-6 lg:px-8">
      <SectionIntro eyebrow={isRtl ? "أسئلة شائعة" : "FAQs"} title={isRtl ? "أسئلة عن تأجير السيارات" : `FAQs about ${page.pageTitle}`} />
      <CarRentalFAQ faqs={page.faqs} isRtl={isRtl} />
    </section>
  );
}

function CardSection({
  eyebrow,
  title,
  cards,
  icon,
}: {
  eyebrow: string;
  title: string;
  cards: CarRentalLinkCard[];
  icon: "map" | "route" | "compass";
}) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[88rem] px-4 py-10 sm:px-6 lg:px-8">
      <SectionIntro eyebrow={eyebrow} title={title} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, index) => (
          <a
            key={`${card.title}-${index}`}
            href={card.url}
            className="group flex min-h-48 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-[0_24px_70px_rgb(15_23_42_/_10%)]"
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
                <CardIcon icon={icon} />
                <span>{card.label || "Car rental"}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#111827]">{card.title}</h2>
              {card.description ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              ) : null}
            </div>
            <span className="mt-5 inline-flex items-center text-sm font-semibold text-[#0A2A66] transition group-hover:text-[#1D4ED8]">
              View page
              <span className="ms-2 transition group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">-&gt;</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function SectionIntro({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#111827]">{title}</h2>
    </div>
  );
}

function BenefitIcon({ icon }: { icon: string }) {
  const normalized = icon.toLowerCase();

  if (normalized.includes("shield") || normalized.includes("safe")) {
    return <ShieldCheck className="size-5" aria-hidden="true" />;
  }

  if (normalized.includes("route") || normalized.includes("road")) {
    return <Route className="size-5" aria-hidden="true" />;
  }

  if (normalized.includes("map") || normalized.includes("location")) {
    return <MapPinned className="size-5" aria-hidden="true" />;
  }

  return <CheckCircle2 className="size-5" aria-hidden="true" />;
}

function CardIcon({ icon }: { icon: "map" | "route" | "compass" }) {
  return (
    <span className={cn("inline-flex size-8 items-center justify-center rounded-full bg-blue-50 text-[#1D4ED8]")}>
      {icon === "map" ? <MapPinned className="size-4" aria-hidden="true" /> : null}
      {icon === "route" ? <Route className="size-4" aria-hidden="true" /> : null}
      {icon === "compass" ? <Compass className="size-4" aria-hidden="true" /> : null}
      {icon === "map" || icon === "route" || icon === "compass" ? null : <Car className="size-4" aria-hidden="true" />}
    </span>
  );
}
