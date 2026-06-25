import Link from "next/link";
import { ArrowRight, BookOpen, MapPin } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getGuideHref } from "@/lib/guide-routes";
import { guideImageAlt } from "@/lib/image-seo";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/image-performance";
import { resolveImagePath } from "@/lib/images";
import type { Guide } from "@/lib/types";

type GuideCardProps = {
  guide: Guide;
  cityName?: string;
  href?: string;
  imageSizes?: string;
};

const defaultGuideCardImageSizes = IMAGE_SIZES.threeColumnCard;

export function GuideCard({
  guide,
  cityName,
  href: hrefOverride,
  imageSizes = defaultGuideCardImageSizes,
}: GuideCardProps) {
  const image = resolveImagePath(guide.coverImage || guide.image);
  const href = hrefOverride || getGuideHref(guide);
  const imageAlt = cityName && !guide.coverImageAlt ? `${guideImageAlt(guide)} for ${cityName}` : guideImageAlt(guide);

  return (
    <Card className="group overflow-hidden rounded-xl border-slate-200 bg-white p-0 shadow-[0_18px_50px_rgb(15_23_42_/_8%)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_80px_rgb(15_23_42_/_16%)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <SafeImage
          src={image}
          alt={imageAlt}
          fill
          sizes={imageSizes}
          quality={IMAGE_QUALITY.card}
          className="object-cover transition duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/70 to-transparent" />
        <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#0A2A66] shadow-sm backdrop-blur">
          <BookOpen className="size-3.5" aria-hidden="true" />
          {guide.readTime || "Quick read"}
        </span>
      </div>
      <CardContent className="grid gap-4 p-5">
        <Badge variant="secondary" className="w-fit rounded-full bg-blue-50 text-[#1D4ED8]">
          {guide.category || "Guide"}
        </Badge>
        {cityName ? (
          <span className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-slate-500">
            <MapPin className="size-3.5 text-[#1D4ED8]" aria-hidden="true" />
            {cityName}
          </span>
        ) : null}
        <div>
          <h3 className="text-lg font-semibold leading-tight text-[#111827] sm:text-xl">{guide.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
            {guide.excerpt || "Curated planning notes from the Top7Spots guide library."}
          </p>
        </div>
        <Link
          href={href}
          aria-label={`Read ${guide.title}`}
          className="flex items-center gap-1 text-sm font-semibold text-[#1D4ED8] transition duration-300 hover:text-[#0A2A66] group-hover:translate-x-0.5"
        >
          Read guide
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}

type CompactGuideCardProps = {
  guide: Guide;
  href?: string;
};

export function CompactGuideCard({ guide, href: hrefOverride }: CompactGuideCardProps) {
  const image = resolveImagePath(guide.coverImage || guide.image);
  const href = hrefOverride || getGuideHref(guide);
  const imageAlt = guideImageAlt(guide);

  return (
    <Link
      href={href}
      className="group flex h-full min-w-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#2563EB] hover:shadow-lg sm:min-w-0"
    >
      <div className="relative w-24 shrink-0 bg-slate-100 sm:w-28">
        <SafeImage
          src={image}
          alt={imageAlt}
          fill
          sizes={IMAGE_SIZES.thumbnail}
          quality={IMAGE_QUALITY.thumbnail}
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex min-h-36 flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {guide.category ? <span>{guide.category}</span> : null}
            {guide.readTime ? <span>{guide.readTime}</span> : null}
          </div>
          <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 text-[#111827] group-hover:text-[#1D4ED8]">
            {guide.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
            {guide.excerpt || "Curated planning notes from the Top7Spots guide library."}
          </p>
        </div>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#1D4ED8]">
          Read guide
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
