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

const fieldAliases: Record<string, keyof ParsedCityImport> = {
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

const ignoredSections = new Set([
  "optionalfutureseokeywords",
  "recommendedrelatedinternallinks",
  "relatedinternallinks",
  "internallinks",
  "seokeywords",
  "keywords",
  "notes",
]);

export function parseCityImportContent(input: string): ParsedCityImport {
  const parsed: ParsedCityImport = {};
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  let currentField: keyof ParsedCityImport | null = null;
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
    const headingField = fieldFromMarkdownHeading(line);

    if (headingField || isIgnoredHeading(line)) {
      flush();
      currentField = headingField;
      continue;
    }

    const colonField = fieldFromColonLabel(line);
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

function assignParsedValue(parsed: ParsedCityImport, field: keyof ParsedCityImport, value: string) {
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

function fieldFromMarkdownHeading(line: string) {
  const match = line.match(/^#{1,6}\s+(.+?)\s*#*$/);
  if (!match) {
    return null;
  }

  return fieldFromLabel(match[1]);
}

function fieldFromColonLabel(line: string) {
  const colonIndex = line.indexOf(":");
  if (colonIndex < 0) {
    return null;
  }

  return fieldFromLabel(line.slice(0, colonIndex));
}

function fieldFromLabel(label: string): keyof ParsedCityImport | null {
  const normalized = normalizeLabel(label);
  return fieldAliases[normalized] || null;
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

function normalizeStatus(value: string): "published" | "draft" {
  return value.trim().toLowerCase() === "draft" ? "draft" : "published";
}

function normalizeBoolean(value: string) {
  return ["1", "true", "yes", "y", "featured", "on"].includes(value.trim().toLowerCase());
}
