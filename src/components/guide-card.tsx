import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { resolveImagePath } from "@/lib/images";
import type { Guide } from "@/lib/types";

type GuideCardProps = {
  guide: Guide;
};

export function GuideCard({ guide }: GuideCardProps) {
  const image = resolveImagePath(guide.coverImage || guide.image);
  const href = `/${guide.citySlug || "muscat"}/guides/${guide.slug}`;
  const imageAlt = `${guide.title} travel guide${guide.citySlug ? ` for ${guide.citySlug}` : ""}`;

  return (
    <Card className="group overflow-hidden rounded-xl border-slate-200 bg-white p-0 shadow-[0_18px_50px_rgb(15_23_42_/_8%)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_80px_rgb(15_23_42_/_16%)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
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
        <div>
          <h3 className="text-lg font-semibold leading-tight text-[#111827] sm:text-xl">{guide.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
            {guide.excerpt || "Curated planning notes from the Top7Spots guide library."}
          </p>
        </div>
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-semibold text-[#1D4ED8] transition duration-300 hover:text-[#0A2A66] group-hover:translate-x-0.5"
        >
          Read guide
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}
