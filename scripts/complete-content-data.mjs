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
// This script only uses existing Supabase fields. It does not delete rows, change
// schema, rename fields, or overwrite non-placeholder admin content.

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const FIX_RELATIONSHIPS = args.has("--fix-relationships");
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
    city_id: guide.cityId,
    city_slug: guide.citySlug,
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
    shortDescription: "A historic Nile city for museums, markets, mosques, river views, and access to ancient monuments.",
    longDescription:
      "Cairo is a dense, energetic city where historic districts, major museums, markets, Islamic architecture, Nile views, and ancient monument routes sit close together. A good Cairo itinerary balances landmark visits with neighborhood time, early starts, and enough space to move through the city at a realistic pace.",
    isFeatured: true,
    displayOrder: 16,
    seoTitle: "Cairo, Egypt Travel Guide | Top7Spots",
    seoDescription: "Explore Cairo travel ideas for museums, markets, Nile views, historic districts, mosques, and ancient monument routes.",
    seoKeywords: ["Cairo", "Egypt", "travel", "Nile", "museums", "markets"],
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
  ...(await completeTable(supabase, "cities", cityCompletions)),
  ...(await completeTable(supabase, "destinations", destinationCompletions, {
    allowRelationshipFixes: FIX_RELATIONSHIPS,
  })),
  ...(await completeTable(supabase, "guides", guideCompletions)),
  ...(await completeTable(supabase, "attractions", attractionCompletions, {
    allowRelationshipFixes: FIX_RELATIONSHIPS,
  })),
];

console.log(
  JSON.stringify(
    {
      mode: APPLY ? "applied" : "dry-run",
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
