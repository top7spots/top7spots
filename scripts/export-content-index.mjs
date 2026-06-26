import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "content-index");
const pageSize = 1000;

await loadEnvFile(".env");
await loadEnvFile(".env.local");

const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY before exporting.",
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)+/g, "");

const newestDate = (...values) =>
  values
    .filter(Boolean)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] || "";

const publicStatus = (row) => (row.status === "draft" ? "draft" : "published");
const restaurantStatus = (row) => (row.published ? "published" : "draft");

function makeItem({
  id = "",
  name = "",
  slug = "",
  country = "",
  city = "",
  category = "",
  status = "",
  displayOrder = 0,
  relatedCitySlug = "",
  relatedCountrySlug = "",
  updatedAt = "",
}) {
  return {
    id: String(id || ""),
    name: String(name || ""),
    slug: slugify(slug || name || id),
    country: String(country || ""),
    city: String(city || ""),
    category: String(category || ""),
    status: String(status || ""),
    displayOrder: Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0,
    relatedCitySlug: slugify(relatedCitySlug),
    relatedCountrySlug: slugify(relatedCountrySlug || country),
    updatedAt: String(updatedAt || ""),
  };
}

function byIndexOrder(a, b) {
  if (a.displayOrder !== b.displayOrder) {
    return a.displayOrder - b.displayOrder;
  }

  return a.name.localeCompare(b.name);
}

async function loadEnvFile(fileName) {
  const filePath = path.join(root, fileName);
  let contents = "";

  try {
    contents = await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return;
    }

    throw error;
  }

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function normalizeSupabaseUrl(value) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value.trim()).origin;
  } catch {
    return value.trim().replace(/\/+$/, "");
  }
}

async function fetchAll(table, select) {
  const rows = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase.from(table).select(select).range(from, to);

    if (error) {
      throw new Error(`Failed to export ${table}: ${error.message}`);
    }

    rows.push(...(data || []));

    if (!data || data.length < pageSize) {
      return rows;
    }
  }
}

function buildCountries(cities, destinations, guides, restaurants) {
  const countries = new Map();

  function touchCountry({ country, countrySlug, status, displayOrder, updatedAt }) {
    const slug = slugify(countrySlug || country);

    if (!slug) {
      return;
    }

    const existing = countries.get(slug);
    const next = {
      id: slug,
      name: country || slug,
      slug,
      country: country || "",
      city: "",
      category: "country",
      status:
        existing?.status === "published" || status === "published"
          ? "published"
          : status || existing?.status || "draft",
      displayOrder: Math.min(existing?.displayOrder ?? Number.MAX_SAFE_INTEGER, displayOrder ?? 0),
      relatedCitySlug: "",
      relatedCountrySlug: slug,
      updatedAt: newestDate(existing?.updatedAt, updatedAt),
    };

    countries.set(slug, next);
  }

  for (const city of cities) {
    touchCountry({
      country: city.country,
      countrySlug: city.country,
      status: publicStatus(city),
      displayOrder: city.display_order,
      updatedAt: city.updated_at,
    });
  }

  for (const destination of destinations) {
    const city = cityBySlug.get(slugify(destination.city_slug)) || cityById.get(destination.city_id);
    touchCountry({
      country: city?.country,
      countrySlug: city?.country,
      status: publicStatus(destination),
      displayOrder: destination.display_order,
      updatedAt: destination.updated_at,
    });
  }

  for (const guide of guides) {
    const related = resolveGuideLocation(guide);
    touchCountry({
      country: related.country,
      countrySlug: related.countrySlug,
      status: publicStatus(guide),
      displayOrder: guide.display_order,
      updatedAt: guide.updated_at,
    });
  }

  for (const restaurant of restaurants) {
    const related = resolveRestaurantLocation(restaurant);
    touchCountry({
      country: related.country,
      countrySlug: related.countrySlug,
      status: restaurantStatus(restaurant),
      displayOrder: 0,
      updatedAt: restaurant.updated_at,
    });
  }

  return Array.from(countries.values()).sort(byIndexOrder);
}

function resolveDestinationLocation(row) {
  const citySlug = slugify(row.city_slug);
  const city = cityBySlug.get(citySlug) || cityById.get(row.city_id);
  const country = city?.country || "";

  return {
    city: row.city || city?.name || "",
    citySlug: city?.slug || citySlug,
    country,
    countrySlug: slugify(country),
  };
}

function resolveGuideLocation(row) {
  const targetType = row.target_type || "city";

  if (targetType === "country") {
    const countrySlug = slugify(row.country_id);
    return {
      city: "",
      citySlug: "",
      country: countryNameBySlug.get(countrySlug) || "",
      countrySlug,
    };
  }

  const destination =
    targetType === "destination"
      ? destinationById.get(row.destination_id) || destinationBySlug.get(slugify(row.destination_id))
      : null;
  const citySlug = slugify(destination?.city_slug || row.city_slug);
  const city = cityBySlug.get(citySlug) || cityById.get(destination?.city_id || row.city_id);
  const country = city?.country || "";

  return {
    city: city?.name || destination?.city || "",
    citySlug: city?.slug || citySlug,
    country,
    countrySlug: slugify(country || row.country_id),
  };
}

function resolveRestaurantLocation(row) {
  const city = cityById.get(row.city_id);
  const destination = destinationById.get(row.destination_id);
  const destinationLocation = destination ? resolveDestinationLocation(destination) : null;
  const countrySlug = slugify(row.country_slug || city?.country || destinationLocation?.countrySlug);
  const country = city?.country || destinationLocation?.country || countryNameBySlug.get(countrySlug) || "";

  return {
    city: city?.name || destinationLocation?.city || "",
    citySlug: city?.slug || destinationLocation?.citySlug || "",
    country,
    countrySlug,
  };
}

const [cities, destinations, guides, restaurants] = await Promise.all([
  fetchAll("cities", "id,name,slug,country,status,display_order,updated_at"),
  fetchAll("destinations", "id,name,slug,city,category,status,display_order,city_slug,city_id,updated_at"),
  fetchAll(
    "guides",
    "id,title,slug,category,status,display_order,target_type,country_id,city_slug,city_id,destination_id,updated_at",
  ),
  fetchAll("restaurants", "id,name,slug,cuisine_type,published,city_id,destination_id,country_slug,updated_at"),
]);

const cityById = new Map(cities.map((city) => [city.id, city]));
const cityBySlug = new Map(cities.map((city) => [slugify(city.slug), city]));
const destinationById = new Map(destinations.map((destination) => [destination.id, destination]));
const destinationBySlug = new Map(destinations.map((destination) => [slugify(destination.slug), destination]));
const countryNameBySlug = new Map(
  cities
    .filter((city) => city.country)
    .map((city) => [slugify(city.country), city.country]),
);

const index = {
  countries: buildCountries(cities, destinations, guides, restaurants),
  cities: cities
    .map((city) =>
      makeItem({
        id: city.id,
        name: city.name,
        slug: city.slug,
        country: city.country,
        city: city.name,
        category: "city",
        status: publicStatus(city),
        displayOrder: city.display_order,
        relatedCitySlug: city.slug,
        relatedCountrySlug: city.country,
        updatedAt: city.updated_at,
      }),
    )
    .sort(byIndexOrder),
  destinations: destinations
    .map((destination) => {
      const related = resolveDestinationLocation(destination);

      return makeItem({
        id: destination.id,
        name: destination.name,
        slug: destination.slug,
        country: related.country,
        city: related.city,
        category: destination.category,
        status: publicStatus(destination),
        displayOrder: destination.display_order,
        relatedCitySlug: related.citySlug,
        relatedCountrySlug: related.countrySlug,
        updatedAt: destination.updated_at,
      });
    })
    .sort(byIndexOrder),
  guides: guides
    .map((guide) => {
      const related = resolveGuideLocation(guide);

      return makeItem({
        id: guide.id,
        name: guide.title,
        slug: guide.slug,
        country: related.country,
        city: related.city,
        category: guide.category,
        status: publicStatus(guide),
        displayOrder: guide.display_order,
        relatedCitySlug: related.citySlug,
        relatedCountrySlug: related.countrySlug,
        updatedAt: guide.updated_at,
      });
    })
    .sort(byIndexOrder),
  restaurants: restaurants
    .map((restaurant) => {
      const related = resolveRestaurantLocation(restaurant);

      return makeItem({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        country: related.country,
        city: related.city,
        category: restaurant.cuisine_type,
        status: restaurantStatus(restaurant),
        displayOrder: 0,
        relatedCitySlug: related.citySlug,
        relatedCountrySlug: related.countrySlug,
        updatedAt: restaurant.updated_at,
      });
    })
    .sort(byIndexOrder),
};

await mkdir(outputDir, { recursive: true });

await Promise.all(
  Object.entries(index).map(([name, rows]) =>
    writeFile(path.join(outputDir, `${name}.json`), `${JSON.stringify(rows, null, 2)}\n`, "utf8"),
  ),
);

for (const [name, rows] of Object.entries(index)) {
  console.info(`Exported ${rows.length} ${name} items.`);
}
