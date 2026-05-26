import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { resolveImagePath } from "@/lib/images";

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

export function GuideEntityCard({
  item,
  imageSizes = "(min-width: 1024px) 270px, (min-width: 640px) 45vw, 78vw",
  className = "",
}: GuideEntityCardProps) {
  const image = item.image ? resolveImagePath(item.image) : "";
  const label = item.badge || item.type;

  return (
    <Link
      href={item.href}
      className={`group flex h-full min-h-[19rem] w-[17rem] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm outline-none transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-[#1D4ED8] sm:w-auto ${className}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {image ? (
          <Image
            src={image}
            alt={item.imageAlt || item.title}
            fill
            sizes={imageSizes}
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 px-6 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
            {label || "Top7Spots"}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {label ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">{label}</p>
        ) : null}
        <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-6 text-[#111827] group-hover:text-[#1D4ED8]">
          {item.title}
        </h3>
        {item.description ? (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p>
        ) : null}
        <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-[#1D4ED8]">
          Explore
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
