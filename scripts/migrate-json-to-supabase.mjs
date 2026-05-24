import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "src", "data");
const publicDir = path.join(root, "public");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "top7spots-media";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this migration.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)+/g, "");

const readJson = async (file) => JSON.parse(await readFile(path.join(dataDir, file), "utf8"));

function isLocalUpload(image) {
  return typeof image === "string" && image.startsWith("/uploads/");
}

async function uploadLocalImage(image) {
  if (!isLocalUpload(image)) {
    return image || "";
  }

  const relativePath = image.replace(/^\/uploads\//, "");
  const absolutePath = path.join(publicDir, image.replace(/^\//, ""));

  if (!existsSync(absolutePath)) {
    return image;
  }

  const bytes = await readFile(absolutePath);
  const extension = path.extname(absolutePath).toLowerCase();
  const contentType =
    extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : "image/jpeg";
  const { error } = await supabase.storage.from(bucket).upload(relativePath, bytes, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload ${image}: ${error.message}`);
  }

  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${relativePath}`;
}

async function uploadImageList(images = []) {
  return Promise.all((images || []).map(uploadLocalImage));
}

function stringListValue(value, { splitString = false } = {}) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (splitString && typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function faqValue(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item) => ({
      question: String(item.question || "").trim(),
      answer: String(item.answer || "").trim(),
    }))
    .filter((item) => item.question && item.answer);
}

function tableOfContentsValue(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item) => ({
      label: String(item.label || "").trim(),
      anchor: String(item.anchor || "").trim(),
    }))
    .filter((item) => item.label && item.anchor);
}

async function migrate() {
  const cities = await readJson("cities.json");
  const destinations = await readJson("destinations.json");
  const guides = await readJson("guides.json");
  const attractions = await readJson("attractions.json");

  const cityRows = await Promise.all(
    cities.map(async (city) => ({
      id: city.id,
      name: city.name,
      slug: slugify(city.slug || city.name),
      country: city.country,
      country_code: city.countryCode,
      region: city.region,
      short_description: city.shortDescription,
      long_description: city.longDescription,
      hero_image: await uploadLocalImage(city.heroImage),
      card_image: await uploadLocalImage(city.cardImage),
      featured_image: await uploadLocalImage(city.featuredImage),
      status: city.status,
      is_featured: city.isFeatured,
      display_order: city.displayOrder,
      seo_title: city.seoTitle,
      seo_description: city.seoDescription,
      seo_keywords: city.seoKeywords || [],
      created_at: city.createdAt,
      updated_at: city.updatedAt,
    })),
  );

  const destinationRows = await Promise.all(
    destinations.map(async (destination) => ({
      id: destination.id,
      city_id: destination.cityId,
      city_slug: slugify(destination.citySlug),
      slug: slugify(destination.slug || destination.name),
      name: destination.name,
      city: destination.city,
      category: destination.category,
      location: destination.location,
      region: destination.region,
      duration: destination.duration,
      best_season: destination.bestSeason,
      image: await uploadLocalImage(destination.image),
      gallery_images: await uploadImageList(destination.galleryImages),
      summary: destination.summary,
      description: destination.description,
      highlights: destination.highlights || [],
      practical_info: destination.practicalInfo || [],
      how_to_go: destination.howToGo,
      travel_tips: destination.travelTips || [],
      nearby_attractions: destination.nearbyAttractions || [],
      status: destination.status,
      is_featured: destination.isFeatured,
      display_order: destination.displayOrder,
      seo_title: destination.seoTitle,
      seo_description: destination.seoDescription,
      created_at: destination.createdAt,
      updated_at: destination.updatedAt,
    })),
  );

  const guideRows = await Promise.all(
    guides.map(async (guide) => {
      const image = await uploadLocalImage(guide.image || guide.coverImage);
      const coverImage = await uploadLocalImage(guide.coverImage || guide.image);

      return {
        id: guide.id,
        target_type: guide.targetType || "city",
        country_id: slugify(guide.countryId || ""),
        city_id: guide.cityId || "",
        city_slug: slugify(guide.citySlug || ""),
        destination_id: guide.destinationId || "",
        slug: slugify(guide.slug || guide.title),
        title: guide.title,
        excerpt: guide.excerpt,
        content: guide.content || [],
        cover_image: coverImage,
        image,
        author: guide.author,
        read_time: guide.readTime,
        category: guide.category,
        status: guide.status,
        is_featured: guide.isFeatured,
        display_order: guide.displayOrder,
        seo_title: guide.seoTitle,
        seo_description: guide.seoDescription,
        seo_keywords: stringListValue(guide.seoKeywords, { splitString: true }),
        cover_image_alt: guide.coverImageAlt || "",
        faqs: faqValue(guide.faqs),
        related_guide_slugs: stringListValue(guide.relatedGuideSlugs),
        related_place_slugs: stringListValue(guide.relatedPlaceSlugs),
        table_of_contents: tableOfContentsValue(guide.tableOfContents),
        created_at: guide.createdAt,
        updated_at: guide.updatedAt,
      };
    }),
  );

  const attractionRows = await Promise.all(
    attractions.map(async (attraction) => ({
      id: attraction.id,
      city_id: attraction.cityId,
      city_slug: slugify(attraction.citySlug),
      name: attraction.name,
      slug: slugify(attraction.slug || attraction.name),
      city: attraction.city,
      image: await uploadLocalImage(attraction.image),
      category: attraction.category,
      type: attraction.type || attraction.category,
      description: attraction.description,
      summary: attraction.summary,
      recommended_time: attraction.recommendedTime,
      status: attraction.status,
      display_order: attraction.displayOrder,
      seo_title: attraction.seoTitle,
      seo_description: attraction.seoDescription,
    })),
  );

  for (const [table, rows] of [
    ["cities", cityRows],
    ["destinations", destinationRows],
    ["guides", guideRows],
    ["attractions", attractionRows],
  ]) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });

    if (error) {
      throw new Error(`Failed to upsert ${table}: ${error.message}`);
    }

    console.log(`Migrated ${rows.length} ${table}`);
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
