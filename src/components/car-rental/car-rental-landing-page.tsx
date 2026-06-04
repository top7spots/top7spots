import Image from "next/image";
import {
  ArrowRight,
  Car,
  CheckCircle2,
  CircleDollarSign,
  Compass,
  Headphones,
  MapPin,
  Plane,
  Route,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { BreadcrumbJsonLd, FAQPageJsonLd, JsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CarRentalFAQ, DiscoverCarsWidget, ReadMoreText } from "@/components/car-rental/car-rental-client";
import { carRentalCanonicalUrl, carRentalPublicPath } from "@/lib/car-rental-pages";
import { resolveImagePath } from "@/lib/images";
import { absoluteImageUrl, absoluteUrl, cleanPath, siteName } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings";
import type { CarRentalLinkCard, CarRentalPage } from "@/lib/types";
import { cn } from "@/lib/utils";

type CarRentalLandingPageProps = {
  page: CarRentalPage;
};

type CompactCardKind = "location" | "guide" | "destination";

export async function CarRentalLandingPage({ page }: CarRentalLandingPageProps) {
  const isRtl = page.language === "ar";
  const publicPath = carRentalPublicPath(page);
  const description = page.metaDescription || page.heroSubtitle || page.descriptionPreviewText;
  const settings = await getSiteSettings();
  const coverImage = settings.carRentalCoverImage;
  const socialImage = page.ogImage || coverImage;
  const locationCards = page.popularLocationCards;

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-[#F4F7FB] text-[#111827]">
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
        <CarRentalTrustBar />
        <CompactCardSection
          eyebrow="Popular rental locations"
          title="Pick up your rental car where it makes sense"
          cards={locationCards}
          kind="location"
          gridClassName="grid-cols-2 lg:grid-cols-4"
        />
        <SimpleTextLinkListings page={page} />
        <CompactCardSection
          eyebrow="Road trip ideas"
          title="Places to visit by rental car"
          cards={page.destinationCards}
          kind="destination"
          gridClassName="grid-cols-2 lg:grid-cols-3"
        />
        <CompactCardSection
          eyebrow="Driving and rental guides"
          title="Plan the practical details before you book"
          cards={page.guideCards}
          kind="guide"
          gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        />
        <CarRentalDescriptionReadMore page={page} isRtl={isRtl} />
        <CarRentalFAQSection page={page} isRtl={isRtl} />
      </main>
      <SiteFooter />
    </div>
  );
}

export function CarRentalHero({
  page,
  coverImage,
}: {
  page: CarRentalPage;
  isRtl: boolean;
  coverImage: string;
}) {
  return (
    <section className="relative z-20 overflow-visible border-b border-blue-950/10 bg-[#071B42]">
      {coverImage ? (
        <Image
          src={resolveImagePath(coverImage)}
          alt={page.pageTitle}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.18]"
        />
      ) : null}
      <div className="absolute inset-0 bg-[#071B42]/88" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(29,78,216,0.28),rgba(255,107,0,0.12)_52%,rgba(7,27,66,0.88))]" />

      <div className="relative z-10 mx-auto grid max-w-[88rem] gap-5 px-4 py-5 pb-7 sm:px-6 sm:py-7 sm:pb-9 lg:grid-cols-[minmax(0,1fr)_470px] lg:items-center lg:px-8 lg:py-9 xl:grid-cols-[minmax(0,1fr)_520px]">
        <div className="py-2 text-white lg:py-5">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-50 ring-1 ring-white/20">
            <Car className="size-3.5" aria-hidden="true" />
            Car rental search
          </p>
          <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            {page.heroTitle || page.pageTitle}
          </h1>
          {page.heroSubtitle ? (
            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/90 sm:text-base">
              {page.heroSubtitle}
            </p>
          ) : null}
          <HeroChips chips={page.heroChips} className="mt-5 hidden lg:flex" />
        </div>
        <CarRentalWidgetCard page={page} />
        <HeroChips chips={page.heroChips} className="lg:hidden" />
      </div>
    </section>
  );
}

export function CarRentalWidgetCard({ page }: { page: CarRentalPage; isRtl?: boolean }) {
  return (
    <aside className="relative z-40 w-full overflow-visible rounded-[1.25rem] border border-white/20 bg-white p-3 shadow-[0_24px_70px_rgb(2_6_23_/_30%)] sm:p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FF6B00]">Compare and book</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#111827]">
            {page.widgetHeading || "Find your rental car"}
          </h2>
          {page.widgetIntroText ? (
            <p className="mt-1 text-xs leading-5 text-slate-500">{page.widgetIntroText}</p>
          ) : null}
        </div>
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1D4ED8]">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
      </div>
      <div className="relative z-50 overflow-visible rounded-xl border border-slate-200 bg-[#fff7e6] p-1.5">
        <DiscoverCarsWidget code={page.discovercarsWidgetCode} />
      </div>
    </aside>
  );
}

function HeroChips({ chips, className }: { chips: string[]; className?: string }) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips.slice(0, 5).map((chip) => (
        <span
          key={chip}
          className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

export function CarRentalTrustBar() {
  const items = [
    { label: "Compare Prices", icon: CircleDollarSign },
    { label: "No Hidden Fees", icon: ShieldCheck },
    { label: "Free Cancellation", icon: CheckCircle2 },
    { label: "Airport Pickup", icon: Plane },
    { label: "Multiple Suppliers", icon: Users },
    { label: "24/7 Support", icon: Headphones },
  ];

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-[88rem] grid-cols-2 gap-2 px-4 py-3 sm:px-6 md:grid-cols-3 lg:grid-cols-6 lg:px-8">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            <item.icon className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CompactCardSection({
  eyebrow,
  title,
  cards,
  kind,
  gridClassName,
}: {
  eyebrow: string;
  title: string;
  cards: CarRentalLinkCard[];
  kind: CompactCardKind;
  gridClassName: string;
}) {
  const visibleCards = cards.filter((card) => card.title && card.url && card.visible !== false);

  if (visibleCards.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[88rem] px-4 py-6 sm:px-6 lg:px-8">
      <SectionIntro eyebrow={eyebrow} title={title} />
      <div className={cn("grid gap-3", gridClassName)}>
        {visibleCards.map((card, index) => (
          <CompactCard key={`${card.title}-${index}`} card={card} kind={kind} />
        ))}
      </div>
    </section>
  );
}

function CompactCard({ card, kind }: { card: CarRentalLinkCard; kind: CompactCardKind }) {
  const showThumbnail = kind === "guide" && Boolean(card.image);

  return (
    <a
      href={card.url}
      className={cn(
        "group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md",
        kind !== "location" && "items-start",
      )}
    >
      {showThumbnail ? (
        <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          <Image src={resolveImagePath(card.image)} alt={card.title} fill sizes="56px" className="object-cover" />
        </span>
      ) : (
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1D4ED8]">
          <CompactIcon kind={kind} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        {card.label ? (
          <span className="line-clamp-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1D4ED8]">
            {card.label}
          </span>
        ) : null}
        <span className="mt-0.5 line-clamp-2 text-sm font-semibold leading-5 text-[#111827] sm:text-base">
          {card.title}
        </span>
        {card.description ? (
          <span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{card.description}</span>
        ) : null}
      </span>
      <ArrowRight className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#1D4ED8] rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
    </a>
  );
}

export function CarRentalDescriptionReadMore({ page, isRtl }: { page: CarRentalPage; isRtl: boolean }) {
  if (!page.descriptionTitle && !page.descriptionPreviewText && !page.descriptionFullText) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[88rem] px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">Why rent a car</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#111827] sm:text-3xl">
          {page.descriptionTitle || page.pageTitle}
        </h2>
        <div className="mt-4 max-w-4xl">
          <ReadMoreText preview={page.descriptionPreviewText} fullText={page.descriptionFullText} isRtl={isRtl} />
        </div>
      </div>
    </section>
  );
}

export function CarRentalFAQSection({ page, isRtl }: { page: CarRentalPage; isRtl: boolean }) {
  if (page.faqs.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[88rem] px-4 py-6 pb-10 sm:px-6 lg:px-8">
      <SectionIntro eyebrow="FAQs" title={`Questions about ${page.pageTitle}`} />
      <CarRentalFAQ faqs={page.faqs} isRtl={isRtl} />
    </section>
  );
}

function SimpleTextLinkListings({ page }: { page: CarRentalPage }) {
  const groups = page.directoryGroups
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => link.text && link.url).sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .filter((group) => group.title && group.links.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[88rem] px-4 py-4 sm:px-6 lg:px-8">
      <SectionIntro eyebrow="Related car rental links" title="Browse more rental pages and travel resources" />
      <div className="grid gap-3 md:grid-cols-2">
        {groups.map((group) => (
          <div key={group.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-base font-semibold text-[#111827]">{group.title}</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {group.links.map((link) => (
                <a
                  key={`${group.title}-${link.url}`}
                  href={link.url}
                  className="group inline-flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#1D4ED8]"
                >
                  <span className="line-clamp-1">{link.text}</span>
                  <ArrowRight className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#1D4ED8] rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionIntro({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#111827] sm:text-3xl">{title}</h2>
      </div>
    </div>
  );
}

function CompactIcon({ kind }: { kind: CompactCardKind }) {
  if (kind === "guide") {
    return <Route className="size-5" aria-hidden="true" />;
  }

  if (kind === "destination") {
    return <Compass className="size-5" aria-hidden="true" />;
  }

  return <MapPin className="size-5" aria-hidden="true" />;
}
