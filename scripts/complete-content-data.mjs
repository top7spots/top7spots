import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Content Data Completion Phase for Top7Spots.
//
// Dry run:
//   npm run content:complete
//
// Apply safe inserts/fills:
//   npm run content:complete -- --apply
//
// Apply plus fix known Oman destination/attraction city relationships:
//   npm run content:complete -- --apply --fix-relationships
//
// Preview or apply one city only:
//   npm run content:complete -- --city=cairo
//   npm run content:complete -- --city=cairo --apply
//
// This script only uses existing Supabase fields. It does not delete rows, change
// schema, rename fields, or overwrite non-placeholder admin content.

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const FIX_RELATIONSHIPS = args.has("--fix-relationships");
const CITY_FILTER = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--city="))
  ?.replace("--city=", "")
  .trim()
  .toLowerCase();
const now = () => new Date().toISOString();

const placeholderPatterns = [
  /^$/,
  /^lmidsm$/i,
  /^Gods Own Country$/i,
  /placeholder/i,
  /future Top7Spots/i,
  /^discover future/i,
  /^coming soon$/i,
  /^tbd$/i,
  /^todo$/i,
  /^Africa$/i,
  /^A historic Nile city for museums, markets, mosques, river views, and access to ancient monuments\.$/i,
  /^Cairo is a dense, energetic city where historic districts, major museums, markets, Islamic architecture, Nile views, and ancient monument routes sit close together\. A good Cairo itinerary balances landmark visits with neighborhood time, early starts, and enough space to move through the city at a realistic pace\.$/i,
  /^Explore Cairo travel ideas for museums, markets, Nile views, historic districts, mosques, and ancient monument routes\.$/i,
];

function loadDotEnv() {
  try {
    const env = readFileSync(".env.local", "utf8");

    for (const line of env.split(/\r?\n/)) {
      const match = line.match(/^([^#=]+)=(.*)$/);

      if (!match) {
        continue;
      }

      const key = match[1].trim();
      let value = match[2].trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Vercel and CI environments usually provide real environment variables.
  }
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isIncomplete(value) {
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  const text = String(value ?? "").trim();
  return placeholderPatterns.some((pattern) => pattern.test(text));
}

function fillScalar(current, next) {
  return isIncomplete(current) ? next : current;
}

function fillArray(current, next) {
  return Array.isArray(current) && current.length > 0 ? current : next;
}

function seoDescription(text) {
  return text.length <= 155 ? text : `${text.slice(0, 152).replace(/\s+\S*$/, "")}...`;
}

function cityRow(city) {
  const slug = city.slug || slugify(city.name);
  return {
    id: city.id || slug,
    name: city.name,
    slug,
    country: city.country,
    country_code: city.countryCode,
    region: city.region,
    short_description: city.shortDescription,
    long_description: city.longDescription,
    hero_image: city.heroImage || "",
    card_image: city.cardImage || "",
    featured_image: city.featuredImage || "",
    status: "published",
    is_featured: city.isFeatured ?? false,
    display_order: city.displayOrder ?? 100,
    seo_title: city.seoTitle || `${city.name}, ${city.country} Travel Guide | Top7Spots`,
    seo_description: city.seoDescription || seoDescription(city.shortDescription),
    seo_keywords: city.seoKeywords || [city.name, city.country, "travel", "destinations"],
    created_at: city.createdAt || now(),
    updated_at: now(),
  };
}

function destinationRow(destination) {
  const slug = destination.slug || slugify(destination.name);
  return {
    id: destination.id || `dst-${slug}`,
    city_id: destination.cityId,
    city_slug: destination.citySlug,
    slug,
    name: destination.name,
    city: destination.city,
    category: destination.category,
    location: destination.location,
    region: destination.region,
    duration: destination.duration,
    best_season: destination.bestSeason,
    image: destination.image || "",
    gallery_images: destination.galleryImages || [],
    summary: destination.summary,
    description: destination.description,
    highlights: destination.highlights || [],
    practical_info: destination.practicalInfo || [],
    how_to_go: destination.howToGo || "",
    travel_tips: destination.travelTips || [],
    nearby_attractions: destination.nearbyAttractions || [],
    faqs: destination.faqs || [],
    status: "published",
    is_featured: destination.isFeatured ?? false,
    display_order: destination.displayOrder ?? 100,
    seo_title: destination.seoTitle || `${destination.name} in ${destination.city} | Top7Spots`,
    seo_description: destination.seoDescription || seoDescription(destination.summary),
    created_at: destination.createdAt || now(),
    updated_at: now(),
  };
}

function guideRow(guide) {
  const slug = guide.slug || slugify(guide.title);
  return {
    id: guide.id || `guide-${slug}`,
    target_type: guide.targetType || "city",
    country_id: slugify(guide.countryId || ""),
    city_id: guide.cityId || "",
    city_slug: slugify(guide.citySlug || ""),
    destination_id: guide.destinationId || "",
    slug,
    title: guide.title,
    category: guide.category,
    read_time: guide.readTime,
    image: guide.image || "",
    cover_image: guide.coverImage || guide.image || "",
    author: guide.author || "Top7Spots Editorial",
    excerpt: guide.excerpt,
    content: guide.content || [],
    status: "published",
    is_featured: guide.isFeatured ?? false,
    display_order: guide.displayOrder ?? 100,
    seo_title: guide.seoTitle || `${guide.title} | Top7Spots`,
    seo_description: guide.seoDescription || seoDescription(guide.excerpt),
    created_at: guide.createdAt || now(),
    updated_at: now(),
  };
}

function attractionRow(attraction) {
  const slug = attraction.slug || slugify(attraction.name);
  return {
    id: attraction.id || `att-${slug}`,
    city_id: attraction.cityId,
    city_slug: attraction.citySlug,
    name: attraction.name,
    slug,
    city: attraction.city,
    image: attraction.image || "",
    category: attraction.category,
    type: attraction.type || attraction.category,
    description: attraction.description,
    summary: attraction.summary || attraction.description,
    recommended_time: attraction.recommendedTime,
    status: "published",
    display_order: attraction.displayOrder ?? 100,
    seo_title: attraction.seoTitle || `${attraction.name} in ${attraction.city} | Top7Spots`,
    seo_description: attraction.seoDescription || seoDescription(attraction.summary || attraction.description),
  };
}

const cityCompletions = [
  cityRow({
    id: "muscat",
    name: "Muscat",
    slug: "muscat",
    country: "Oman",
    countryCode: "OM",
    region: "Muscat Governorate",
    shortDescription: "Oman's coastal capital with souqs, forts, beaches, mountain roads, and warm Gulf light.",
    longDescription:
      "Muscat is a calm, sea-facing capital where old trading neighborhoods, marble mosques, rugged mountains, and easy coastal walks sit close together. It works well as a first base for Oman because travelers can start with Mutrah's waterfront, explore traditional souqs, visit architectural landmarks, and still reach wadis, beaches, and interior road trips without rushing.",
    heroImage: "/uploads/cities/muscat-hero.jpg",
    cardImage: "/uploads/cities/muscat-card.jpg",
    featuredImage: "/uploads/cities/muscat-featured.jpg",
    isFeatured: true,
    displayOrder: 1,
    seoTitle: "Muscat, Oman Travel Guide | Top7Spots",
    seoDescription: "Explore Muscat travel spots, coastal walks, souqs, forts, beaches, mountain routes, and Oman road trip ideas.",
    seoKeywords: ["Muscat", "Oman", "travel", "souqs", "beaches", "wadis"],
  }),
  cityRow({
    id: "salalah",
    name: "Salalah",
    slug: "salalah",
    country: "Oman",
    countryCode: "OM",
    region: "Dhofar Governorate",
    shortDescription: "A southern Oman base for Khareef greenery, frankincense heritage, beaches, wadis, and misty mountain drives.",
    longDescription:
      "Salalah gives Oman a different rhythm from the north. Coconut palms, frankincense heritage, white-sand beaches, and seasonal green hills make it a strong base for exploring Dhofar. During Khareef the region becomes cooler and mistier, while the rest of the year still offers coastal drives, viewpoints, souqs, and relaxed beach days.",
    displayOrder: 7,
    seoTitle: "Salalah, Oman Travel Guide | Top7Spots",
    seoDescription: "Plan Salalah travel with Khareef season ideas, Dhofar beaches, frankincense heritage, wadis, and mountain drives.",
    seoKeywords: ["Salalah", "Dhofar", "Oman", "Khareef", "beaches", "frankincense"],
  }),
  cityRow({
    id: "nizwa",
    name: "Nizwa",
    slug: "nizwa",
    country: "Oman",
    countryCode: "OM",
    region: "Al Dakhiliyah Governorate",
    shortDescription: "A heritage hub for forts, souqs, mountain routes, date palms, and classic interior Oman road trips.",
    longDescription:
      "Nizwa is one of the most useful bases for exploring Oman's interior. The city pairs a landmark fort and traditional souq with easy access to mountain villages, date plantations, Bahla, Jabrin, and the roads toward Jebel Akhdar. It suits travelers who want history, local markets, and scenic drives in the same itinerary.",
    displayOrder: 8,
    seoTitle: "Nizwa, Oman Travel Guide | Top7Spots",
    seoDescription: "Explore Nizwa travel ideas including the fort, souq, mountain routes, heritage villages, and interior Oman drives.",
    seoKeywords: ["Nizwa", "Oman", "fort", "souq", "Al Dakhiliyah", "heritage"],
  }),
  cityRow({
    id: "sur",
    name: "Sur",
    slug: "sur",
    country: "Oman",
    countryCode: "OM",
    region: "South Al Sharqiyah Governorate",
    shortDescription: "A coastal Oman town for dhow heritage, beaches, turtle-watching routes, wadis, and relaxed sea views.",
    longDescription:
      "Sur is a quiet coastal base with a strong maritime identity. Travelers use it for dhow heritage, nearby beaches, Ras Al Jinz, and the dramatic wadi routes between Muscat and the eastern coast. It is especially useful for slower road trips that connect history, wildlife, and the Gulf of Oman coastline.",
    displayOrder: 9,
    seoTitle: "Sur, Oman Travel Guide | Top7Spots",
    seoDescription: "Discover Sur travel ideas, dhow heritage, coastal views, nearby wadis, turtle-watching routes, and Oman road trips.",
    seoKeywords: ["Sur", "Oman", "dhow", "coast", "Ras Al Jinz", "wadis"],
  }),
  cityRow({
    id: "jebel-akhdar",
    name: "Jebel Akhdar",
    slug: "jebel-akhdar",
    country: "Oman",
    countryCode: "OM",
    region: "Al Dakhiliyah Governorate",
    shortDescription: "A mountain area for canyon views, terraced villages, cooler air, spring roses, and slow scenic stays.",
    longDescription:
      "Jebel Akhdar, often called the Green Mountain, is a highland escape above Oman's interior. It is known for cooler temperatures, canyon viewpoints, terraced villages, fruit farms, and spring rose season. The area is best approached with time to slow down, walk between villages, and enjoy the shift from desert heat to mountain air.",
    heroImage: "/uploads/destinations/jebel-akhdar.jpg",
    cardImage: "/uploads/destinations/jebel-akhdar.jpg",
    featuredImage: "/uploads/destinations/jebel-akhdar.jpg",
    displayOrder: 10,
    seoTitle: "Jebel Akhdar, Oman Travel Guide | Top7Spots",
    seoDescription: "Plan Jebel Akhdar travel with mountain viewpoints, terraced villages, rose season, canyon walks, and cool highland stays.",
    seoKeywords: ["Jebel Akhdar", "Oman", "mountains", "rose season", "villages"],
  }),
  cityRow({
    id: "wahiba-sands",
    name: "Wahiba Sands",
    slug: "wahiba-sands",
    country: "Oman",
    countryCode: "OM",
    region: "North Al Sharqiyah Governorate",
    shortDescription: "A desert region for copper dunes, quiet camps, sunrise views, stargazing, and slow overnight escapes.",
    longDescription:
      "Wahiba Sands is one of Oman's most accessible desert experiences. The area works best as an overnight stay, with time for golden-hour dunes, local hospitality, camp dinners, and clear skies after dark. It connects naturally with Nizwa, Sur, and Wadi Bani Khalid on a longer Oman route.",
    heroImage: "/uploads/destinations/wahiba-sands.jpg",
    cardImage: "/uploads/destinations/wahiba-sands.jpg",
    featuredImage: "/uploads/destinations/wahiba-sands.jpg",
    displayOrder: 11,
    seoTitle: "Wahiba Sands, Oman Travel Guide | Top7Spots",
    seoDescription: "Explore Wahiba Sands travel ideas, desert camps, dune views, stargazing, and Oman overnight desert routes.",
    seoKeywords: ["Wahiba Sands", "Oman", "desert", "dunes", "camping"],
  }),
  cityRow({
    id: "sohar",
    name: "Sohar",
    slug: "sohar",
    country: "Oman",
    countryCode: "OM",
    region: "North Al Batinah Governorate",
    shortDescription: "A northern coast city for forts, beaches, markets, and a slower route between Muscat and the UAE border.",
    longDescription:
      "Sohar is a practical and understated stop on Oman's northern coast. It offers coastal walks, fort views, markets, and easy access to Al Batinah road trips. The city suits travelers who want to break up the drive between Muscat and the border while seeing a working Omani coastal city beyond the main tourist route.",
    displayOrder: 12,
    seoTitle: "Sohar, Oman Travel Guide | Top7Spots",
    seoDescription: "Explore Sohar travel ideas including coastal walks, forts, markets, beaches, and northern Oman road trips.",
    seoKeywords: ["Sohar", "Oman", "Al Batinah", "coast", "fort"],
  }),
  cityRow({
    id: "khasab",
    name: "Khasab",
    slug: "khasab",
    country: "Oman",
    countryCode: "OM",
    region: "Musandam Governorate",
    shortDescription: "A Musandam base for fjord-like coastlines, dhow cruises, mountain roads, viewpoints, and quiet harbor views.",
    longDescription:
      "Khasab is the gateway to Musandam's dramatic coastline, where mountains drop sharply into sheltered bays. Travelers come for dhow cruises, viewpoints, rugged drives, and a quieter side of Oman that feels separate from the mainland itinerary. It is a strong choice for water, mountain, and road trip scenery.",
    displayOrder: 13,
    seoTitle: "Khasab, Oman Travel Guide | Top7Spots",
    seoDescription: "Plan Khasab travel with Musandam coastlines, dhow cruises, mountain roads, viewpoints, and harbor stays.",
    seoKeywords: ["Khasab", "Musandam", "Oman", "dhow cruise", "mountains"],
  }),
  cityRow({
    id: "duqm",
    name: "Duqm",
    slug: "duqm",
    country: "Oman",
    countryCode: "OM",
    region: "Al Wusta Governorate",
    shortDescription: "A central Oman coast base for wide beaches, unusual rock landscapes, long drives, and offbeat road trips.",
    longDescription:
      "Duqm is an emerging stop on Oman's central coast, useful for travelers building a longer route between Muscat, Al Wusta, and Dhofar. The appeal is spacious: long beaches, unusual rock formations, quiet roads, and a sense of open distance that suits slow road trips rather than rushed sightseeing.",
    displayOrder: 14,
    seoTitle: "Duqm, Oman Travel Guide | Top7Spots",
    seoDescription: "Explore Duqm travel ideas, central Oman beaches, rock landscapes, coastal drives, and offbeat road trip stops.",
    seoKeywords: ["Duqm", "Oman", "Al Wusta", "beaches", "road trip"],
  }),
  cityRow({
    id: "barka",
    name: "Barka",
    slug: "barka",
    country: "Oman",
    countryCode: "OM",
    region: "South Al Batinah Governorate",
    shortDescription: "A coastal town near Muscat for forts, fish markets, beaches, and easy South Al Batinah day trips.",
    longDescription:
      "Barka is a useful coastal stop west of Muscat, especially for travelers looking for a short day trip or an easy addition to a South Al Batinah route. The town is known for its fort, markets, beaches, and access to nearby coastal communities without needing a complicated itinerary.",
    displayOrder: 15,
    seoTitle: "Barka, Oman Travel Guide | Top7Spots",
    seoDescription: "Discover Barka travel ideas including forts, fish markets, beaches, coastal drives, and easy trips from Muscat.",
    seoKeywords: ["Barka", "Oman", "South Al Batinah", "fort", "beaches"],
  }),
  cityRow({
    id: "dubai",
    name: "Dubai",
    slug: "dubai",
    country: "UAE",
    countryCode: "AE",
    region: "Dubai Emirate",
    shortDescription: "A high-energy Gulf city for skyline views, beaches, desert routes, dining districts, and design-forward stays.",
    longDescription:
      "Dubai brings together modern architecture, beach districts, desert day trips, family attractions, food-led neighborhoods, and polished hotel stays. A useful Top7Spots Dubai guide should help travelers balance famous viewpoints with slower waterfront walks, cultural districts, and practical ways to connect the city with the surrounding desert.",
    isFeatured: true,
    displayOrder: 2,
    seoTitle: "Dubai, UAE Travel Guide | Top7Spots",
    seoDescription: "Explore Dubai travel ideas for skyline views, beaches, desert routes, food districts, cultural areas, and city breaks.",
    seoKeywords: ["Dubai", "UAE", "travel", "skyline", "beaches", "desert"],
  }),
  cityRow({
    id: "istanbul",
    name: "Istanbul",
    slug: "istanbul",
    country: "Turkey",
    countryCode: "TR",
    region: "Marmara Region",
    shortDescription: "A layered city of Bosphorus views, historic quarters, markets, food culture, and timeless landmarks.",
    longDescription:
      "Istanbul rewards travelers who move between neighborhoods rather than rushing only between landmarks. Historic mosques, palace gardens, ferries, markets, galleries, cafes, and Bosphorus viewpoints all sit within a city shaped by both Europe and Asia. The best itineraries leave room for street-level wandering as much as major sights.",
    isFeatured: true,
    displayOrder: 3,
    seoTitle: "Istanbul, Turkey Travel Guide | Top7Spots",
    seoDescription: "Explore Istanbul travel ideas for Bosphorus views, historic neighborhoods, markets, food, ferries, and landmarks.",
    seoKeywords: ["Istanbul", "Turkey", "travel", "Bosphorus", "markets", "historic city"],
  }),
  cityRow({
    id: "bali",
    name: "Bali",
    slug: "bali",
    country: "Indonesia",
    countryCode: "ID",
    region: "Bali Province",
    shortDescription: "A tropical travel classic for beaches, temples, rice terraces, wellness stays, and scenic road trips.",
    longDescription:
      "Bali works best when treated as a collection of distinct regions: beach towns, temple routes, rice terraces, surf breaks, waterfalls, and quiet inland stays. A strong Bali itinerary balances popular coastal areas with culture, nature, and enough time to avoid turning every day into a long transfer.",
    isFeatured: true,
    displayOrder: 4,
    seoTitle: "Bali, Indonesia Travel Guide | Top7Spots",
    seoDescription: "Plan Bali travel with beaches, temples, rice terraces, waterfalls, wellness stays, and scenic island routes.",
    seoKeywords: ["Bali", "Indonesia", "travel", "beaches", "temples", "rice terraces"],
  }),
  cityRow({
    id: "london",
    name: "London",
    slug: "london",
    country: "UK",
    countryCode: "GB",
    region: "England",
    shortDescription: "A global capital for neighborhoods, culture, parks, museums, food markets, and stylish city breaks.",
    longDescription:
      "London is strongest when explored by neighborhood. Museums, royal parks, markets, historic streets, river walks, theatres, and food halls give visitors many different ways to shape a city break. A useful London guide should connect major sights with quieter local areas and simple routes across the city.",
    isFeatured: true,
    displayOrder: 5,
    seoTitle: "London, UK Travel Guide | Top7Spots",
    seoDescription: "Explore London travel ideas for neighborhoods, museums, parks, markets, river walks, food, and city breaks.",
    seoKeywords: ["London", "UK", "travel", "museums", "parks", "markets"],
  }),
  cityRow({
    id: "kuala-lumpur",
    name: "Kuala Lumpur",
    slug: "kuala-lumpur",
    country: "Malaysia",
    countryCode: "MY",
    region: "Federal Territory",
    shortDescription: "A modern Southeast Asian hub for skyline views, food culture, temples, markets, and green escapes.",
    longDescription:
      "Kuala Lumpur blends skyline viewpoints, lively food districts, traditional markets, temples, malls, and easy green escapes. It suits short city breaks as well as longer Malaysia routes, especially when travelers plan around neighborhoods and keep time for food, transit, and nearby nature.",
    isFeatured: true,
    displayOrder: 6,
    seoTitle: "Kuala Lumpur, Malaysia Travel Guide | Top7Spots",
    seoDescription: "Explore Kuala Lumpur travel ideas for skyline views, food districts, temples, markets, parks, and Malaysia city breaks.",
    seoKeywords: ["Kuala Lumpur", "Malaysia", "travel", "food", "skyline", "markets"],
  }),
  cityRow({
    id: "kerala",
    name: "Kerala",
    slug: "kerala",
    country: "India",
    countryCode: "IN",
    region: "South India",
    shortDescription: "A South India travel region for backwaters, beaches, hill stations, spice routes, wildlife, and slow journeys.",
    longDescription:
      "Kerala is a diverse travel region shaped by backwaters, coconut-lined beaches, tea hills, spice-growing areas, wildlife reserves, and historic port towns. It is best planned as a slow route, with time to connect coastal stays, inland landscapes, local food, and cultural stops without overpacking the itinerary.",
    isFeatured: true,
    displayOrder: 7,
    seoTitle: "Kerala, India Travel Guide | Top7Spots",
    seoDescription: "Plan Kerala travel with backwaters, beaches, hill stations, spice routes, wildlife areas, and South India itineraries.",
    seoKeywords: ["Kerala", "India", "travel", "backwaters", "beaches", "hill stations"],
  }),
  cityRow({
    id: "cairo",
    name: "Cairo",
    slug: "cairo",
    country: "Egypt",
    countryCode: "EG",
    region: "Cairo Governorate",
    shortDescription: "Egypt's energetic capital for ancient monuments, Nile views, historic mosques, museums, markets, and neighborhood wandering.",
    longDescription:
      "Cairo is one of the world's great historic capitals, where ancient monument routes, Nile-side neighborhoods, Islamic architecture, Coptic heritage, museums, markets, and everyday street life sit close together. A strong Cairo itinerary balances Giza and museum time with slower walks through old districts, mosque courtyards, coffee stops, river views, and local shopping streets. The city is dense and layered, so Top7Spots keeps Cairo content organized around practical destination pages, historic areas, and first-time travel guides.",
    isFeatured: true,
    displayOrder: 16,
    seoTitle: "Cairo, Egypt Travel Guide: Best Places to Visit | Top7Spots",
    seoDescription: "Explore Cairo travel ideas for Giza, museums, Nile views, Islamic Cairo, Coptic Cairo, markets, mosques, and first-time itineraries.",
    seoKeywords: ["Cairo", "Egypt", "travel", "Giza", "Nile", "museums", "Islamic Cairo", "Coptic Cairo"],
  }),
];

const destinationCompletions = [
  destinationRow({
    id: "dst-muscat-mutrah",
    cityId: "muscat",
    citySlug: "muscat",
    slug: "mutrah-corniche",
    name: "Mutrah Corniche",
    city: "Muscat",
    region: "Muscat Governorate",
    category: "Coastal city walk",
    location: "Mutrah, Muscat",
    duration: "2-4 hours",
    bestSeason: "October to April",
    image: "/uploads/destinations/mutrah-corniche.jpg",
    galleryImages: ["/uploads/destinations/mutrah-corniche-gallery-1.jpg"],
    summary: "A waterfront promenade framed by old merchant houses, frankincense stalls, harbor views, and evening walks.",
    description:
      "Mutrah Corniche is one of Muscat's easiest first-day experiences. Walk the waterfront, browse Mutrah Souq, pause for harbor views, then climb toward nearby viewpoints when the late-day light softens over the sea and old town.",
    highlights: ["Mutrah Souq", "Harbor viewpoints", "Evening waterfront walks"],
    practicalInfo: ["Arrive near sunset for cooler weather", "Carry small cash for souq purchases", "Dress modestly in market areas"],
    howToGo: "Mutrah is a short drive from central Muscat and is easy to combine with Old Muscat, the National Museum area, or a coastal evening route.",
    travelTips: ["Visit late afternoon for better light", "Keep bargaining friendly and unhurried", "Use comfortable shoes for the corniche and steps"],
    nearbyAttractions: ["Sultan Qaboos Grand Mosque", "Bimmah Sinkhole"],
    isFeatured: true,
    displayOrder: 1,
  }),
  destinationRow({
    id: "dst-jebel-akhdar",
    cityId: "jebel-akhdar",
    citySlug: "jebel-akhdar",
    slug: "jebel-akhdar",
    name: "Jebel Akhdar",
    city: "Jebel Akhdar",
    region: "Al Dakhiliyah Governorate",
    category: "Mountain escape",
    location: "Jebel Akhdar, Al Dakhiliyah",
    duration: "Full day or overnight",
    bestSeason: "October to April; spring for rose season",
    image: "/uploads/destinations/jebel-akhdar.jpg",
    galleryImages: ["/uploads/destinations/jebel-akhdar-gallery-1.jpg"],
    summary: "Terraced villages, canyon views, rose farms, and cool mountain air high above central Oman.",
    description:
      "Jebel Akhdar rewards travelers with cooler temperatures, old stone villages, balcony trails, fruit terraces, and dramatic canyon views. It works well as a slower mountain stay or a carefully planned full-day trip from the interior.",
    highlights: ["Canyon viewpoints", "Terraced villages", "Spring rose season"],
    practicalInfo: ["A 4WD is required at the mountain checkpoint", "Bring a light layer for evenings", "Book meals or stays early in busy periods"],
    howToGo: "Most travelers approach from Nizwa or Birkat Al Mouz. Check vehicle requirements before driving up the mountain road.",
    travelTips: ["Start early for clearer views", "Respect village paths and farms", "Allow extra time for mountain driving"],
    nearbyAttractions: ["Nizwa Fort", "Bahla Fort"],
    isFeatured: true,
    displayOrder: 2,
  }),
  destinationRow({
    id: "dst-wahiba-sands",
    cityId: "wahiba-sands",
    citySlug: "wahiba-sands",
    slug: "wahiba-sands",
    name: "Wahiba Sands",
    city: "Wahiba Sands",
    region: "North Al Sharqiyah Governorate",
    category: "Desert experience",
    location: "Near Bidiyah, North Al Sharqiyah",
    duration: "Overnight",
    bestSeason: "November to March",
    image: "/uploads/destinations/wahiba-sands.jpg",
    galleryImages: ["/uploads/destinations/wahiba-sands-gallery-1.jpg"],
    summary: "Rolling copper dunes, quiet camps, sunrise views, and star-heavy skies in Oman's eastern desert.",
    description:
      "Wahiba Sands is ideal for a slow overnight desert experience. Arrive before golden hour, settle into a camp or guided transfer, watch the dunes shift color, and wake early for cool air and quiet sunrise views.",
    highlights: ["Golden-hour dunes", "Desert camps", "Sunrise and stargazing"],
    practicalInfo: ["Use an experienced driver for dune routes", "Pack warm layers in winter", "Confirm camp transfers before arrival"],
    howToGo: "The common approach is via Bidiyah, where many camps arrange meeting points or transfers into the dunes.",
    travelTips: ["Avoid self-driving deep into dunes without experience", "Carry water and sun protection", "Plan arrival before dark"],
    nearbyAttractions: ["Wadi Shab", "Sur"],
    isFeatured: true,
    displayOrder: 3,
  }),
  destinationRow({
    id: "dst-salalah",
    cityId: "salalah",
    citySlug: "salalah",
    slug: "salalah-khareef",
    name: "Salalah Khareef",
    city: "Salalah",
    region: "Dhofar Governorate",
    category: "Seasonal nature",
    location: "Salalah and Dhofar",
    duration: "3-5 days",
    bestSeason: "June to September",
    image: "/uploads/destinations/salalah-khareef.jpg",
    galleryImages: ["/uploads/destinations/salalah-khareef-gallery-1.jpg"],
    summary: "Mist, waterfalls, coconut palms, and green hills during Oman's distinctive southern monsoon season.",
    description:
      "During Khareef, Salalah and Dhofar feel completely different from northern Oman. Misty hills, seasonal waterfalls, beach viewpoints, frankincense heritage, and cooler air create a slower summer route focused on nature and atmosphere.",
    highlights: ["Misty mountain drives", "Seasonal waterfalls", "Frankincense heritage"],
    practicalInfo: ["Reserve accommodation early for Khareef", "Expect fog in the hills", "Plan extra time on wet or busy roads"],
    howToGo: "Fly or drive to Salalah, then use the city as a base for Dhofar beaches, wadis, viewpoints, and heritage sites.",
    travelTips: ["Carry a light rain layer in Khareef", "Check road visibility before hill drives", "Balance popular viewpoints with quieter coast stops"],
    nearbyAttractions: [],
    isFeatured: true,
    displayOrder: 4,
  }),
  destinationRow({
    id: "dst-wadi-shab",
    cityId: "sur",
    citySlug: "sur",
    slug: "wadi-shab",
    name: "Wadi Shab",
    city: "Sur",
    region: "South Al Sharqiyah Governorate",
    category: "Wadi adventure",
    location: "Near Tiwi, South Al Sharqiyah",
    duration: "Half day",
    bestSeason: "October to April",
    image: "/uploads/destinations/wadi-shab.jpg",
    galleryImages: ["/uploads/destinations/wadi-shab-gallery-1.jpg"],
    summary: "A canyon hike with turquoise pools, palm pockets, and swimming sections near the Muscat-Sur coast road.",
    description:
      "Wadi Shab combines a short boat crossing, rocky walking, and clear pools between canyon walls. It is best planned as an active half day with proper footwear, dry storage, and close attention to weather conditions.",
    highlights: ["Turquoise pools", "Canyon walking", "Palm-lined wadi scenery"],
    practicalInfo: ["Wear water-friendly shoes", "Keep valuables dry", "Avoid visiting during or after heavy rain warnings"],
    howToGo: "Most visitors stop at Wadi Shab while driving between Muscat and Sur. Start early to avoid the hottest part of the day.",
    travelTips: ["Bring only what you can keep dry", "Check local conditions before swimming", "Leave enough time for the return walk"],
    nearbyAttractions: ["Ras Al Jinz Turtle Reserve", "Bimmah Sinkhole"],
    isFeatured: true,
    displayOrder: 5,
  }),
  destinationRow({
    id: "dst-nizwa-fort",
    cityId: "nizwa",
    citySlug: "nizwa",
    slug: "nizwa-fort",
    name: "Nizwa Fort",
    city: "Nizwa",
    region: "Al Dakhiliyah Governorate",
    category: "Heritage landmark",
    location: "Nizwa, Al Dakhiliyah",
    duration: "2-3 hours",
    bestSeason: "October to April",
    image: "/uploads/destinations/nizwa-fort.jpg",
    galleryImages: ["/uploads/destinations/nizwa-fort-gallery-1.jpg"],
    summary: "A monumental circular tower, old souq lanes, and a gateway into Oman's interior heritage routes.",
    description:
      "Nizwa Fort anchors one of Oman's most rewarding heritage stops. Pair the tower and courtyards with the nearby souq, then use Nizwa as a base for mountain drives, villages, and fort routes across Al Dakhiliyah.",
    highlights: ["Fort tower views", "Nizwa Souq", "Interior heritage routes"],
    practicalInfo: ["Go early for quieter courtyards", "Friday market starts very early", "Combine with Bahla or Jabrin for a longer loop"],
    howToGo: "Nizwa is usually reached by road from Muscat or as part of an interior Oman route through Al Dakhiliyah.",
    travelTips: ["Leave time for the souq after the fort", "Use sun protection in open courtyards", "Check opening hours before a long drive"],
    nearbyAttractions: ["Bahla Fort", "Jebel Akhdar"],
    isFeatured: true,
    displayOrder: 6,
  }),
  destinationRow({
    id: "dst-sur-ras-al-jinz",
    cityId: "sur",
    citySlug: "sur",
    slug: "ras-al-jinz-turtle-reserve",
    name: "Ras Al Jinz Turtle Reserve",
    city: "Sur",
    region: "South Al Sharqiyah Governorate",
    category: "Wildlife",
    location: "Ras Al Jinz, near Sur",
    duration: "Evening or overnight",
    bestSeason: "Year-round with seasonal variation",
    image: "/uploads/attractions/ras-al-jinz-turtle-reserve.jpg",
    summary: "A protected coastal reserve near Sur known for guided turtle-watching experiences and quiet beach scenery.",
    description:
      "Ras Al Jinz is a meaningful addition to an eastern Oman route, especially for travelers staying near Sur. Visits should be handled through guided reserve access, with patience, low light, and respect for wildlife conditions.",
    highlights: ["Guided turtle viewing", "Remote coast scenery", "Easy pairing with Sur"],
    practicalInfo: ["Use guided viewing slots", "Keep noise and light low", "Book ahead during busy travel periods"],
    howToGo: "Drive from Sur toward Ras Al Jinz and follow reserve access guidance for viewing times.",
    travelTips: ["Avoid flash photography", "Bring a light layer for evening visits", "Keep expectations flexible with wildlife"],
    nearbyAttractions: ["Wadi Shab"],
    displayOrder: 7,
  }),
  destinationRow({
    id: "dst-sohar-corniche",
    cityId: "sohar",
    citySlug: "sohar",
    slug: "sohar-corniche",
    name: "Sohar Corniche",
    city: "Sohar",
    region: "North Al Batinah Governorate",
    category: "Coastal walk",
    location: "Sohar, North Al Batinah",
    duration: "1-2 hours",
    bestSeason: "October to April",
    summary: "A relaxed coastal stop for sea views, evening walks, and a simple pause on a northern Oman route.",
    description:
      "Sohar Corniche is a low-key way to experience the city, especially around the cooler parts of the day. It pairs naturally with Sohar's fort area, markets, and a broader Al Batinah coastal drive.",
    highlights: ["Sea views", "Evening walk", "Easy city stop"],
    practicalInfo: ["Visit early or late for cooler weather", "Combine with central Sohar", "Keep plans flexible on hot days"],
    howToGo: "Use Sohar as a stop on the coastal road north of Muscat or as a break before continuing toward the border.",
    travelTips: ["Bring water", "Use shaded stops during midday", "Plan nearby food or market stops"],
    displayOrder: 8,
  }),
  destinationRow({
    id: "dst-khasab-fjords",
    cityId: "khasab",
    citySlug: "khasab",
    slug: "khasab-fjords",
    name: "Khasab Fjords",
    city: "Khasab",
    region: "Musandam Governorate",
    category: "Coastal scenery",
    location: "Khasab, Musandam",
    duration: "Half day or full day",
    bestSeason: "October to April",
    summary: "Sheltered Musandam bays, mountain-backed coastlines, and classic dhow cruise scenery near Khasab.",
    description:
      "Khasab's fjord-like coastline is the reason many travelers make the journey to Musandam. A slow boat route or viewpoint drive shows the contrast between steep mountains, calm water, fishing villages, and remote coastal scenery.",
    highlights: ["Dhow cruise routes", "Mountain-backed bays", "Harbor views"],
    practicalInfo: ["Book licensed boat trips in advance", "Carry sun protection", "Check weather and sea conditions"],
    howToGo: "Base yourself in Khasab and arrange local boat or road excursions from the harbor area.",
    travelTips: ["Start early for calmer conditions", "Bring a dry bag", "Keep plans weather-aware"],
    displayOrder: 9,
  }),
  destinationRow({
    id: "dst-duqm-rock-garden",
    cityId: "duqm",
    citySlug: "duqm",
    slug: "duqm-rock-garden",
    name: "Duqm Rock Garden",
    city: "Duqm",
    region: "Al Wusta Governorate",
    category: "Natural landscape",
    location: "Duqm, Al Wusta",
    duration: "1-2 hours",
    bestSeason: "October to April",
    summary: "An unusual desert landscape of sculptural rock formations on Oman's central coast route.",
    description:
      "Duqm Rock Garden adds an offbeat landscape stop to a long central Oman drive. The formations are best treated as a quiet nature pause rather than a rushed checklist stop, with careful attention to heat, light, and road timing.",
    highlights: ["Rock formations", "Open desert scenery", "Central Oman road trip stop"],
    practicalInfo: ["Visit during cooler hours", "Carry water", "Use care around fragile natural areas"],
    howToGo: "Plan it as part of a Duqm stopover or a longer drive through Al Wusta.",
    travelTips: ["Avoid midday heat", "Check access conditions locally", "Leave no litter or markings"],
    displayOrder: 10,
  }),
  destinationRow({
    id: "dst-barka-fort",
    cityId: "barka",
    citySlug: "barka",
    slug: "barka-fort-and-coast",
    name: "Barka Fort and Coast",
    city: "Barka",
    region: "South Al Batinah Governorate",
    category: "Coastal heritage",
    location: "Barka, South Al Batinah",
    duration: "1-3 hours",
    bestSeason: "October to April",
    summary: "A straightforward day-trip stop near Muscat with fort views, markets, beaches, and South Al Batinah coastal atmosphere.",
    description:
      "Barka works well as a short coastal addition from Muscat. Travelers can keep the visit simple: see the fort area, stop near the coast, browse local markets if timing works, and connect the town with other South Al Batinah stops.",
    highlights: ["Fort area", "Coastal stops", "Local market atmosphere"],
    practicalInfo: ["Visit early or late for cooler weather", "Respect local routines around markets", "Pair with nearby coastal towns"],
    howToGo: "Barka is west of Muscat and is easy to reach by road as a short day trip or route stop.",
    travelTips: ["Keep expectations relaxed", "Carry water", "Check opening times before planning around the fort"],
    displayOrder: 11,
  }),
  destinationRow({
    id: "dst-cairo-giza-pyramids",
    cityId: "cairo",
    citySlug: "cairo",
    slug: "giza-pyramids",
    name: "Giza Pyramids",
    city: "Cairo",
    region: "Giza Governorate",
    category: "Ancient monument",
    location: "Giza, Greater Cairo",
    duration: "Half day",
    bestSeason: "October to April",
    summary: "Egypt's most iconic ancient monument area, with pyramid views, desert light, and a deep sense of scale.",
    description:
      "The Giza Pyramids are the classic first stop for many Cairo trips. Plan the visit with enough time for viewpoints, walking between key areas, and a slower look at the desert setting rather than treating it as a quick photo stop.",
    highlights: ["Pyramid viewpoints", "Ancient monument landscape", "Desert edge setting"],
    practicalInfo: ["Start early for cooler weather", "Use sun protection", "Confirm visitor rules locally before your visit"],
    howToGo: "Giza is usually reached by car, ride-hailing, taxi, or an arranged guide from central Cairo.",
    travelTips: ["Allow more time than expected", "Keep water with you", "Pair with nearby Giza and museum stops if your schedule allows"],
    nearbyAttractions: ["Great Sphinx of Giza", "Grand Egyptian Museum"],
    displayOrder: 201,
  }),
  destinationRow({
    id: "dst-cairo-great-sphinx",
    cityId: "cairo",
    citySlug: "cairo",
    slug: "great-sphinx-of-giza",
    name: "Great Sphinx of Giza",
    city: "Cairo",
    region: "Giza Governorate",
    category: "Ancient monument",
    location: "Giza, Greater Cairo",
    duration: "1-2 hours",
    bestSeason: "October to April",
    summary: "A monumental ancient statue near the pyramids and one of Greater Cairo's defining historic sights.",
    description:
      "The Great Sphinx is best understood as part of the wider Giza plateau visit. Its setting near the pyramids makes it easy to combine with viewpoints, museum context, and a slower look at the ancient landscape.",
    highlights: ["Historic monument", "Giza plateau setting", "Easy pairing with pyramid viewpoints"],
    practicalInfo: ["Visit with the wider Giza area", "Expect exposed sun", "Check local access guidance before going"],
    howToGo: "Reach it as part of a Giza visit from Cairo, usually by car, taxi, ride-hailing, or guided route.",
    travelTips: ["Give yourself time for photos and context", "Visit early when possible", "Bring sun protection"],
    nearbyAttractions: ["Giza Pyramids", "Grand Egyptian Museum"],
    displayOrder: 202,
  }),
  destinationRow({
    id: "dst-cairo-egyptian-museum",
    cityId: "cairo",
    citySlug: "cairo",
    slug: "egyptian-museum",
    name: "Egyptian Museum",
    city: "Cairo",
    region: "Cairo Governorate",
    category: "Museum",
    location: "Tahrir Square, Cairo",
    duration: "2-4 hours",
    bestSeason: "Year-round",
    summary: "A landmark Cairo museum for ancient Egyptian collections, central city context, and first-time history planning.",
    description:
      "The Egyptian Museum is a useful anchor for understanding ancient Egypt before or after visiting Giza. Keep the visit focused around the collections that matter most to your route, then connect it with nearby downtown or Nile-side stops.",
    highlights: ["Ancient Egyptian collections", "Central Cairo location", "Useful context before Giza"],
    practicalInfo: ["Check current visitor guidance before going", "Allow time for security and crowds", "Use a guide or focused plan if short on time"],
    howToGo: "The museum is in central Cairo and can be reached by taxi, ride-hailing, metro plus walking, or guided transport.",
    travelTips: ["Plan your must-see rooms first", "Avoid rushing the collection", "Pair with a Nile or downtown walk"],
    nearbyAttractions: ["Nile Corniche", "Zamalek"],
    displayOrder: 203,
  }),
  destinationRow({
    id: "dst-cairo-khan-el-khalili",
    cityId: "cairo",
    citySlug: "cairo",
    slug: "khan-el-khalili",
    name: "Khan el-Khalili",
    city: "Cairo",
    region: "Cairo Governorate",
    category: "Historic market",
    location: "Islamic Cairo",
    duration: "2-3 hours",
    bestSeason: "October to April; evenings can be atmospheric",
    summary: "A historic bazaar area for old Cairo atmosphere, coffee stops, souvenirs, lanes, and nearby Islamic architecture.",
    description:
      "Khan el-Khalili is one of Cairo's most atmospheric market areas. Visit for traditional lanes, small shops, historic surroundings, and a slower sense of old Cairo, especially when paired with nearby mosques and Islamic Cairo walks.",
    highlights: ["Historic bazaar lanes", "Traditional shopping", "Nearby old Cairo landmarks"],
    practicalInfo: ["Keep valuables secure", "Bargain politely where appropriate", "Dress comfortably for walking"],
    howToGo: "Most visitors arrive by taxi, ride-hailing, or guided transport and combine the market with Islamic Cairo.",
    travelTips: ["Go with time to wander", "Pause for tea or coffee", "Combine with nearby mosque and street walks"],
    nearbyAttractions: ["Al-Azhar Mosque", "Islamic Cairo"],
    displayOrder: 204,
  }),
  destinationRow({
    id: "dst-cairo-citadel",
    cityId: "cairo",
    citySlug: "cairo",
    slug: "cairo-citadel",
    name: "Cairo Citadel",
    city: "Cairo",
    region: "Cairo Governorate",
    category: "Historic landmark",
    location: "Salah Salem Road, Cairo",
    duration: "2-3 hours",
    bestSeason: "October to April",
    summary: "A hilltop historic complex with mosque architecture, city views, and a strong introduction to medieval Cairo.",
    description:
      "The Cairo Citadel works well as a focused historic stop for city views, architecture, and context around medieval Cairo. It is easy to pair with nearby Islamic Cairo streets and mosque visits if your itinerary has a heritage focus.",
    highlights: ["City viewpoints", "Historic complex", "Architecture and heritage"],
    practicalInfo: ["Expect exposed outdoor areas", "Check visitor rules before going", "Use comfortable shoes"],
    howToGo: "Reach the Citadel by taxi, ride-hailing, or a guided heritage route from central Cairo.",
    travelTips: ["Visit earlier in the day", "Pair with Islamic Cairo", "Leave time for views as well as interiors"],
    nearbyAttractions: ["Mosque of Muhammad Ali", "Islamic Cairo"],
    displayOrder: 205,
  }),
  destinationRow({
    id: "dst-cairo-muhammad-ali-mosque",
    cityId: "cairo",
    citySlug: "cairo",
    slug: "mosque-of-muhammad-ali",
    name: "Mosque of Muhammad Ali",
    city: "Cairo",
    region: "Cairo Governorate",
    category: "Architecture",
    location: "Cairo Citadel",
    duration: "1-2 hours",
    bestSeason: "Year-round",
    summary: "A prominent mosque within the Cairo Citadel, known for its skyline presence, courtyards, and city views.",
    description:
      "The Mosque of Muhammad Ali is often visited with the Cairo Citadel. Its courtyards, domes, and elevated setting make it a strong architectural stop, especially for travelers interested in Cairo's historic skyline.",
    highlights: ["Citadel setting", "Mosque architecture", "Views over Cairo"],
    practicalInfo: ["Dress modestly", "Check access rules before visiting", "Allow time for the wider Citadel area"],
    howToGo: "Visit as part of a Cairo Citadel route by taxi, ride-hailing, or guided transport.",
    travelTips: ["Pair it with the Citadel", "Respect prayer spaces and visitor rules", "Visit during softer light if possible"],
    nearbyAttractions: ["Cairo Citadel", "Islamic Cairo"],
    displayOrder: 206,
  }),
  destinationRow({
    id: "dst-cairo-al-azhar-mosque",
    cityId: "cairo",
    citySlug: "cairo",
    slug: "al-azhar-mosque",
    name: "Al-Azhar Mosque",
    city: "Cairo",
    region: "Cairo Governorate",
    category: "Religious heritage",
    location: "Islamic Cairo",
    duration: "1-2 hours",
    bestSeason: "Year-round",
    summary: "A major historic mosque in Islamic Cairo, close to market lanes, old streets, and heritage walking routes.",
    description:
      "Al-Azhar Mosque is a meaningful stop for understanding Islamic Cairo. Its location makes it easy to combine with Khan el-Khalili, old streets, and nearby architecture while keeping the visit respectful and unhurried.",
    highlights: ["Historic mosque", "Islamic Cairo location", "Nearby market lanes"],
    practicalInfo: ["Dress modestly", "Be mindful of prayer times", "Follow local visitor guidance"],
    howToGo: "Arrive by taxi, ride-hailing, or guided walking route through Islamic Cairo.",
    travelTips: ["Pair with Khan el-Khalili", "Keep a quiet pace inside", "Leave time for surrounding streets"],
    nearbyAttractions: ["Khan el-Khalili", "Islamic Cairo"],
    displayOrder: 207,
  }),
  destinationRow({
    id: "dst-cairo-coptic-cairo",
    cityId: "cairo",
    citySlug: "cairo",
    slug: "coptic-cairo",
    name: "Coptic Cairo",
    city: "Cairo",
    region: "Cairo Governorate",
    category: "Historic district",
    location: "Old Cairo",
    duration: "2-4 hours",
    bestSeason: "Year-round",
    summary: "A historic district of churches, quiet lanes, museums, and layered religious heritage in Old Cairo.",
    description:
      "Coptic Cairo offers a quieter counterpoint to the city's larger monument routes. Travelers can explore churches, museums, narrow lanes, and religious heritage while keeping the visit respectful and paced around current access guidance.",
    highlights: ["Old Cairo lanes", "Church heritage", "Museum and religious history"],
    practicalInfo: ["Dress modestly", "Check access rules for individual sites", "Allow time for walking between stops"],
    howToGo: "Use metro, taxi, ride-hailing, or guided transport to Old Cairo, then walk between nearby sites.",
    travelTips: ["Keep the route compact", "Respect active worship spaces", "Pair with a museum-focused day"],
    nearbyAttractions: ["Egyptian Museum", "Nile Corniche"],
    displayOrder: 208,
  }),
  destinationRow({
    id: "dst-cairo-nile-corniche",
    cityId: "cairo",
    citySlug: "cairo",
    slug: "nile-corniche",
    name: "Nile Corniche",
    city: "Cairo",
    region: "Cairo Governorate",
    category: "River walk",
    location: "Central Cairo",
    duration: "1-2 hours",
    bestSeason: "October to April; evenings are popular",
    summary: "A simple way to experience Cairo's river setting, city lights, bridges, and a slower break between major sights.",
    description:
      "The Nile Corniche is best used as a low-pressure pause in a busy Cairo itinerary. Walk, drive, or stop near the river to reset between museums, neighborhoods, and evening plans.",
    highlights: ["Nile views", "Evening atmosphere", "Central Cairo context"],
    practicalInfo: ["Choose walkable sections carefully", "Expect traffic nearby", "Keep belongings secure in busy areas"],
    howToGo: "Reach riverside sections from central Cairo, Zamalek, or downtown by foot where practical, taxi, or ride-hailing.",
    travelTips: ["Visit near sunset or evening", "Pair with Zamalek or downtown", "Use it as a relaxed break"],
    nearbyAttractions: ["Zamalek", "Egyptian Museum"],
    displayOrder: 209,
  }),
  destinationRow({
    id: "dst-cairo-zamalek",
    cityId: "cairo",
    citySlug: "cairo",
    slug: "zamalek",
    name: "Zamalek",
    city: "Cairo",
    region: "Cairo Governorate",
    category: "Neighborhood",
    location: "Gezira Island, Cairo",
    duration: "2-4 hours",
    bestSeason: "Year-round",
    summary: "A leafy Nile island neighborhood for cafes, galleries, restaurants, river views, and a gentler Cairo afternoon.",
    description:
      "Zamalek is a useful neighborhood for slowing down between Cairo's major historic stops. It offers cafes, restaurants, galleries, embassies, and Nile-side streets that work well for a quieter afternoon or evening.",
    highlights: ["Cafe stops", "Nile island setting", "Galleries and restaurants"],
    practicalInfo: ["Traffic can be slow around bridges", "Reserve popular restaurants when needed", "Use ride-hailing or taxis for longer hops"],
    howToGo: "Reach Zamalek by taxi, ride-hailing, or metro plus walking depending on your starting point.",
    travelTips: ["Use it as a calmer base", "Pair with the Nile Corniche", "Leave room for unplanned cafe time"],
    nearbyAttractions: ["Nile Corniche", "Egyptian Museum"],
    displayOrder: 210,
  }),
  destinationRow({
    id: "dst-cairo-islamic-cairo",
    cityId: "cairo",
    citySlug: "cairo",
    slug: "islamic-cairo",
    name: "Islamic Cairo",
    city: "Cairo",
    region: "Cairo Governorate",
    category: "Historic district",
    location: "Historic Cairo",
    duration: "Half day",
    bestSeason: "October to April",
    summary: "A layered historic district of mosques, gates, markets, old streets, and architectural detail.",
    description:
      "Islamic Cairo rewards travelers who slow down and walk with context. The area connects mosques, old gates, markets, courtyards, and heritage streets, making it one of the richest parts of the city for architecture and atmosphere.",
    highlights: ["Historic streets", "Mosque architecture", "Market and heritage routes"],
    practicalInfo: ["Dress modestly", "Use comfortable shoes", "Consider a guide for deeper context"],
    howToGo: "Most travelers arrive by taxi, ride-hailing, or guided transport, then continue on foot between nearby streets and landmarks.",
    travelTips: ["Start early or late for softer light", "Pair with Khan el-Khalili", "Keep the route focused rather than trying to see everything"],
    nearbyAttractions: ["Khan el-Khalili", "Al-Azhar Mosque", "Cairo Citadel"],
    displayOrder: 211,
  }),
  destinationRow({
    id: "dst-cairo-grand-egyptian-museum",
    cityId: "cairo",
    citySlug: "cairo",
    slug: "grand-egyptian-museum",
    name: "Grand Egyptian Museum",
    city: "Cairo",
    region: "Giza Governorate",
    category: "Museum",
    location: "Giza, Greater Cairo",
    duration: "2-4 hours",
    bestSeason: "Year-round",
    summary: "A major museum complex near Giza focused on ancient Egyptian heritage and useful context for pyramid-area visits.",
    description:
      "The Grand Egyptian Museum is best treated as part of a broader Giza and ancient Egypt route. Because visitor access and displays can change, plan with current official guidance and use the museum as context for nearby monument visits.",
    highlights: ["Ancient Egypt collections", "Giza-area setting", "Museum context for monument routes"],
    practicalInfo: ["Check current visitor access before going", "Allow buffer time around Giza traffic", "Use a focused plan if visiting with limited time"],
    howToGo: "Reach the museum from Cairo or Giza by car, taxi, ride-hailing, or arranged transport.",
    travelTips: ["Confirm current access before building the day around it", "Pair with Giza if timing works", "Avoid overpacking museum and monument time"],
    nearbyAttractions: ["Giza Pyramids", "Great Sphinx of Giza"],
    displayOrder: 212,
  }),
];

const guideCompletions = [
  guideRow({
    id: "guide-first-trip",
    cityId: "muscat",
    citySlug: "muscat",
    slug: "first-time-oman-itinerary",
    title: "First-Time Oman Itinerary",
    category: "Planning",
    readTime: "7 min read",
    image: "/uploads/guides/first-time-oman-itinerary.jpg",
    coverImage: "/uploads/guides/first-time-oman-itinerary-cover.jpg",
    excerpt: "A balanced route for Muscat, the mountains, desert, wadis, and coastal towns without rushing every day.",
    content: [
      "Start with two nights in Muscat to settle into the pace of Oman and visit Mutrah, the Sultan Qaboos Grand Mosque, and the coast.",
      "Continue inland to Nizwa and Jebel Akhdar for forts, souqs, villages, and cooler mountain air.",
      "Add one night in Wahiba Sands, then return toward Muscat via Wadi Shab or Sur for a compact but varied loop.",
    ],
    isFeatured: true,
    displayOrder: 1,
  }),
  guideRow({
    id: "guide-driving",
    cityId: "muscat",
    citySlug: "muscat",
    slug: "driving-in-oman",
    title: "Driving in Oman",
    category: "Transport",
    readTime: "5 min read",
    image: "/uploads/guides/driving-in-oman.jpg",
    coverImage: "/uploads/guides/driving-in-oman-cover.jpg",
    excerpt: "What to know before renting a car, choosing a 4WD, and planning fuel stops between regions.",
    content: [
      "Major highways are generally straightforward, but distances can be long and services become sparse away from towns.",
      "A 4WD is essential for Jebel Akhdar and useful for some desert approaches, mountain tracks, and remote beaches.",
      "Avoid wadi crossings during rain alerts and leave extra time for mountain roads after dark.",
    ],
    isFeatured: true,
    displayOrder: 2,
  }),
  guideRow({
    id: "guide-seasons",
    cityId: "muscat",
    citySlug: "muscat",
    slug: "best-time-to-visit-oman",
    title: "Best Time to Visit Oman",
    category: "Seasons",
    readTime: "4 min read",
    image: "/uploads/guides/best-time-to-visit-oman.jpg",
    coverImage: "/uploads/guides/best-time-to-visit-oman-cover.jpg",
    excerpt: "A seasonal guide to winter road trips, spring roses, summer mountains, and Salalah's Khareef.",
    content: [
      "October to April is the classic travel window for comfortable city walks, hikes, camping, and road trips.",
      "March and April bring rose season to Jebel Akhdar, while summer travelers often focus on higher elevations or Dhofar.",
      "Salalah's Khareef season runs in the summer months, when mist and greenery transform the south.",
    ],
    isFeatured: true,
    displayOrder: 3,
  }),
  guideRow({
    id: "guide-culture",
    cityId: "muscat",
    citySlug: "muscat",
    slug: "oman-culture-etiquette",
    title: "Oman Culture and Etiquette",
    category: "Culture",
    readTime: "6 min read",
    image: "/uploads/guides/oman-culture-etiquette.jpg",
    coverImage: "/uploads/guides/oman-culture-etiquette-cover.jpg",
    excerpt: "Simple, respectful tips for markets, mosques, clothing, greetings, and photography.",
    content: [
      "Dress modestly in towns, souqs, villages, and religious sites; swimwear belongs at pools, beaches, and resort areas.",
      "Ask before photographing people, especially in traditional markets and rural communities.",
      "Hospitality is central to Omani culture, so accept coffee or dates graciously when offered and keep interactions unhurried.",
    ],
    isFeatured: true,
    displayOrder: 4,
  }),
  guideRow({
    id: "guide-cairo-best-places",
    cityId: "cairo",
    citySlug: "cairo",
    slug: "best-places-to-visit-in-cairo",
    title: "Best Places to Visit in Cairo",
    category: "City guide",
    readTime: "8 min read",
    excerpt: "A practical first look at Cairo's essential monuments, museums, markets, historic districts, and Nile-side neighborhoods.",
    content: [
      "Start with Giza and museum time, then add Islamic Cairo, Coptic Cairo, and a Nile-side break so the city feels layered rather than rushed.",
      "Use Cairo's neighborhoods as anchors: Giza for ancient monuments, downtown for museums and central access, Islamic Cairo for historic streets, and Zamalek for a calmer pause.",
      "Avoid packing too many distant stops into one day. Traffic, heat, and security checks can make a slower route feel far better than a long checklist.",
    ],
    isFeatured: true,
    displayOrder: 201,
  }),
  guideRow({
    id: "guide-cairo-two-days",
    cityId: "cairo",
    citySlug: "cairo",
    slug: "2-days-in-cairo-itinerary",
    title: "2 Days in Cairo Itinerary",
    category: "Itinerary",
    readTime: "7 min read",
    excerpt: "A balanced two-day Cairo route for Giza, museums, old districts, markets, Nile views, and slower neighborhood time.",
    content: [
      "Day one can focus on Giza and ancient Egypt context, pairing pyramid-area time with a museum visit and a calmer evening near the Nile or Zamalek.",
      "Day two can shift into historic Cairo, with Islamic Cairo, Khan el-Khalili, mosque architecture, and Coptic Cairo depending on your interests.",
      "Keep buffers between stops. Cairo rewards early starts, realistic transfers, and flexible evenings more than tightly packed schedules.",
    ],
    isFeatured: true,
    displayOrder: 202,
  }),
  guideRow({
    id: "guide-cairo-first-time-visitors",
    cityId: "cairo",
    citySlug: "cairo",
    slug: "cairo-travel-guide-for-first-time-visitors",
    title: "Cairo Travel Guide for First-Time Visitors",
    category: "Planning",
    readTime: "6 min read",
    excerpt: "First-time Cairo planning tips for neighborhoods, transport, pacing, dress, museum time, markets, and historic areas.",
    content: [
      "Choose a base based on your route: Giza for monument access, downtown for central movement, or Zamalek for a calmer island neighborhood.",
      "Plan major sights early when possible, then leave afternoons or evenings for markets, Nile views, cafes, and shorter neighborhood walks.",
      "Dress modestly for religious and historic sites, keep small cash handy, and confirm current visitor guidance for museums and monuments before going.",
    ],
    isFeatured: true,
    displayOrder: 203,
  }),
  guideRow({
    id: "guide-cairo-historic-places",
    cityId: "cairo",
    citySlug: "cairo",
    slug: "best-historic-places-in-cairo",
    title: "Best Historic Places in Cairo",
    category: "History",
    readTime: "6 min read",
    excerpt: "A focused guide to Cairo's historic districts, ancient monument routes, mosques, Coptic heritage, and market streets.",
    content: [
      "Cairo's historic places are spread across different eras, from ancient Giza to Islamic Cairo and Coptic Cairo.",
      "Pair nearby sites into compact clusters rather than crossing the city repeatedly. Giza, Islamic Cairo, and Old Cairo each deserve their own focused block of time.",
      "Use guides, museum context, and slower walking routes to understand the city beyond headline landmarks.",
    ],
    isFeatured: true,
    displayOrder: 204,
  }),
];

const attractionCompletions = [
  attractionRow({
    id: "att-grand-mosque",
    cityId: "muscat",
    citySlug: "muscat",
    name: "Sultan Qaboos Grand Mosque",
    slug: "sultan-qaboos-grand-mosque",
    city: "Muscat",
    image: "/uploads/attractions/sultan-qaboos-grand-mosque.jpg",
    category: "Architecture",
    description: "A serene Muscat landmark known for its scale, marble courtyards, careful craftsmanship, and calm morning atmosphere.",
    summary: "A serene Muscat landmark known for its scale, craftsmanship, and marble courtyards.",
    recommendedTime: "Morning",
    displayOrder: 1,
  }),
  attractionRow({
    id: "att-bimmah",
    cityId: "sur",
    citySlug: "sur",
    name: "Bimmah Sinkhole",
    slug: "bimmah-sinkhole",
    city: "Sur",
    image: "/uploads/attractions/bimmah-sinkhole.jpg",
    category: "Nature",
    description: "A limestone sinkhole with clear blue water near the coastal highway between Muscat and Sur.",
    summary: "A limestone sinkhole with clear blue water near the coastal highway.",
    recommendedTime: "1 hour",
    displayOrder: 2,
  }),
  attractionRow({
    id: "att-ras-al-jinz",
    cityId: "sur",
    citySlug: "sur",
    name: "Ras Al Jinz Turtle Reserve",
    slug: "ras-al-jinz-turtle-reserve",
    city: "Sur",
    image: "/uploads/attractions/ras-al-jinz-turtle-reserve.jpg",
    category: "Wildlife",
    description: "A protected nesting beach near Sur best experienced through guided viewing slots and respectful low-light visits.",
    summary: "A protected nesting beach best visited with guided viewing slots.",
    recommendedTime: "Evening",
    displayOrder: 3,
  }),
  attractionRow({
    id: "att-bahla",
    cityId: "nizwa",
    citySlug: "nizwa",
    name: "Bahla Fort",
    slug: "bahla-fort",
    city: "Nizwa",
    image: "/uploads/attractions/bahla-fort.jpg",
    category: "UNESCO heritage",
    description: "A vast mud-brick fortress near Nizwa that anchors one of Oman's most important interior heritage towns.",
    summary: "A vast mud-brick fortress that anchors one of Oman's great heritage towns.",
    recommendedTime: "2 hours",
    displayOrder: 4,
  }),
  attractionRow({
    id: "att-cairo-giza-pyramids",
    cityId: "cairo",
    citySlug: "cairo",
    name: "Giza Pyramids",
    slug: "giza-pyramids",
    city: "Cairo",
    category: "Ancient monument",
    description: "Egypt's most iconic ancient monument area, best visited with time for viewpoints, walking, and context.",
    summary: "Egypt's most iconic ancient monument area with pyramid views and desert light.",
    recommendedTime: "Half day",
    displayOrder: 201,
  }),
  attractionRow({
    id: "att-cairo-great-sphinx",
    cityId: "cairo",
    citySlug: "cairo",
    name: "Great Sphinx of Giza",
    slug: "great-sphinx-of-giza",
    city: "Cairo",
    category: "Ancient monument",
    description: "A monumental ancient statue near the Giza pyramids and an essential stop on a Greater Cairo heritage route.",
    summary: "A monumental ancient statue near the pyramids on the Giza plateau.",
    recommendedTime: "1-2 hours",
    displayOrder: 202,
  }),
  attractionRow({
    id: "att-cairo-egyptian-museum",
    cityId: "cairo",
    citySlug: "cairo",
    name: "Egyptian Museum",
    slug: "egyptian-museum",
    city: "Cairo",
    category: "Museum",
    description: "A landmark museum for ancient Egyptian collections and useful context before or after visiting Giza.",
    summary: "A landmark Cairo museum for ancient Egyptian collections and central city context.",
    recommendedTime: "2-4 hours",
    displayOrder: 203,
  }),
  attractionRow({
    id: "att-cairo-khan-el-khalili",
    cityId: "cairo",
    citySlug: "cairo",
    name: "Khan el-Khalili",
    slug: "khan-el-khalili",
    city: "Cairo",
    category: "Historic market",
    description: "A historic bazaar area for old Cairo atmosphere, traditional shopping, coffee stops, and nearby Islamic architecture.",
    summary: "A historic bazaar area for market lanes, coffee stops, and old Cairo atmosphere.",
    recommendedTime: "2-3 hours",
    displayOrder: 204,
  }),
  attractionRow({
    id: "att-cairo-citadel",
    cityId: "cairo",
    citySlug: "cairo",
    name: "Cairo Citadel",
    slug: "cairo-citadel",
    city: "Cairo",
    category: "Historic landmark",
    description: "A hilltop historic complex with mosque architecture, city views, and strong context for medieval Cairo.",
    summary: "A hilltop historic complex with architecture, heritage, and city views.",
    recommendedTime: "2-3 hours",
    displayOrder: 205,
  }),
  attractionRow({
    id: "att-cairo-muhammad-ali-mosque",
    cityId: "cairo",
    citySlug: "cairo",
    name: "Mosque of Muhammad Ali",
    slug: "mosque-of-muhammad-ali",
    city: "Cairo",
    category: "Architecture",
    description: "A prominent mosque within the Cairo Citadel, known for its skyline presence, courtyards, and elevated setting.",
    summary: "A prominent mosque within the Cairo Citadel with courtyards and city views.",
    recommendedTime: "1-2 hours",
    displayOrder: 206,
  }),
  attractionRow({
    id: "att-cairo-al-azhar-mosque",
    cityId: "cairo",
    citySlug: "cairo",
    name: "Al-Azhar Mosque",
    slug: "al-azhar-mosque",
    city: "Cairo",
    category: "Religious heritage",
    description: "A major historic mosque in Islamic Cairo, close to old market lanes and heritage walking routes.",
    summary: "A major historic mosque in Islamic Cairo near old streets and market lanes.",
    recommendedTime: "1-2 hours",
    displayOrder: 207,
  }),
  attractionRow({
    id: "att-cairo-coptic-cairo",
    cityId: "cairo",
    citySlug: "cairo",
    name: "Coptic Cairo",
    slug: "coptic-cairo",
    city: "Cairo",
    category: "Historic district",
    description: "A historic Old Cairo district of churches, quiet lanes, museums, and layered religious heritage.",
    summary: "A historic district of churches, quiet lanes, museums, and religious heritage.",
    recommendedTime: "2-4 hours",
    displayOrder: 208,
  }),
  attractionRow({
    id: "att-cairo-nile-corniche",
    cityId: "cairo",
    citySlug: "cairo",
    name: "Nile Corniche",
    slug: "nile-corniche",
    city: "Cairo",
    category: "River walk",
    description: "A simple way to experience Cairo's river setting, bridges, city lights, and a slower pause between major sights.",
    summary: "A Nile-side route for river views, evening atmosphere, and central Cairo context.",
    recommendedTime: "1-2 hours",
    displayOrder: 209,
  }),
  attractionRow({
    id: "att-cairo-zamalek",
    cityId: "cairo",
    citySlug: "cairo",
    name: "Zamalek",
    slug: "zamalek",
    city: "Cairo",
    category: "Neighborhood",
    description: "A leafy Nile island neighborhood for cafes, galleries, restaurants, river views, and a calmer Cairo afternoon.",
    summary: "A leafy Nile island neighborhood for cafes, galleries, restaurants, and river views.",
    recommendedTime: "2-4 hours",
    displayOrder: 210,
  }),
  attractionRow({
    id: "att-cairo-islamic-cairo",
    cityId: "cairo",
    citySlug: "cairo",
    name: "Islamic Cairo",
    slug: "islamic-cairo",
    city: "Cairo",
    category: "Historic district",
    description: "A layered historic district of mosques, gates, markets, old streets, and architectural detail.",
    summary: "A historic district of mosques, gates, markets, old streets, and architecture.",
    recommendedTime: "Half day",
    displayOrder: 211,
  }),
  attractionRow({
    id: "att-cairo-grand-egyptian-museum",
    cityId: "cairo",
    citySlug: "cairo",
    name: "Grand Egyptian Museum",
    slug: "grand-egyptian-museum",
    city: "Cairo",
    category: "Museum",
    description: "A major museum complex near Giza focused on ancient Egyptian heritage; check current visitor access before planning around it.",
    summary: "A major museum complex near Giza focused on ancient Egyptian heritage.",
    recommendedTime: "2-4 hours",
    displayOrder: 212,
  }),
];

const relationshipFields = new Set(["city_id", "city_slug", "city"]);

function mergePatch(existing, proposed, { allowRelationshipFixes = false } = {}) {
  const patch = {};

  for (const [key, value] of Object.entries(proposed)) {
    if (["id", "slug", "created_at"].includes(key)) {
      continue;
    }

    if (relationshipFields.has(key) && !allowRelationshipFixes) {
      if (isIncomplete(existing[key])) {
        patch[key] = value;
      }
      continue;
    }

    if (relationshipFields.has(key) && allowRelationshipFixes) {
      if (existing[key] !== value) {
        patch[key] = value;
      }
      continue;
    }

    if (Array.isArray(value)) {
      const next = fillArray(existing[key], value);
      if (next !== existing[key]) {
        patch[key] = next;
      }
      continue;
    }

    const next = fillScalar(existing[key], value);
    if (next !== existing[key]) {
      patch[key] = next;
    }
  }

  if (Object.keys(patch).length > 0 && "updated_at" in proposed) {
    patch.updated_at = now();
  }

  return patch;
}

async function readTable(supabase, table) {
  const { data, error } = await supabase.from(table).select("*");

  if (error) {
    throw new Error(`Failed to read ${table}: ${error.message}`);
  }

  return data || [];
}

async function completeTable(supabase, table, rows, { allowRelationshipFixes = false } = {}) {
  const existingRows = await readTable(supabase, table);
  const bySlug = new Map(existingRows.map((row) => [slugify(row.slug || row.name || row.title || row.id), row]));
  const byId = new Map(existingRows.map((row) => [row.id, row]));
  const summary = [];

  for (const row of rows) {
    const existing = byId.get(row.id) || bySlug.get(slugify(row.slug || row.name || row.title));

    if (!existing) {
      summary.push({ table, action: "insert", id: row.id, slug: row.slug, fields: Object.keys(row) });

      if (APPLY) {
        const { error } = await supabase.from(table).upsert(row, { onConflict: "id" });
        if (error) {
          throw new Error(`Failed to insert ${table}/${row.id}: ${error.message}`);
        }
      }

      continue;
    }

    const patch = mergePatch(existing, row, { allowRelationshipFixes });
    const fields = Object.keys(patch);

    if (fields.length === 0) {
      continue;
    }

    summary.push({ table, action: "update", id: existing.id, slug: existing.slug, fields });

    if (APPLY) {
      const { error } = await supabase.from(table).update(patch).eq("id", existing.id);
      if (error) {
        throw new Error(`Failed to update ${table}/${existing.id}: ${error.message}`);
      }
    }
  }

  return summary;
}

function rowsForCity(table, rows, citySlug) {
  if (!citySlug) {
    return rows;
  }

  return rows.filter((row) => {
    if (table === "cities") {
      return [row.id, row.slug, row.name].map(slugify).includes(citySlug);
    }

    return [row.city_id, row.city_slug, row.city].map(slugify).includes(citySlug);
  });
}

loadDotEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. This script needs server/admin Supabase credentials.");
  process.exit(1);
}

const normalizedUrl = new URL(supabaseUrl).origin;
const supabase = createClient(normalizedUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const summaries = [
  ...(await completeTable(supabase, "cities", rowsForCity("cities", cityCompletions, CITY_FILTER))),
  ...(await completeTable(supabase, "destinations", rowsForCity("destinations", destinationCompletions, CITY_FILTER), {
    allowRelationshipFixes: FIX_RELATIONSHIPS,
  })),
  ...(await completeTable(supabase, "guides", rowsForCity("guides", guideCompletions, CITY_FILTER))),
  ...(await completeTable(supabase, "attractions", rowsForCity("attractions", attractionCompletions, CITY_FILTER), {
    allowRelationshipFixes: FIX_RELATIONSHIPS,
  })),
];

console.log(
  JSON.stringify(
    {
      mode: APPLY ? "applied" : "dry-run",
      cityFilter: CITY_FILTER || null,
      relationshipFixes: FIX_RELATIONSHIPS,
      supabaseUrl: normalizedUrl,
      changes: summaries,
      note: APPLY
        ? "Applied safe content completion. Existing non-placeholder admin content was preserved."
        : "Dry run only. Re-run with --apply to write safe inserts/fills. Add --fix-relationships to move known Oman items from Muscat to their specific city hubs.",
    },
    null,
    2,
  ),
);
