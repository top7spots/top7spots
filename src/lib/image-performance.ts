// Public Supabase content images should flow through SafeImage/Next Image.
// Do not mark JPG, PNG, or WebP content images as unoptimized.
export const IMAGE_QUALITY = {
  hero: 76,
  card: 72,
  gallery: 74,
  inline: 74,
  thumbnail: 70,
} as const;

export const IMAGE_SIZES = {
  fullHero: "100vw",
  containedHero: "(max-width: 768px) 100vw, 1200px",
  twoColumn: "(max-width: 1024px) 100vw, 50vw",
  threeColumnCard: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  fourColumnCard: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  gallery: "(max-width: 768px) 100vw, 50vw",
  guideInline: "(max-width: 768px) 100vw, 760px",
  thumbnail: "(max-width: 640px) 96px, 128px",
} as const;
