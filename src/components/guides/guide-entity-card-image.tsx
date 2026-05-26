import Image from "next/image";
import { MapPinned } from "lucide-react";

type GuideEntityCardImageProps = {
  src: string;
  alt: string;
  label: string;
  sizes: string;
};

export function GuideEntityCardImage({ src, alt, label, sizes }: GuideEntityCardImageProps) {
  if (!src) {
    return <GuideEntityCardImageFallback label={label} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className="object-cover"
    />
  );
}

function GuideEntityCardImageFallback({ label }: { label: string }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.16),transparent_32%),linear-gradient(135deg,#F8FAFC,#DBEAFE)] px-6 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
      <span className="flex size-10 items-center justify-center rounded-full bg-white/80 shadow-sm">
        <MapPinned className="size-5" aria-hidden="true" />
      </span>
      <span>{label}</span>
    </div>
  );
}
