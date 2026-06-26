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

export type GuideType =
  | "best_places"
  | "things_to_do"
  | "itinerary"
  | "day_trip"
  | "road_trip"
  | "practical"
  | "destination_combination"
  | "comparison"
  | "seasonal";

export type GuideSelectedItemType =
  | "destination"
  | "city"
  | "country"
  | "guide"
  | "restaurant"
  | "activity"
  | "custom";

export type GuideSelectedItem = {
  id: string;
  type: GuideSelectedItemType;
  itemId: string;
  itemSlug?: string;
  itemName?: string;
  city?: string;
  displayOrder: number;
  customTitle: string;
  customSummary: string;
  bestFor: string;
  suggestedTime: string;
  nearbyPlaces: string[];
  readMoreLabel: string;
};

export type GuideItineraryItem = {
  id: string;
  dayNumber: number;
  timeSlot: string;
  placeTitle: string;
  destinationId: string;
  details: string;
  travelTime: string;
  displayOrder: number;
};

export type GuideRouteData = {
  startingPoint: string;
  endingPoint: string;
  distance: string;
  travelTime: string;
  bestTransport: string;
  routeNotes: string;
  parkingInfo: string;
};

export type GuideData = {
  itinerary: GuideItineraryItem[];
  route: GuideRouteData;
  [key: string]: unknown;
};

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
  ctaTargetBlank?: boolean;
  ctaRel?: "normal" | "nofollow" | "sponsored";
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
  heroImageAlt: string;
  heroImageCaption: string;
  cardImage: string;
  cardImageAlt: string;
  cardImageCaption: string;
  featuredImage: string;
  featuredImageAlt: string;
  featuredImageCaption: string;
  status: ContentStatus;
  isFeatured: boolean;
  displayOrder: number;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  createdAt: string;
  updatedAt: string;
};

export type GalleryImageItem = {
  src: string;
  alt?: string;
  caption?: string;
  title?: string;
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
  imageAlt: string;
  imageCaption: string;
  galleryImages: string[];
  galleryImagesMetadata: GalleryImageItem[];
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
  guideType: GuideType;
  guideData: GuideData;
  guideSelectedItems: GuideSelectedItem[];
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
  authorId: string;
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

export type AuthorStatus = "active" | "inactive";

export type Author = {
  id: string;
  name: string;
  slug: string;
  role: string;
  shortBio: string;
  fullBio: string;
  profileImage: string;
  profileImageAlt: string;
  expertise: string[];
  location: string;
  websiteUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
  xUrl: string;
  email: string;
  seoTitle: string;
  seoDescription: string;
  status: AuthorStatus;
  displayOrder: number;
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
  imageAlt: string;
  imageCaption: string;
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
  imageAlt: string;
  imageCaption: string;
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
  rating: number;
  source: string;
  reviewUrl: string;
  isPublished: boolean;
  showOnHomepage: boolean;
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

export type CarRentalLanguage = "en" | "ar";
export type CarRentalPageType = "global" | "country" | "city" | "airport" | "";

export type CarRentalBenefit = {
  title: string;
  description: string;
  icon: string;
  sortOrder: number;
};

export type CarRentalLinkCard = {
  title: string;
  url: string;
  description: string;
  image: string;
  label: string;
  sortOrder: number;
  visible: boolean;
};

export type CarRentalVehicleCategoryCard = {
  title: string;
  image: string;
  startingPrice: string;
  buttonText: string;
  sortOrder: number;
  visible: boolean;
};

export type CarRentalDirectoryLink = {
  text: string;
  url: string;
  sortOrder: number;
};

export type CarRentalDirectoryGroup = {
  title: string;
  sortOrder: number;
  links: CarRentalDirectoryLink[];
};

export type CarRentalFaq = {
  question: string;
  answer: string;
  sortOrder: number;
  visible: boolean;
};

export type CarRentalPage = {
  id: string;
  language: CarRentalLanguage;
  slug: string;
  translationGroup: string;
  countryName: string;
  countrySlug: string;
  cityName: string;
  citySlug: string;
  pageType: CarRentalPageType;
  status: ContentStatus;
  pageTitle: string;
  seoTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImage: string;
  heroTitle: string;
  heroSubtitle: string;
  heroChips: string[];
  widgetHeading: string;
  widgetIntroText: string;
  discovercarsWidgetCode: string;
  discovercarsAffiliateLink: string;
  discovercarsAffiliateId: string;
  discovercarsChannel: string;
  benefits: CarRentalBenefit[];
  vehicleCategoryCards: CarRentalVehicleCategoryCard[];
  descriptionTitle: string;
  descriptionPreviewText: string;
  descriptionFullText: string;
  descriptionImage: string;
  popularLocationCards: CarRentalLinkCard[];
  guideCards: CarRentalLinkCard[];
  destinationCards: CarRentalLinkCard[];
  directoryGroups: CarRentalDirectoryGroup[];
  faqs: CarRentalFaq[];
  createdAt: string;
  updatedAt: string;
};

export type SiteSettings = {
  homeHeroImage: string;
  homeHeroImageAlt: string;
  homeHeroOverlayOpacity: string;
  homeHeroOverlayStyle: string;
  carRentalCoverImage: string;
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
  | "authors"
  | "attractions"
  | "restaurants"
  | "homepage_reviews"
  | "homepage_faqs"
  | "site_pages"
  | "car_rental_pages";
