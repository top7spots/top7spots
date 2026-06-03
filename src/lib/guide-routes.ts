import { slugify } from "@/lib/format";
import type { Guide } from "@/lib/types";

type GuideRouteInput = Pick<Guide, "targetType" | "citySlug" | "slug">;

export function isCityGuide(guide: GuideRouteInput) {
  return guide.targetType === "city" && Boolean(guide.citySlug);
}

export function getGuideHref(guide: GuideRouteInput) {
  const guideSlug = slugify(guide.slug);

  if (isCityGuide(guide)) {
    return `/${slugify(guide.citySlug)}/guides/${guideSlug}`;
  }

  return `/guides/${guideSlug}`;
}

export const getGuideCanonicalPath = getGuideHref;
