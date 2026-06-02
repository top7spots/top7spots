import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GuideEntityCardImage } from "@/components/guides/guide-entity-card-image";
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
  imageSizes = "(min-width: 1024px) 360px, (min-width: 640px) calc((100vw - 3rem) / 2), 86vw",
  className = "",
}: GuideEntityCardProps) {
  const resolvedImage = item.image ? resolveImagePath(item.image) : "";
  const image = hasSafeImageSource(resolvedImage) ? resolvedImage : "";
  const label = item.badge || item.type;

  return (
    <Link
      href={item.href}
      className={`group flex h-[26.5rem] w-[19.5rem] max-w-[86vw] shrink-0 snap-start scroll-ml-4 transform-gpu flex-col overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-sm outline-none transition-[transform,border-color,box-shadow] duration-200 hover:border-blue-200 hover:shadow-md motion-safe:hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#1D4ED8] sm:h-[27.5rem] sm:w-auto sm:max-w-none ${className}`}
    >
      <div className="relative h-48 overflow-hidden bg-slate-100 sm:h-52">
        <GuideEntityCardImage
          src={image}
          alt={item.imageAlt || item.title}
          label={label || "Top7Spots"}
          sizes={imageSizes}
        />
        {label ? (
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#0A2A66] shadow-sm">
            {label}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-3 text-xl font-semibold leading-7 tracking-tight text-[#111827] group-hover:text-[#1D4ED8]">
          {item.title}
        </h3>
        {item.description ? (
          <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{item.description}</p>
        ) : null}
        <span className="mt-auto inline-flex items-center justify-between gap-3 pt-5 text-sm font-semibold text-[#1D4ED8]">
          <span>Explore</span>
          <span className="flex size-8 items-center justify-center rounded-full bg-blue-50 text-[#1D4ED8] transition-colors group-hover:bg-[#1D4ED8] group-hover:text-white">
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </span>
      </div>
    </Link>
  );
}
