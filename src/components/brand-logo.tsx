import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  variant?: "light" | "dark";
  useHeaderAsset?: boolean;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function BrandLogo({
  variant = "light",
  useHeaderAsset = false,
  className,
  imageClassName,
  priority = false,
}: BrandLogoProps) {
  const src = useHeaderAsset
    ? variant === "dark"
      ? "/brand/top7spots-header-dark.webp"
      : "/brand/top7spots-header.webp"
    : variant === "dark"
      ? "/brand/top7spots-dark.webp"
      : "/brand/top7spots-light.webp";
  const width = useHeaderAsset ? 220 : 360;
  const height = useHeaderAsset ? (variant === "dark" ? 76 : 69) : variant === "dark" ? 125 : 113;
  const image = (
    <Image
      src={src}
      alt="Top7Spots"
      width={width}
      height={height}
      priority={priority}
      sizes="(min-width: 1024px) 118px, (min-width: 640px) 108px, 98px"
      unoptimized
      className={cn("h-10 w-auto shrink-0 object-contain sm:h-11", imageClassName)}
    />
  );

  return (
    <Link
      href="/"
      className={cn("inline-flex shrink-0 items-center", className)}
      aria-label="Top7Spots home"
    >
      {useHeaderAsset && variant === "light" ? (
        <picture>
          <source media="(max-width: 639px)" srcSet="/brand/top7spots-header-mobile.webp" />
          {image}
        </picture>
      ) : image}
    </Link>
  );
}
