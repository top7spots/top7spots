export type ParsedCityImport = Partial<{
  name: string;
  country: string;
  countryCode: string;
  region: string;
  status: "published" | "draft";
  displayOrder: string;
  isFeatured: boolean;
  shortDescription: string;
  longDescription: string;
  seoTitle: string;
  seoDescription: string;
}>;

export type ParsedDestinationImport = Partial<{
  name: string;
  slug: string;
  category: string;
  status: "published" | "draft";
  displayOrder: string;
  isFeatured: boolean;
  citySlug: string;
  location: string;
  region: string;
  image: string;
  galleryImages: string;
  summary: string;
  description: string;
  highlights: string;
  duration: string;
  bestSeason: string;
  howToGo: string;
  practicalInfo: string;
  travelTips: string;
  nearbyAttractions: string;
  faqs: string;
  seoTitle: string;
  seoDescription: string;
}>;

export type ParsedTravelGuideImport = Partial<{
  title: string;
  slug: string;
  category: string;
  author: string;
  readTime: string;
  status: "published" | "draft";
  displayOrder: string;
  isFeatured: boolean;
  guideType: string;
  targetType: "country" | "city" | "destination";
  countryId: string;
  citySlug: string;
  destinationId: string;
  image: string;
  coverImageAlt: string;
  excerpt: string;
  quickAnswer: string;
  content: string;
  selectedDestinations: string;
  selectedCities: string;
  selectedCountries: string;
  selectedRestaurants: string;
  selectedActivities: string;
  selectedGuides: string;
  quickInfo: string;
  bestTimeToVisit: string;
  estimatedCost: string;
  travelTips: string;
  commonMistakes: string;
  faqs: string;
  tableOfContents: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  relatedGuideSlugs: string;
  relatedPlaceSlugs: string;
  guideData: string;
  selectedItems: string;
  itinerary: string;
  route: string;
}>;

const cityFieldAliases: Record<string, keyof ParsedCityImport> = {
  name: "name",
  cityname: "name",
  city: "name",
  country: "country",
  countrycode: "countryCode",
  region: "region",
  status: "status",
  displayorder: "displayOrder",
  order: "displayOrder",
  featured: "isFeatured",
  featuredcity: "isFeatured",
  isfeatured: "isFeatured",
  shortdescription: "shortDescription",
  summary: "shortDescription",
  longdescription: "longDescription",
  description: "longDescription",
  seotitle: "seoTitle",
  seodescription: "seoDescription",
};

const destinationFieldAliases: Record<string, keyof ParsedDestinationImport> = {
  name: "name",
  destinationname: "name",
  spotname: "name",
  destination: "name",
  spot: "name",
  slug: "slug",
  category: "category",
  type: "category",
  status: "status",
  displayorder: "displayOrder",
  order: "displayOrder",
  featured: "isFeatured",
  featuredspot: "isFeatured",
  isfeatured: "isFeatured",
  city: "citySlug",
  cityslug: "citySlug",
  cityassignment: "citySlug",
  location: "location",
  region: "region",
  image: "image",
  mainimage: "image",
  heroimage: "image",
  gallery: "galleryImages",
  galleryimages: "galleryImages",
  summary: "summary",
  shortdescription: "summary",
  description: "description",
  overview: "description",
  longdescription: "description",
  highlights: "highlights",
  duration: "duration",
  besttime: "bestSeason",
  besttimetovisit: "bestSeason",
  bestseason: "bestSeason",
  season: "bestSeason",
  howtogo: "howToGo",
  gettingthere: "howToGo",
  practicalinfo: "practicalInfo",
  practicalinformation: "practicalInfo",
  traveltips: "travelTips",
  tips: "travelTips",
  nearbyattractions: "nearbyAttractions",
  nearby: "nearbyAttractions",
  faqs: "faqs",
  faq: "faqs",
  seotitle: "seoTitle",
  seodescription: "seoDescription",
};

const travelGuideFieldAliases: Record<string, keyof ParsedTravelGuideImport> = {
  title: "title",
  name: "title",
  guidetitle: "title",
  slug: "slug",
  category: "category",
  type: "category",
  author: "author",
  readtime: "readTime",
  readingtime: "readTime",
  status: "status",
  displayorder: "displayOrder",
  order: "displayOrder",
  featured: "isFeatured",
  featuredguide: "isFeatured",
  isfeatured: "isFeatured",
  guidetype: "guideType",
  guidekind: "guideType",
  pagetype: "guideType",
  targettype: "targetType",
  guidebelongsto: "targetType",
  belongsto: "targetType",
  country: "countryId",
  countryid: "countryId",
  city: "citySlug",
  cityslug: "citySlug",
  destination: "destinationId",
  destinationid: "destinationId",
  image: "image",
  heroimage: "image",
  coverimage: "image",
  coverimageurl: "image",
  coverimagealt: "coverImageAlt",
  coveralt: "coverImageAlt",
  excerpt: "excerpt",
  summary: "excerpt",
  shortdescription: "excerpt",
  shortdesc: "excerpt",
  quickanswer: "quickAnswer",
  description: "content",
  longdescription: "content",
  overview: "content",
  content: "content",
  body: "content",
  paragraphs: "content",
  articlebody: "content",
  selecteddestinations: "selectedDestinations",
  selecteditemsselecteddestinations: "selectedItems",
  selecteddestinationsselecteditems: "selectedItems",
  selecteddestinationsitems: "selectedItems",
  destinations: "selectedDestinations",
  places: "selectedDestinations",
  selectedcities: "selectedCities",
  cities: "selectedCities",
  selectedcountries: "selectedCountries",
  countries: "selectedCountries",
  selectedrestaurants: "selectedRestaurants",
  restaurants: "selectedRestaurants",
  selectedactivities: "selectedActivities",
  activities: "selectedActivities",
  attractions: "selectedActivities",
  selectedguides: "selectedGuides",
  guideblocks: "selectedGuides",
  quickinfo: "quickInfo",
  quickfacts: "quickInfo",
  facts: "quickInfo",
  besttime: "bestTimeToVisit",
  besttimetovisit: "bestTimeToVisit",
  bestseason: "bestTimeToVisit",
  estimatedcost: "estimatedCost",
  budget: "estimatedCost",
  cost: "estimatedCost",
  traveltips: "travelTips",
  tips: "travelTips",
  commonmistakes: "commonMistakes",
  mistakes: "commonMistakes",
  warning: "commonMistakes",
  warnings: "commonMistakes",
  faqs: "faqs",
  faq: "faqs",
  tableofcontents: "tableOfContents",
  toc: "tableOfContents",
  seotitle: "seoTitle",
  seodescription: "seoDescription",
  seokeywords: "seoKeywords",
  keywords: "seoKeywords",
  relatedguideslugs: "relatedGuideSlugs",
  relatedguides: "relatedGuideSlugs",
  relatedplaceslugs: "relatedPlaceSlugs",
  relatedplaces: "relatedPlaceSlugs",
  guidedata: "guideData",
  structureddata: "guideData",
  selecteditems: "selectedItems",
  guideselecteditems: "selectedItems",
  structuredselecteditems: "selectedItems",
  selectedstops: "selectedItems",
  stops: "selectedItems",
  itinerary: "itinerary",
  itineraryitems: "itinerary",
  route: "route",
  routedetails: "route",
};

const ignoredSections = new Set([
  "optionalfutureseokeywords",
  "recommendedrelatedinternallinks",
  "relatedinternallinks",
  "internallinks",
  "seo",
  "primarykeyword",
  "primarykeywords",
  "secondarykeyword",
  "secondarykeywords",
  "seokeywords",
  "keywords",
  "notes",
]);

export function parseCityImportContent(input: string): ParsedCityImport {
  return parseStructuredImport(input, cityFieldAliases, assignCityParsedValue);
}

export function parseDestinationImportContent(input: string): ParsedDestinationImport {
  return parseStructuredImport(input, destinationFieldAliases, assignDestinationParsedValue);
}

export function parseTravelGuideImportContent(input: string): ParsedTravelGuideImport {
  return parseStructuredImport(input, travelGuideFieldAliases, assignTravelGuideParsedValue);
}

function parseStructuredImport<T extends object>(
  input: string,
  aliases: Record<string, keyof T>,
  assignParsedValue: (parsed: Partial<T>, field: keyof T, value: string) => void,
): Partial<T> {
  const parsed: Partial<T> = {};
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  let currentField: keyof T | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (!currentField) {
      buffer = [];
      return;
    }

    const value = cleanValue(buffer.join("\n"));
    if (value) {
      assignParsedValue(parsed, currentField, value);
    }

    buffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const headingField = fieldFromMarkdownHeading(line, aliases);

    if (headingField || isIgnoredHeading(line)) {
      flush();
      currentField = headingField;
      continue;
    }

    const colonField = fieldFromColonLabel(line, aliases);
    if (colonField || isIgnoredColonLabel(line)) {
      flush();
      currentField = colonField;
      const inlineValue = line.slice(line.indexOf(":") + 1).trim();
      if (currentField && inlineValue) {
        assignParsedValue(parsed, currentField, inlineValue);
        currentField = null;
      }
      continue;
    }

    if (currentField) {
      buffer.push(rawLine);
    }
  }

  flush();

  return parsed;
}

function assignCityParsedValue(parsed: ParsedCityImport, field: keyof ParsedCityImport, value: string) {
  if (field === "status") {
    parsed.status = normalizeStatus(value);
    return;
  }

  if (field === "isFeatured") {
    parsed.isFeatured = normalizeBoolean(value);
    return;
  }

  if (field === "displayOrder") {
    const number = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(number)) {
      parsed.displayOrder = String(number);
    }
    return;
  }

  parsed[field] = value;
}

function assignDestinationParsedValue(
  parsed: ParsedDestinationImport,
  field: keyof ParsedDestinationImport,
  value: string,
) {
  if (field === "status") {
    parsed.status = normalizeStatus(value);
    return;
  }

  if (field === "isFeatured") {
    parsed.isFeatured = normalizeBoolean(value);
    return;
  }

  if (field === "displayOrder") {
    parsed.displayOrder = normalizeNumberString(value);
    return;
  }

  parsed[field] = value;
}

function assignTravelGuideParsedValue(
  parsed: ParsedTravelGuideImport,
  field: keyof ParsedTravelGuideImport,
  value: string,
) {
  if (field === "status") {
    parsed.status = normalizeStatus(value);
    return;
  }

  if (field === "isFeatured") {
    parsed.isFeatured = normalizeBoolean(value);
    return;
  }

  if (field === "displayOrder") {
    parsed.displayOrder = normalizeNumberString(value);
    return;
  }

  if (field === "targetType") {
    parsed.targetType = normalizeTargetType(value);
    return;
  }

  if (field === "category") {
    parsed.category = cleanInlineGuideLabel(value);
    return;
  }

  if (field === "excerpt") {
    parsed.excerpt = stripTrailingGuideSubsections(value);
    return;
  }

  parsed[field] = value;
}

function fieldFromMarkdownHeading<T extends object>(line: string, aliases: Record<string, keyof T>) {
  const match = line.match(/^#{1,6}\s+(.+?)\s*#*$/);
  if (!match) {
    return null;
  }

  return fieldFromLabel(match[1], aliases);
}

function fieldFromColonLabel<T extends object>(line: string, aliases: Record<string, keyof T>) {
  const colonIndex = line.indexOf(":");
  if (colonIndex < 0) {
    return null;
  }

  return fieldFromLabel(line.slice(0, colonIndex), aliases);
}

function fieldFromLabel<T extends object>(label: string, aliases: Record<string, keyof T>): keyof T | null {
  const normalized = normalizeLabel(label);
  return aliases[normalized] || null;
}

function isIgnoredHeading(line: string) {
  const match = line.match(/^#{1,6}\s+(.+?)\s*#*$/);
  return Boolean(match && ignoredSections.has(normalizeLabel(match[1])));
}

function isIgnoredColonLabel(line: string) {
  const colonIndex = line.indexOf(":");
  return colonIndex >= 0 && ignoredSections.has(normalizeLabel(line.slice(0, colonIndex)));
}

function normalizeLabel(label: string) {
  return label
    .replace(/[*_`[\]()]/g, "")
    .replace(/[-/]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function cleanValue(value: string) {
  return value
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();
}

function cleanInlineGuideLabel(value: string) {
  return stripTrailingGuideSubsections(value).split("\n")[0]?.trim() || "";
}

function stripTrailingGuideSubsections(value: string) {
  return value
    .replace(/(?:Primary Keyword|Primary Keywords|Secondary Keyword|Secondary Keywords|SEO Title|SEO Description|SEO Keywords)\s*:[\s\S]*$/i, "")
    .replace(/(?:Quick Answer|Estimated Cost|Common Mistakes|FAQs?|Frequently Asked Questions)\s*:[\s\S]*$/i, "")
    .trim();
}

function normalizeStatus(value: string): "published" | "draft" {
  return value.trim().toLowerCase() === "draft" ? "draft" : "published";
}

function normalizeBoolean(value: string) {
  return ["1", "true", "yes", "y", "featured", "on"].includes(value.trim().toLowerCase());
}

function normalizeNumberString(value: string) {
  const number = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? String(number) : "";
}

function normalizeTargetType(value: string): "country" | "city" | "destination" {
  const normalized = normalizeLabel(value);

  if (normalized.includes("country")) {
    return "country";
  }

  if (normalized.includes("destination") || normalized.includes("spot")) {
    return "destination";
  }

  return "city";
}
