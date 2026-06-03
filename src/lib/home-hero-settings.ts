export const homeHeroFallbackImage = "/uploads/global/home-hero.webp";
export const homeHeroFallbackAlt = "Scenic global travel landscape";
export const homeHeroDefaultOverlayOpacity = 55;

export const homeHeroOverlayStyleOptions = [
  { value: "blue-dark", label: "Blue dark" },
  { value: "dark", label: "Dark" },
  { value: "warm-sunset", label: "Warm sunset" },
  { value: "gradient", label: "Gradient" },
] as const;

export type HomeHeroOverlayStyle = (typeof homeHeroOverlayStyleOptions)[number]["value"];

const homeHeroOverlayStyleValues = new Set<string>(
  homeHeroOverlayStyleOptions.map((option) => option.value),
);

export function normalizeHomeHeroOverlayOpacity(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseFloat(String(value ?? homeHeroDefaultOverlayOpacity));

  if (!Number.isFinite(parsed)) {
    return homeHeroDefaultOverlayOpacity;
  }

  return Math.min(85, Math.max(0, Math.round(parsed)));
}

export function normalizeHomeHeroOverlayStyle(value: unknown): HomeHeroOverlayStyle {
  const normalized = String(value ?? "").trim();
  return homeHeroOverlayStyleValues.has(normalized)
    ? (normalized as HomeHeroOverlayStyle)
    : "blue-dark";
}

export function homeHeroOverlayClassName(value: unknown) {
  const style = normalizeHomeHeroOverlayStyle(value);

  if (style === "dark") {
    return "bg-slate-950";
  }

  if (style === "warm-sunset") {
    return "bg-[linear-gradient(115deg,#071B38_0%,#1E1B4B_48%,#B45309_100%)]";
  }

  if (style === "gradient") {
    return "bg-[linear-gradient(90deg,rgb(7_27_66_/_94%),rgb(7_27_66_/_72%),rgb(7_27_66_/_36%))]";
  }

  return "bg-[#071B38]";
}
