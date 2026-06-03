export type ContentStatus = "draft" | "published";

export type GuideFaq = {
  question: string;
  answer: string;
};

export type GuideTableOfContentsItem = {
  label: string;
  anchor: string;
};

export type GuideTargetType = "country" | "city" | "destination";

export type GuideListingBlockType =
  | "destinations"
  | "cities"
  | "countries"
  | "guides"
  | "restaurants"
  | "activities"
  | "custom";

export type GuideListingBlockCustomItem = {
  title: string;
  description?: string;
  image?: string;
  href: string;
  badge?: string;
};

export type GuideListingBlock = {
  id: string;
  title: string;
  type: GuideListingBlockType;
  itemIds?: string[];
  customItems?: GuideListingBlockCustomItem[];
};

export type GuideContentBlockType =
  | "hero"
  | "intro"
  | "overview"
  | "selected-destinations"
  | "selected-cities"
  | "selected-countries"
  | "selected-restaurants"
  | "selected-activities"
  | "quick-info"
  | "map"
  | "travel-tips"
  | "warnings"
  | "best-time-to-visit"
  | "cta"
  | "car-rental-cta"
  | "related-guides"
  | "faq"
  | "newsletter-cta";

export type GuideQuickInfoItem = {
  label: string;
  value: string;
};

export type GuideContentBlock = {
  id: string;
  type: GuideContentBlockType;
  title?: string;
  eyebrow?: string;
  body?: string;
  image?: string;
  imageAlt?: string;
  itemIds?: string[];
  quickInfo?: GuideQuickInfoItem[];
  tips?: string[];
  faqs?: GuideFaq[];
  mapEmbedUrl?: string;
  mapLabel?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type City = {
  id: string;
  name: string;
  slug: string;
  country: string;
  countryCode: string;
  region: string;
  shortDescription: string;
  longDescription: string;
  heroImage: string;
  cardImage: string;
  featuredImage: string;
  status: ContentStatus;
  isFeatured: boolean;
  displayOrder: number;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  createdAt: string;
  updatedAt: string;
};

export type Destination = {
  id: string;
  cityId: string;
  citySlug: string;
  slug: string;
  name: string;
  city: string;
  category: string;
  location: string;
  region: string;
  duration: string;
  bestSeason: string;
  image: string;
  galleryImages: string[];
  summary: string;
  description: string;
  highlights: string[];
  practicalInfo: string[];
  howToGo: string;
  travelTips: string[];
  nearbyAttractions: string[];
  faqs: GuideFaq[];
  status: ContentStatus;
  isFeatured: boolean;
  displayOrder: number;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
};

export type Guide = {
  id: string;
  targetType: GuideTargetType;
  countryId: string;
  cityId: string;
  citySlug: string;
  destinationId: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  coverImage: string;
  image: string;
  author: string;
  readTime: string;
  category: string;
  status: ContentStatus;
  isFeatured: boolean;
  displayOrder: number;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  coverImageAlt: string;
  faqs: GuideFaq[];
  relatedGuideSlugs: string[];
  relatedPlaceSlugs: string[];
  tableOfContents: GuideTableOfContentsItem[];
  listingBlocks: GuideListingBlock[];
  contentBlocks: GuideContentBlock[];
  createdAt: string;
  updatedAt: string;
};

export type Attraction = {
  id: string;
  cityId: string;
  citySlug: string;
  name: string;
  slug: string;
  city: string;
  image: string;
  category: string;
  type: string;
  description: string;
  summary: string;
  recommendedTime: string;
  status: ContentStatus;
  displayOrder: number;
  seoTitle: string;
  seoDescription: string;
};

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  image: string;
  cityId: string;
  destinationId: string;
  countrySlug: string;
  cuisineType: string;
  priceRange: string;
  address: string;
  googleMapsUrl: string;
  tags: string[];
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HomepageReview = {
  id: string;
  name: string;
  reviewText: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type HomepageFaq = {
  id: string;
  question: string;
  answer: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SitePage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

export type SiteSettings = {
  homeHeroImage: string;
  homeHeroImageAlt: string;
  homeHeroOverlayOpacity: string;
  homeHeroOverlayStyle: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  pinterestUrl: string;
  tiktokUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  contactEmail: string;
  footerDescription: string;
  footerTrustText: string;
  copyrightText: string;
  newsletterEnabled: boolean;
};

export type AdminCollection =
  | "cities"
  | "destinations"
  | "guides"
  | "attractions"
  | "restaurants"
  | "homepage_reviews"
  | "homepage_faqs"
  | "site_pages";
