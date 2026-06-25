import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GuideEntityCardImage } from "@/components/guides/guide-entity-card-image";
import { IMAGE_SIZES } from "@/lib/image-performance";
import { isLocalUpload, resolveImagePath } from "@/lib/images";

export type GuideEntityCardItem = {
  key: string;
  href: string;
  title: string;
  description?: string;
  image?: string;
  type?: string;
  badge?: string;
  imageAlt?: string;
};

type GuideEntityCardProps = {
  item: GuideEntityCardItem;
  imageSizes?: string;
  className?: string;
};

const localImageExistsCache = new Map<string, boolean>();

function hasSafeImageSource(src: string) {
  if (!src) {
    return false;
  }

  if (!isLocalUpload(src)) {
    return true;
  }

  const cached = localImageExistsCache.get(src);
  if (cached !== undefined) {
    return cached;
  }

  const publicRoot = path.resolve(process.cwd(), "public");
  const imagePath = path.resolve(publicRoot, src.replace(/^\/+/, ""));
  const exists = imagePath.startsWith(publicRoot) && existsSync(imagePath);
  localImageExistsCache.set(src, exists);
  return exists;
}

export function GuideEntityCard({
  item,
  imageSizes = IMAGE_SIZES.threeColumnCard,
  className = "",
}: GuideEntityCardProps) {
  const resolvedImage = item.image ? resolveImagePath(item.image) : "";
  const image = hasSafeImageSource(resolvedImage) ? resolvedImage : "";
  const label = item.badge || item.type;

  return (
    <Link
      href={item.href}
      className={`group flex h-[25.75rem] w-[19.5rem] max-w-[86vw] shrink-0 snap-start scroll-ml-4 transform-gpu flex-col overflow-hidden rounded-[1.35rem] bg-white/95 shadow-[0_10px_28px_rgba(15,23,42,0.055)] outline-none ring-1 ring-slate-200/70 transition-[transform,box-shadow] duration-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.075)] motion-safe:hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#FF6B00] sm:h-[26.75rem] sm:w-auto sm:max-w-none ${className}`}
    >
      <div className="relative h-48 overflow-hidden bg-slate-100 sm:h-52">
        <GuideEntityCardImage
          src={image}
          alt={item.imageAlt || item.title}
          label={label || "Top7Spots"}
          sizes={imageSizes}
        />
        {label ? (
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#C24A00] shadow-sm">
            {label}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-3 text-lg font-semibold leading-7 tracking-tight text-[#111827] group-hover:text-[#C24A00]">
          {item.title}
        </h3>
        {item.description ? (
          <p className="mt-3 line-clamp-4 text-[0.95rem] leading-6 text-slate-600">{item.description}</p>
        ) : null}
        <span className="mt-auto inline-flex items-center justify-between gap-3 pt-5 text-sm font-semibold text-[#C24A00]">
          <span>Explore</span>
          <span className="flex size-8 items-center justify-center rounded-full bg-orange-50 text-[#FF6B00] transition-colors group-hover:bg-[#FF6B00] group-hover:text-white">
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </span>
      </div>
    </Link>
  );
}
