import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  variant?: "light" | "dark";
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function BrandLogo({
  variant = "light",
  className,
  imageClassName,
  priority = false,
}: BrandLogoProps) {
  const src =
    variant === "dark" ? "/brand/top7spots-dark.png" : "/brand/top7spots-light.png";

  return (
    <Link
      href="/"
      className={cn("inline-flex shrink-0 items-center", className)}
      aria-label="Top7Spots home"
    >
      <Image
        src={src}
        alt="Top7Spots"
        width={1220}
        height={497}
        priority={priority}
        sizes="(min-width: 1024px) 220px, (min-width: 640px) 180px, 150px"
        className={cn("h-10 w-auto shrink-0 object-contain sm:h-11", imageClassName)}
      />
    </Link>
  );
}
