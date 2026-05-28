import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  BookOpen,
  Building2,
  Compass,
  Eye,
  FileText,
  Filter,
  FolderKanban,
  Globe2,
  ImageIcon,
  LayoutDashboard,
  Library,
  MapPin,
  PenLine,
  Plus,
  Quote,
  Search,
  Settings,
  SlidersHorizontal,
  Trash2,
  Utensils,
} from "lucide-react";
import {
  saveAttractionAction,
  saveDestinationAction,
  saveGuideAction,
  saveHomepageFaqAction,
  saveHomepageReviewAction,
  saveRestaurantAction,
  saveSitePageAction,
} from "@/app/admin/actions";
import { CityAiContentImport } from "@/components/admin/city-ai-content-import";
import { DestinationAiContentImport } from "@/components/admin/destination-ai-content-import";
import { GuideContentBlocksField } from "@/components/admin/guide-content-blocks-field";
import { GuideListingBlocksField } from "@/components/admin/guide-listing-blocks-field";
import { GuideOwnershipFields } from "@/components/admin/guide-ownership-fields";
import { GalleryUploadField, ImageUploadField } from "@/components/admin/image-upload-field";
import { TravelGuideAiContentImport } from "@/components/admin/travel-guide-ai-content-import";
import { BrandLogo } from "@/components/brand-logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/format";
import type {
  AdminCollection,
  Attraction,
  City,
  Destination,
  Guide,
  HomepageFaq,
  HomepageReview,
  Restaurant,
  SitePage,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type AdminSection =
  | "dashboard"
  | "cities"
  | "destinations"
  | "guides"
  | "attractions"
  | "restaurants"
  | "homepage_reviews"
  | "homepage_faqs"
  | "site_pages"
  | "categories"
  | "media"
  | "settings";

type SearchParams = Record<string, string | string[] | undefined>;

type AdminCrudProps = {
  data: {
    cities: City[];
    destinations: Destination[];
    guides: Guide[];
    attractions: Attraction[];
    restaurants: Restaurant[];
    restaurantTableMissing?: boolean;
    homepageReviews: HomepageReview[];
    homepageFaqs: HomepageFaq[];
    sitePages: SitePage[];
  };
  searchParams: SearchParams;
};

const navigation: Array<{ section: AdminSection; label: string; icon: ReactNode }> = [
  { section: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
  { section: "cities", label: "Cities", icon: <Building2 className="size-4" /> },
  { section: "destinations", label: "Destinations / Spots", icon: <Compass className="size-4" /> },
  { section: "guides", label: "Travel Guides", icon: <BookOpen className="size-4" /> },
  { section: "attractions", label: "Attractions", icon: <MapPin className="size-4" /> },
  { section: "restaurants", label: "Restaurants", icon: <Utensils className="size-4" /> },
  { section: "homepage_reviews", label: "Homepage Reviews", icon: <Quote className="size-4" /> },
  { section: "homepage_faqs", label: "Homepage FAQs", icon: <FileText className="size-4" /> },
  { section: "site_pages", label: "Site Pages", icon: <FileText className="size-4" /> },
  { section: "categories", label: "Categories / Filters", icon: <SlidersHorizontal className="size-4" /> },
  { section: "media", label: "Media Library", icon: <Library className="size-4" /> },
  { section: "settings", label: "Settings", icon: <Settings className="size-4" /> },
];

export function AdminCrud({ data, searchParams }: AdminCrudProps) {
  const activeSection = getSection(searchParams.section);
  const uploadError = getParam(searchParams.uploadError);
  const saveError = getParam(searchParams.saveError);
  const flash = getParam(searchParams.updated) || getParam(searchParams.deleted);

  return (
    <div className="min-h-screen bg-slate-50 text-[#111827] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-4 py-4 lg:block lg:px-5 lg:py-6">
          <BrandLogo imageClassName="h-10 w-auto lg:h-12" />
          <form action="/api/admin/logout" method="post" className="lg:mt-8">
            <Button type="submit" variant="outline" className="rounded-full">
              Sign out
            </Button>
          </form>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:grid lg:gap-1 lg:px-3">
          {navigation.map((item) => (
            <Link
              key={item.section}
              href={adminHref(item.section)}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                activeSection === item.section
                  ? "bg-[#0A2A66] text-white shadow-lg shadow-blue-950/15"
                  : "text-slate-600 hover:bg-slate-100 hover:text-[#0A2A66]",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
              Top7Spots CMS
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#111827] md:text-4xl">
              {sectionTitle(activeSection)}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              City-first travel content management for Supabase records.
            </p>
          </div>
          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
              className: "mt-4 rounded-full md:mt-0",
            })}
          >
            View site
          </Link>
        </div>

        {uploadError || saveError ? (
          <Alert tone="danger">{uploadError || saveError}</Alert>
        ) : null}
        {flash ? (
          <Alert tone="success">Content saved. The CMS section has been refreshed.</Alert>
        ) : null}

        {activeSection === "dashboard" ? <DashboardOverview data={data} /> : null}
        {activeSection === "cities" ? <CitiesSection data={data} searchParams={searchParams} /> : null}
        {activeSection === "destinations" ? (
          <DestinationsSection data={data} searchParams={searchParams} />
        ) : null}
        {activeSection === "guides" ? <GuidesSection data={data} searchParams={searchParams} /> : null}
        {activeSection === "attractions" ? (
          <AttractionsSection data={data} searchParams={searchParams} />
        ) : null}
        {activeSection === "restaurants" ? (
          <RestaurantsSection data={data} searchParams={searchParams} />
        ) : null}
        {activeSection === "homepage_reviews" ? (
          <HomepageReviewsSection data={data} searchParams={searchParams} />
        ) : null}
        {activeSection === "homepage_faqs" ? (
          <HomepageFaqsSection data={data} searchParams={searchParams} />
        ) : null}
        {activeSection === "site_pages" ? (
          <SitePagesSection data={data} searchParams={searchParams} />
        ) : null}
        {activeSection === "categories" ? <CategoriesSection /> : null}
        {activeSection === "media" ? <MediaSection /> : null}
        {activeSection === "settings" ? <SettingsSection data={data} /> : null}
      </main>
    </div>
  );
}

function DashboardOverview({ data }: { data: AdminCrudProps["data"] }) {
  const draftCount =
    data.cities.filter(isDraft).length +
    data.destinations.filter(isDraft).length +
    data.guides.filter(isDraft).length +
    data.attractions.filter(isDraft).length +
    data.restaurants.filter((item) => !item.published).length +
    data.sitePages.filter(isDraft).length;
  const stats = [
    { label: "Total cities", value: data.cities.length, icon: <Building2 className="size-5" /> },
    { label: "Published cities", value: data.cities.filter(isPublished).length, icon: <Globe2 className="size-5" /> },
    { label: "Total destinations", value: data.destinations.length, icon: <Compass className="size-5" /> },
    { label: "Total guides", value: data.guides.length, icon: <BookOpen className="size-5" /> },
    { label: "Total attractions", value: data.attractions.length, icon: <MapPin className="size-5" /> },
    { label: "Total restaurants", value: data.restaurants.length, icon: <Utensils className="size-5" /> },
    { label: "Homepage reviews", value: data.homepageReviews.length, icon: <Quote className="size-5" /> },
    { label: "Homepage FAQs", value: data.homepageFaqs.length, icon: <FileText className="size-5" /> },
    { label: "Site pages", value: data.sitePages.length, icon: <FileText className="size-5" /> },
    { label: "Draft content", value: draftCount, icon: <FileText className="size-5" /> },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <Card key={item.label} className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold text-[#0A2A66]">{item.value}</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3 text-[#1D4ED8]">{item.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <QuickAction href={adminHref("cities", { mode: "add" })} label="Add city" />
          <QuickAction href={adminHref("destinations", { mode: "add" })} label="Add destination" />
          <QuickAction href={adminHref("guides", { mode: "add" })} label="Add guide" />
          <QuickAction href={adminHref("attractions", { mode: "add" })} label="Add attraction" />
          <QuickAction href={adminHref("restaurants", { mode: "add" })} label="Add restaurant" />
          <QuickAction href={adminHref("homepage_reviews", { mode: "add" })} label="Add homepage review" />
          <QuickAction href={adminHref("homepage_faqs", { mode: "add" })} label="Add homepage FAQ" />
          <QuickAction href={adminHref("site_pages", { mode: "add" })} label="Add site page" />
        </CardContent>
      </Card>
    </div>
  );
}

function CitiesSection({ data, searchParams }: AdminCrudProps) {
  const mode = getParam(searchParams.mode);
  const id = getParam(searchParams.id);
  const city = data.cities.find((item) => item.id === id);
  const isForm = mode === "add" || (mode === "edit" && city);
  const q = getParam(searchParams.q).toLowerCase();
  const status = getParam(searchParams.status);
  const filtered = data.cities.filter((item) => {
    const matchesQuery = searchBlob(item.name, item.country, item.region).includes(q);
    const matchesStatus = !status || status === "all" || item.status === status;
    return matchesQuery && matchesStatus;
  });

  if (isForm) {
    return (
      <CityForm
        title={city ? `Edit ${city.name}` : "Add new city"}
        city={city}
        backHref={adminHref("cities")}
      />
    );
  }

  return (
    <ManagementShell
      title="Cities"
      description="Manage city landing pages and global homepage city cards."
      addHref={adminHref("cities", { mode: "add" })}
      addLabel="Add New City"
      filters={<CommonFilters section="cities" searchLabel="Search city" status={status} q={getParam(searchParams.q)} />}
    >
      {filtered.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Featured</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <EntityCell image={item.cardImage || item.heroImage} title={item.name} subtitle={item.region} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.country}</td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3">{item.isFeatured ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{item.displayOrder}</td>
                    <td className="px-4 py-3">
                      <RowActions
                        collection="cities"
                        viewHref={`/${item.slug}`}
                        editHref={adminHref("cities", { mode: "edit", id: item.id })}
                        redirectTo="/admin/dashboard?section=cities&deleted=cities"
                        hidden={{ id: item.id, slug: item.slug }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState title="No cities found" text="Try a different search or add a new city." />
      )}
    </ManagementShell>
  );
}

function DestinationsSection({ data, searchParams }: AdminCrudProps) {
  const mode = getCrudMode(searchParams);
  const id = getParam(searchParams.id);
  const destination = data.destinations.find((item) => item.id === id);
  const isForm = mode === "add" || (mode === "edit" && destination);
  const filters = getContentFilters(searchParams);
  const categories = unique(data.destinations.map((item) => item.category));
  const filtered = data.destinations.filter((item) => {
    const matchesQuery = searchBlob(item.name, item.city, item.category, item.location).includes(filters.q);
    return (
      matchesQuery &&
      matchesCity(item.citySlug, filters.city) &&
      matchesStatus(item.status, filters.status) &&
      matchesValue(item.category, filters.category)
    );
  });

  if (isForm) {
    return (
      <DestinationForm
        title={destination ? `Edit ${destination.name}` : "Add new destination"}
        cities={data.cities}
        destination={destination}
        backHref={adminHref("destinations")}
      />
    );
  }

  return (
    <ManagementShell
      title="Destinations / Spots"
      description="Create city-assigned spots, travel highlights, practical details, and SEO fields."
      addHref={adminHref("destinations", { mode: "add" })}
      addLabel="Add New Destination"
      filters={
        <ContentFilters
          section="destinations"
          cities={data.cities}
          categories={categories}
          searchLabel="Search destination"
          searchValue={getParam(searchParams.q)}
          statusValue={filters.status}
          cityValue={filters.city}
          categoryValue={filters.category}
        />
      }
    >
      {filtered.length > 0 ? (
        <EntityTable
          headers={["Destination", "City", "Category", "Status", "Featured", "Best season", "Actions"]}
          rows={filtered.map((item) => ({
            key: item.id,
            cells: [
              <EntityCell key="entity" image={item.image} title={item.name} subtitle={item.location || item.region} />,
              cityLabel(data.cities, item.citySlug),
              item.category || "Uncategorized",
              <StatusBadge key="status" status={item.status} />,
              item.isFeatured ? "Yes" : "No",
              item.bestSeason || "Flexible",
              <RowActions
                key="actions"
                collection="destinations"
                viewHref={`/${item.citySlug}/destinations/${item.slug}`}
                editHref={adminHref("destinations", { mode: "edit", id: item.id })}
                redirectTo="/admin/dashboard?section=destinations&deleted=destinations"
                hidden={{ id: item.id, citySlug: item.citySlug, slug: item.slug }}
              />,
            ],
          }))}
        />
      ) : (
        <EmptyState title="No destinations found" text="Adjust filters or add a destination assigned to a city." />
      )}
    </ManagementShell>
  );
}

function GuidesSection({ data, searchParams }: AdminCrudProps) {
  const mode = getCrudMode(searchParams);
  const id = getParam(searchParams.id);
  const guide = data.guides.find((item) => item.id === id);
  const isForm = mode === "add" || (mode === "edit" && guide);
  const filters = getContentFilters(searchParams);
  const filtered = data.guides.filter((item) => {
    const matchesQuery = searchBlob(
      item.title,
      item.category,
      item.excerpt,
      guideTargetLabel(item, data.cities, data.destinations),
    ).includes(filters.q);
    return matchesQuery && matchesCity(item.citySlug, filters.city) && matchesStatus(item.status, filters.status);
  });

  if (isForm) {
    return (
      <GuideForm
        title={guide ? `Edit ${guide.title}` : "Add new guide"}
        cities={data.cities}
        destinations={data.destinations}
        guides={data.guides}
        restaurants={data.restaurants}
        attractions={data.attractions}
        guide={guide}
        backHref={adminHref("guides")}
      />
    );
  }

  return (
    <ManagementShell
      title="Travel Guides"
      description="Manage editorial guides by city, category, read time, and status."
      addHref={adminHref("guides", { mode: "add" })}
      addLabel="Add New Guide"
      filters={
        <ContentFilters
          section="guides"
          cities={data.cities}
          searchLabel="Search guide"
          searchValue={getParam(searchParams.q)}
          statusValue={filters.status}
          cityValue={filters.city}
        />
      }
    >
      {filtered.length > 0 ? (
        <EntityTable
          headers={["Guide", "Belongs to", "Category", "Read time", "Status", "Actions"]}
          rows={filtered.map((item) => ({
            key: item.id,
            cells: [
              <EntityCell key="entity" image={item.coverImage || item.image} title={item.title} subtitle={item.author} />,
              guideTargetLabel(item, data.cities, data.destinations),
              item.category || "Guide",
              item.readTime || "Quick read",
              <StatusBadge key="status" status={item.status} />,
              <RowActions
                key="actions"
                collection="guides"
                viewHref={guideViewHref(item)}
                editHref={adminHref("guides", { mode: "edit", id: item.id })}
                redirectTo="/admin/dashboard?section=guides&deleted=guides"
                hidden={{ id: item.id, citySlug: item.citySlug, slug: item.slug }}
              />,
            ],
          }))}
        />
      ) : (
        <EmptyState title="No guides found" text="Create a city-assigned travel guide to populate this list." />
      )}
    </ManagementShell>
  );
}

function AttractionsSection({ data, searchParams }: AdminCrudProps) {
  const mode = getParam(searchParams.mode);
  const id = getParam(searchParams.id);
  const attraction = data.attractions.find((item) => item.id === id);
  const isForm = mode === "add" || (mode === "edit" && attraction);
  const filters = getContentFilters(searchParams);
  const types = unique(data.attractions.map((item) => item.category || item.type));
  const filtered = data.attractions.filter((item) => {
    const matchesQuery = searchBlob(item.name, item.city, item.category, item.type).includes(filters.q);
    return (
      matchesQuery &&
      matchesCity(item.citySlug, filters.city) &&
      matchesStatus(item.status, filters.status) &&
      matchesValue(item.category || item.type, filters.category)
    );
  });

  if (isForm) {
    return (
      <AttractionForm
        title={attraction ? `Edit ${attraction.name}` : "Add new attraction"}
        cities={data.cities}
        attraction={attraction}
        backHref={adminHref("attractions")}
      />
    );
  }

  return (
    <ManagementShell
      title="Attractions"
      description="Manage local points of interest, landmarks, and recommended stops."
      addHref={adminHref("attractions", { mode: "add" })}
      addLabel="Add New Attraction"
      filters={
        <ContentFilters
          section="attractions"
          cities={data.cities}
          categories={types}
          searchLabel="Search attraction"
          categoryLabel="Type"
          searchValue={getParam(searchParams.q)}
          statusValue={filters.status}
          cityValue={filters.city}
          categoryValue={filters.category}
        />
      }
    >
      {filtered.length > 0 ? (
        <EntityTable
          headers={["Attraction", "City", "Category / Type", "Status", "Actions"]}
          rows={filtered.map((item) => ({
            key: item.id,
            cells: [
              <EntityCell key="entity" image={item.image} title={item.name} subtitle={item.recommendedTime} />,
              cityLabel(data.cities, item.citySlug),
              item.category || item.type || "Attraction",
              <StatusBadge key="status" status={item.status} />,
              <RowActions
                key="actions"
                collection="attractions"
                viewHref={`/${item.citySlug}/attractions/${item.slug}`}
                editHref={adminHref("attractions", { mode: "edit", id: item.id })}
                redirectTo="/admin/dashboard?section=attractions&deleted=attractions"
                hidden={{ id: item.id, citySlug: item.citySlug, slug: item.slug }}
              />,
            ],
          }))}
        />
      ) : (
        <EmptyState title="No attractions found" text="Adjust filters or add a city-assigned attraction." />
      )}
    </ManagementShell>
  );
}

function RestaurantsSection({ data, searchParams }: AdminCrudProps) {
  const mode = getCrudMode(searchParams);
  const id = getParam(searchParams.id);
  const restaurant = data.restaurants.find((item) => item.id === id);
  const isForm = mode === "add" || (mode === "edit" && restaurant);
  const filters = getContentFilters(searchParams);
  const cuisines = unique(data.restaurants.map((item) => item.cuisineType));
  const filtered = data.restaurants.filter((item) => {
    const city = data.cities.find((cityItem) => cityItem.id === item.cityId);
    const matchesQuery = searchBlob(item.name, item.shortDescription, item.cuisineType, item.address).includes(filters.q);
    return (
      matchesQuery &&
      matchesCity(city?.slug || "", filters.city) &&
      matchesPublication(item.published, filters.status) &&
      matchesValue(item.cuisineType, filters.category)
    );
  });

  if (isForm) {
    return (
      <RestaurantForm
        title={restaurant ? `Edit ${restaurant.name}` : "Add new restaurant"}
        cities={data.cities}
        destinations={data.destinations}
        restaurant={restaurant}
        backHref={adminHref("restaurants")}
      />
    );
  }

  return (
    <ManagementShell
      title="Restaurants"
      description="Manage lightweight food and dining entities for guides and future SEO pages."
      addHref={adminHref("restaurants", { mode: "add" })}
      addLabel="Add New Restaurant"
      filters={
        <ContentFilters
          section="restaurants"
          cities={data.cities}
          categories={cuisines}
          searchLabel="Search restaurant"
          categoryLabel="Cuisine"
          searchValue={getParam(searchParams.q)}
          statusValue={filters.status}
          cityValue={filters.city}
          categoryValue={filters.category}
        />
      }
    >
      {data.restaurantTableMissing ? (
        <Alert tone="danger">
          Restaurants table is not available in Supabase yet. Apply the Phase 7A restaurants schema before adding restaurant records.
        </Alert>
      ) : null}
      {filtered.length > 0 ? (
        <EntityTable
          headers={["Restaurant", "City", "Cuisine", "Price", "Status", "Actions"]}
          rows={filtered.map((item) => ({
            key: item.id,
            cells: [
              <EntityCell key="entity" image={item.image} title={item.name} subtitle={item.shortDescription} />,
              restaurantCityLabel(data.cities, item),
              item.cuisineType || "Restaurant",
              item.priceRange || "Flexible",
              <PublishBadge key="status" published={item.published} />,
              <RowActions
                key="actions"
                collection="restaurants"
                viewHref={`/restaurants/${item.slug}`}
                editHref={adminHref("restaurants", { mode: "edit", id: item.id })}
                redirectTo="/admin/dashboard?section=restaurants&deleted=restaurants"
                hidden={{ id: item.id, slug: item.slug }}
              />,
            ],
          }))}
        />
      ) : (
        <EmptyState title="No restaurants found" text="Adjust filters or add a lightweight restaurant entity." />
      )}
    </ManagementShell>
  );
}

function HomepageReviewsSection({ data, searchParams }: AdminCrudProps) {
  const mode = getParam(searchParams.mode);
  const id = getParam(searchParams.id);
  const review = data.homepageReviews.find((item) => item.id === id);
  const isForm = mode === "add" || (mode === "edit" && review);
  const q = getParam(searchParams.q).toLowerCase();
  const status = getParam(searchParams.status);
  const filtered = data.homepageReviews.filter((item) => {
    const matchesQuery = searchBlob(item.name, item.reviewText).includes(q);
    return matchesQuery && matchesPublication(item.isPublished, status);
  });

  if (isForm) {
    return (
      <HomepageReviewForm
        title={review ? `Edit ${review.name}` : "Add homepage review"}
        review={review}
        backHref={adminHref("homepage_reviews")}
      />
    );
  }

  return (
    <ManagementShell
      title="Homepage Reviews"
      description="Manage the traveler review cards shown on the homepage."
      addHref={adminHref("homepage_reviews", { mode: "add" })}
      addLabel="Add Review"
      filters={
        <CommonFilters
          section="homepage_reviews"
          searchLabel="Search review"
          status={status}
          q={getParam(searchParams.q)}
          draftLabel="Unpublished"
        />
      }
    >
      {filtered.length > 0 ? (
        <EntityTable
          headers={["Review", "Status", "Order", "Updated", "Actions"]}
          rows={filtered.map((item) => ({
            key: item.id,
            cells: [
              <TextEntityCell key="entity" title={item.name} text={item.reviewText} />,
              <PublishBadge key="status" published={item.isPublished} />,
              item.sortOrder,
              formatDate(item.updatedAt),
              <RowActions
                key="actions"
                collection="homepage_reviews"
                viewHref="/#traveler-reviews"
                editHref={adminHref("homepage_reviews", { mode: "edit", id: item.id })}
                redirectTo="/admin/dashboard?section=homepage_reviews&deleted=homepage_reviews"
                hidden={{ id: item.id }}
              />,
            ],
          }))}
        />
      ) : (
        <EmptyState title="No homepage reviews found" text="Add a review to replace the homepage fallback cards." />
      )}
    </ManagementShell>
  );
}

function HomepageFaqsSection({ data, searchParams }: AdminCrudProps) {
  const mode = getParam(searchParams.mode);
  const id = getParam(searchParams.id);
  const faq = data.homepageFaqs.find((item) => item.id === id);
  const isForm = mode === "add" || (mode === "edit" && faq);
  const q = getParam(searchParams.q).toLowerCase();
  const status = getParam(searchParams.status);
  const filtered = data.homepageFaqs.filter((item) => {
    const matchesQuery = searchBlob(item.question, item.answer).includes(q);
    return matchesQuery && matchesPublication(item.isPublished, status);
  });

  if (isForm) {
    return (
      <HomepageFaqForm
        title={faq ? `Edit FAQ` : "Add homepage FAQ"}
        faq={faq}
        backHref={adminHref("homepage_faqs")}
      />
    );
  }

  return (
    <ManagementShell
      title="Homepage FAQs"
      description="Manage the accordion questions shown near the bottom of the homepage."
      addHref={adminHref("homepage_faqs", { mode: "add" })}
      addLabel="Add FAQ"
      filters={
        <CommonFilters
          section="homepage_faqs"
          searchLabel="Search FAQ"
          status={status}
          q={getParam(searchParams.q)}
          draftLabel="Unpublished"
        />
      }
    >
      {filtered.length > 0 ? (
        <EntityTable
          headers={["Question", "Status", "Order", "Updated", "Actions"]}
          rows={filtered.map((item) => ({
            key: item.id,
            cells: [
              <TextEntityCell key="entity" title={item.question} text={item.answer} />,
              <PublishBadge key="status" published={item.isPublished} />,
              item.sortOrder,
              formatDate(item.updatedAt),
              <RowActions
                key="actions"
                collection="homepage_faqs"
                viewHref="/#faq"
                editHref={adminHref("homepage_faqs", { mode: "edit", id: item.id })}
                redirectTo="/admin/dashboard?section=homepage_faqs&deleted=homepage_faqs"
                hidden={{ id: item.id }}
              />,
            ],
          }))}
        />
      ) : (
        <EmptyState title="No homepage FAQs found" text="Add FAQs to replace the homepage fallback accordion." />
      )}
    </ManagementShell>
  );
}

function SitePagesSection({ data, searchParams }: AdminCrudProps) {
  const mode = getParam(searchParams.mode);
  const id = getParam(searchParams.id);
  const page = data.sitePages.find((item) => item.id === id);
  const isForm = mode === "add" || (mode === "edit" && page);
  const q = getParam(searchParams.q).toLowerCase();
  const status = getParam(searchParams.status);
  const filtered = data.sitePages.filter((item) => {
    const matchesQuery = searchBlob(item.title, item.slug, item.content, item.metaTitle).includes(q);
    return matchesQuery && matchesStatus(item.status, status);
  });

  if (isForm) {
    return (
      <SitePageForm
        title={page ? `Edit ${page.title}` : "Add site page"}
        page={page}
        backHref={adminHref("site_pages")}
      />
    );
  }

  return (
    <ManagementShell
      title="Website Settings / Site Pages"
      description="Manage trust pages, legal pages, and their SEO metadata."
      addHref={adminHref("site_pages", { mode: "add" })}
      addLabel="Add Site Page"
      filters={
        <CommonFilters
          section="site_pages"
          searchLabel="Search page"
          status={status}
          q={getParam(searchParams.q)}
        />
      }
    >
      {filtered.length > 0 ? (
        <EntityTable
          headers={["Page", "Slug", "Status", "Updated", "Actions"]}
          rows={filtered.map((item) => ({
            key: item.id,
            cells: [
              <TextEntityCell key="entity" title={item.title} text={item.metaDescription || item.content} />,
              `/${item.slug}`,
              <StatusBadge key="status" status={item.status} />,
              formatDate(item.updatedAt),
              <RowActions
                key="actions"
                collection="site_pages"
                viewHref={`/${item.slug}`}
                editHref={adminHref("site_pages", { mode: "edit", id: item.id })}
                redirectTo="/admin/dashboard?section=site_pages&deleted=site_pages"
                hidden={{ id: item.id, slug: item.slug }}
              />,
            ],
          }))}
        />
      ) : (
        <EmptyState title="No site pages found" text="Add the trust and legal pages shown in the footer." />
      )}
    </ManagementShell>
  );
}

function CategoriesSection() {
  const categories = ["Beaches", "Mountains", "Desert", "Luxury", "Adventure", "Hidden Gems", "Family", "Road Trips"];

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Categories / Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Public filter pills are currently dummy UI. This placeholder keeps the CMS ready for a
          future managed category system without changing today&apos;s public routes or data model.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((category) => (
            <span key={category} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              {category}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MediaSection() {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Media Library</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <p className="text-sm leading-6 text-slate-600">
            Uploaded files are saved to Supabase Storage and attached to a city, destination,
            guide, or attraction record as public media URLs.
          </p>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Use each content form to upload and persist images directly into the correct media
            folder.
          </div>
        </div>
        <ImageUploadField label="Preview upload control" />
      </CardContent>
    </Card>
  );
}

function SettingsSection({ data }: { data: AdminCrudProps["data"] }) {
  return (
    <div className="grid gap-6">
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Site settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <ReadOnlySetting label="Site name" value="Top7Spots" />
          <ReadOnlySetting label="Domain" value="top7spots.com" />
          <ReadOnlySetting label="Admin email" value="admin@top7spots.com" />
          <ReadOnlySetting label="Default city" value={data.cities[0]?.name || "Muscat"} />
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>SEO and social placeholders</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <ReadOnlySetting label="Default SEO title" value="Top7Spots | Discover The World's Best Travel Spots" />
          <ReadOnlySetting label="Default SEO description" value="Curated travel cities, hidden gems, beaches, mountains, road trips, and unforgettable experiences." />
          <ReadOnlySetting label="Instagram" value="Coming soon" />
          <ReadOnlySetting label="YouTube" value="Coming soon" />
        </CardContent>
      </Card>
    </div>
  );
}

function CityForm({ title, city, backHref }: { title: string; city?: City; backHref: string }) {
  return (
    <EditShell title={title} backHref={backHref}>
      <form action="/api/admin/cities" method="post" encType="multipart/form-data" className="grid gap-6">
        <input type="hidden" name="id" value={city?.id ?? ""} />
        <input type="hidden" name="existingSlug" value={city?.slug ?? ""} />
        <HiddenTimestamps createdAt={city?.createdAt} />
        <CityAiContentImport />
        <FormSection title="Basic info">
          <Field label="Name" name="name" defaultValue={city?.name} placeholder="Dubai" />
          <SlugPreview slug={city ? slugify(city.name) || slugify(city.slug) : ""} />
          <Field label="Country" name="country" defaultValue={city?.country} placeholder="United Arab Emirates" />
          <Field label="Country code" name="countryCode" defaultValue={city?.countryCode} placeholder="AE" />
          <Field label="Region" name="region" defaultValue={city?.region} placeholder="Dubai Emirate" />
          <StatusSelect defaultValue={city?.status} />
          <Field label="Display order" name="displayOrder" type="number" defaultValue={city?.displayOrder ?? 0} />
          <Toggle label="Featured city" name="isFeatured" defaultChecked={city?.isFeatured} />
        </FormSection>
        <FormSection title="Images">
          <div className="md:col-span-3">
            <ImageUploadField fieldName="heroImage" label="Hero image" currentImage={city?.heroImage} />
          </div>
          <div className="md:col-span-3">
            <ImageUploadField fieldName="cardImage" label="Card image" currentImage={city?.cardImage} />
          </div>
          <div className="md:col-span-3">
            <ImageUploadField fieldName="featuredImage" label="Featured image" currentImage={city?.featuredImage} />
          </div>
        </FormSection>
        <FormSection title="Content" columns={1}>
          <Area label="Short description" name="shortDescription" defaultValue={city?.shortDescription} />
          <Area label="Long description" name="longDescription" defaultValue={city?.longDescription} rows={5} />
        </FormSection>
        <FormSection title="SEO" columns={1}>
          <Field label="SEO title" name="seoTitle" defaultValue={city?.seoTitle} />
          <Field label="SEO description" name="seoDescription" defaultValue={city?.seoDescription} />
          <Area label="SEO keywords, one per line" name="seoKeywords" defaultValue={lines(city?.seoKeywords)} />
        </FormSection>
        <FormActions backHref={backHref} label="Save city" />
      </form>
    </EditShell>
  );
}

function DestinationForm({
  title,
  cities,
  destination,
  backHref,
}: {
  title: string;
  cities: City[];
  destination?: Destination;
  backHref: string;
}) {
  return (
    <EditShell title={title} backHref={backHref}>
      <form action={saveDestinationAction} className="grid gap-6">
        <input type="hidden" name="id" value={destination?.id ?? ""} />
        <HiddenTimestamps createdAt={destination?.createdAt} />
        <DestinationAiContentImport />
        <FormSection title="Basic info">
          <Field label="Name" name="name" defaultValue={destination?.name} placeholder="Mutrah Corniche" />
          <Field label="Slug" name="slug" defaultValue={destination?.slug} placeholder="mutrah-corniche" />
          <Field label="Category" name="category" defaultValue={destination?.category} placeholder="Waterfront" />
          <StatusSelect defaultValue={destination?.status} />
          <Field label="Display order" name="displayOrder" type="number" defaultValue={destination?.displayOrder ?? 0} />
          <Toggle label="Featured spot" name="isFeatured" defaultChecked={destination?.isFeatured} />
        </FormSection>
        <FormSection title="City assignment">
          <CitySelect cities={cities} defaultValue={destination?.citySlug} />
          <Field label="Location" name="location" defaultValue={destination?.location} placeholder="Mutrah waterfront" />
          <Field label="Region" name="region" defaultValue={destination?.region} placeholder="Muscat Governorate" />
        </FormSection>
        <FormSection title="Images / gallery" columns={1}>
          <ImageUploadField fieldName="image" label="Main image" currentImage={destination?.image} />
          <GalleryUploadField currentImages={destination?.galleryImages} />
        </FormSection>
        <FormSection title="Description / content" columns={1}>
          <Area label="Summary" name="summary" defaultValue={destination?.summary} />
          <Area label="Description" name="description" defaultValue={destination?.description} rows={5} />
          <Area label="Highlights, one per line" name="highlights" defaultValue={lines(destination?.highlights)} />
        </FormSection>
        <FormSection title="Travel information" columns={1}>
          <Field label="Duration" name="duration" defaultValue={destination?.duration} placeholder="2 hours" />
          <Field label="Best season" name="bestSeason" defaultValue={destination?.bestSeason} placeholder="October to April" />
          <Area label="How to go" name="howToGo" defaultValue={destination?.howToGo} />
          <Area label="Practical info, one per line" name="practicalInfo" defaultValue={lines(destination?.practicalInfo)} />
          <Area label="Travel tips, one per line" name="travelTips" defaultValue={lines(destination?.travelTips)} />
          <Area label="Nearby attractions, one per line" name="nearbyAttractions" defaultValue={lines(destination?.nearbyAttractions)} />
        </FormSection>
        <FormSection title="FAQs" columns={1}>
          <Area
            label="FAQ blocks"
            name="faqs"
            defaultValue={formatFaqText(destination?.faqs)}
            placeholder={
              "Question: What is the best time to visit Mutrah Corniche?\nAnswer: Evenings from October to April are usually the most comfortable.\n\nQuestion: How long should I spend there?\nAnswer: Plan around one to two hours for a relaxed walk and photos."
            }
            helperText="Optional. Use one Question/Answer block per FAQ. Empty blocks are ignored."
            rows={8}
          />
        </FormSection>
        <FormSection title="SEO" columns={1}>
          <Field label="SEO title" name="seoTitle" defaultValue={destination?.seoTitle} />
          <Field label="SEO description" name="seoDescription" defaultValue={destination?.seoDescription} />
        </FormSection>
        <FormActions backHref={backHref} label="Save destination" />
      </form>
    </EditShell>
  );
}

function GuideForm({
  title,
  cities,
  destinations,
  guides,
  restaurants,
  attractions,
  guide,
  backHref,
}: {
  title: string;
  cities: City[];
  destinations: Destination[];
  guides: Guide[];
  restaurants: Restaurant[];
  attractions: Attraction[];
  guide?: Guide;
  backHref: string;
}) {
  return (
    <EditShell title={title} backHref={backHref}>
      <form action={saveGuideAction} className="grid gap-6">
        <input type="hidden" name="id" value={guide?.id ?? ""} />
        <HiddenTimestamps createdAt={guide?.createdAt} />
        <TravelGuideAiContentImport
          cities={cities.map((city) => ({
            id: city.slug,
            label: city.name,
            meta: [city.country, city.region].filter(Boolean).join(" - "),
          }))}
          countries={countryOptions(cities).map((country) => ({
            id: country.id,
            label: country.label,
            meta: country.meta,
          }))}
          destinations={destinations.map((destination) => ({
            id: destination.id,
            label: destination.name,
            meta: [destination.slug, destination.city, destination.category].filter(Boolean).join(" - "),
          }))}
          guides={guides
            .filter((item) => item.id !== guide?.id)
            .map((item) => ({
              id: item.id,
              label: item.title,
              meta: [item.slug, item.category, guideTargetLabel(item, cities, destinations)].filter(Boolean).join(" - "),
            }))}
          restaurants={restaurantOptions(restaurants, cities).map((restaurant) => ({
            id: restaurant.id,
            label: restaurant.label,
            meta: restaurant.meta,
          }))}
          activities={attractions.map((attraction) => ({
            id: attraction.id,
            label: attraction.name,
            meta: [attraction.slug, cityLabel(cities, attraction.citySlug), attraction.category || attraction.type].filter(Boolean).join(" - "),
          }))}
        />
        <FormSection title="Basic info">
          <Field label="Title" name="title" defaultValue={guide?.title} placeholder="Best places in Muscat" />
          <Field label="Slug" name="slug" defaultValue={guide?.slug} placeholder="best-places-in-muscat" />
          <Field label="Category" name="category" defaultValue={guide?.category} placeholder="Planning" />
          <Field label="Author" name="author" defaultValue={guide?.author} placeholder="Top7Spots editorial" />
          <Field label="Read time" name="readTime" defaultValue={guide?.readTime} placeholder="5 min read" />
          <StatusSelect defaultValue={guide?.status} />
          <Field label="Display order" name="displayOrder" type="number" defaultValue={guide?.displayOrder ?? 0} />
          <Toggle label="Featured guide" name="isFeatured" defaultChecked={guide?.isFeatured} />
        </FormSection>
        <FormSection title="Guide ownership">
          <GuideOwnershipFields
            cities={cities}
            destinations={destinations}
            defaultTargetType={guide?.targetType ?? "city"}
            defaultCountryId={guide?.countryId}
            defaultCitySlug={guide?.citySlug}
            defaultDestinationId={guide?.destinationId}
          />
        </FormSection>
        <FormSection title="Cover image" columns={1}>
          <ImageUploadField fieldName="image" label="Cover image" currentImage={guide?.image || guide?.coverImage} />
          <Field
            label="Cover image alt text"
            name="coverImageAlt"
            defaultValue={guide?.coverImageAlt}
            placeholder="Rental car parked near Muscat International Airport"
          />
        </FormSection>
        <FormSection title="Content" columns={1}>
          <Area label="Excerpt" name="excerpt" defaultValue={guide?.excerpt} />
          <Area label="Content paragraphs, one per line" name="content" defaultValue={lines(guide?.content)} rows={6} />
        </FormSection>
        <FormSection title="Guide Page Builder" columns={1}>
          <GuideContentBlocksField
            defaultBlocks={guide?.contentBlocks}
            cities={cities.map((city) => ({
              id: city.id,
              label: city.name,
              meta: [city.country, city.region].filter(Boolean).join(" - "),
            }))}
            countries={countryOptions(cities).map((country) => ({
              id: country.id,
              label: country.label,
              meta: country.meta,
            }))}
            destinations={destinations.map((destination) => ({
              id: destination.id,
              label: destination.name,
              meta: [destination.city, destination.category].filter(Boolean).join(" - "),
            }))}
            guides={guides
              .filter((item) => item.id !== guide?.id)
              .map((item) => ({
                id: item.id,
                label: item.title,
                meta: [item.category, guideTargetLabel(item, cities, destinations)].filter(Boolean).join(" - "),
              }))}
            restaurants={restaurantOptions(restaurants, cities).map((restaurant) => ({
              id: restaurant.id,
              label: restaurant.label,
              meta: restaurant.meta,
            }))}
            activities={attractions.map((attraction) => ({
              id: attraction.id,
              label: attraction.name,
              meta: [cityLabel(cities, attraction.citySlug), attraction.category || attraction.type].filter(Boolean).join(" - "),
            }))}
          />
        </FormSection>
        <FormSection title="FAQs" columns={1}>
          <Area
            label="FAQ blocks"
            name="faqs"
            defaultValue={formatFaqText(guide?.faqs)}
            placeholder={
              "Question: Can tourists rent a car in Oman?\nAnswer: Yes, tourists can rent a car in Oman with a valid driving license, passport, and required documents.\n\nQuestion: Is a deposit required?\nAnswer: Most rental companies require a refundable security deposit."
            }
            rows={8}
          />
        </FormSection>
        <FormSection title="Table of contents" columns={1}>
          <Area
            label="Table of contents"
            name="tableOfContents"
            defaultValue={formatTableOfContentsText(guide?.tableOfContents)}
            placeholder={
              "Why rent a car in Muscat | why-rent-a-car-in-muscat\nDocuments needed | documents-needed\nDeposit and insurance | deposit-and-insurance"
            }
            rows={5}
          />
        </FormSection>
        <FormSection title="Listing blocks" columns={1}>
          <GuideListingBlocksField
            defaultBlocks={guide?.listingBlocks}
            cities={cities.map((city) => ({
              id: city.id,
              label: city.name,
              meta: [city.country, city.region].filter(Boolean).join(" - "),
              description: city.shortDescription || city.seoDescription,
              image: city.cardImage || city.featuredImage || city.heroImage,
              badge: "City",
            }))}
            countries={countryOptions(cities)}
            destinations={destinations.map((destination) => ({
              id: destination.id,
              label: destination.name,
              meta: [destination.city, destination.category].filter(Boolean).join(" - "),
              description: destination.summary || destination.location,
              image: destination.image,
              badge: destination.category || "Destination",
            }))}
            guides={guides
              .filter((item) => item.id !== guide?.id)
              .map((item) => ({
                id: item.id,
                label: item.title,
                meta: [item.category, guideTargetLabel(item, cities, destinations)].filter(Boolean).join(" - "),
                description: item.excerpt || item.seoDescription,
                image: item.coverImage || item.image,
                badge: item.category || "Guide",
              }))}
            restaurants={restaurantOptions(restaurants, cities)}
            activities={attractions.map((attraction) => ({
              id: attraction.id,
              label: attraction.name,
              meta: [cityLabel(cities, attraction.citySlug), attraction.category || attraction.type].filter(Boolean).join(" - "),
              description: attraction.summary || attraction.description,
              image: attraction.image,
              badge: attraction.category || attraction.type || "Activity",
            }))}
          />
        </FormSection>
        <FormSection title="SEO" columns={1}>
          <Field label="SEO title" name="seoTitle" defaultValue={guide?.seoTitle} />
          <Field label="SEO description" name="seoDescription" defaultValue={guide?.seoDescription} />
          <Field
            label="SEO keywords"
            name="seoKeywords"
            defaultValue={commaList(guide?.seoKeywords)}
            placeholder="rent a car muscat, muscat airport car rental, self drive oman"
            helperText="Comma-separated keywords for search targeting."
          />
          <Field
            label="Related guide slugs"
            name="relatedGuideSlugs"
            defaultValue={commaList(guide?.relatedGuideSlugs)}
            helperText="Comma-separated guide slugs."
          />
          <Field
            label="Related place slugs"
            name="relatedPlaceSlugs"
            defaultValue={commaList(guide?.relatedPlaceSlugs)}
            helperText="Comma-separated place slugs."
          />
        </FormSection>
        <FormActions backHref={backHref} label="Save guide" />
      </form>
    </EditShell>
  );
}

function AttractionForm({
  title,
  cities,
  attraction,
  backHref,
}: {
  title: string;
  cities: City[];
  attraction?: Attraction;
  backHref: string;
}) {
  return (
    <EditShell title={title} backHref={backHref}>
      <form action={saveAttractionAction} className="grid gap-6">
        <input type="hidden" name="id" value={attraction?.id ?? ""} />
        <FormSection title="Basic info">
          <Field label="Name" name="name" defaultValue={attraction?.name} placeholder="Royal Opera House Muscat" />
          <Field label="Slug" name="slug" defaultValue={attraction?.slug} placeholder="royal-opera-house-muscat" />
          <Field label="Category / type" name="category" defaultValue={attraction?.category || attraction?.type} placeholder="Culture" />
          <StatusSelect defaultValue={attraction?.status} />
          <Field label="Display order" name="displayOrder" type="number" defaultValue={attraction?.displayOrder ?? 0} />
          <Field label="Recommended time" name="recommendedTime" defaultValue={attraction?.recommendedTime} placeholder="2 hours" />
        </FormSection>
        <FormSection title="City assignment">
          <CitySelect cities={cities} defaultValue={attraction?.citySlug} />
        </FormSection>
        <FormSection title="Images" columns={1}>
          <ImageUploadField fieldName="image" label="Attraction image" currentImage={attraction?.image} />
        </FormSection>
        <FormSection title="Content" columns={1}>
          <Area label="Summary" name="summary" defaultValue={attraction?.summary} />
          <Area label="Description" name="description" defaultValue={attraction?.description} rows={5} />
        </FormSection>
        <FormSection title="SEO" columns={1}>
          <Field label="SEO title" name="seoTitle" defaultValue={attraction?.seoTitle} />
          <Field label="SEO description" name="seoDescription" defaultValue={attraction?.seoDescription} />
        </FormSection>
        <FormActions backHref={backHref} label="Save attraction" />
      </form>
    </EditShell>
  );
}

function RestaurantForm({
  title,
  cities,
  destinations,
  restaurant,
  backHref,
}: {
  title: string;
  cities: City[];
  destinations: Destination[];
  restaurant?: Restaurant;
  backHref: string;
}) {
  return (
    <EditShell title={title} backHref={backHref}>
      <form action={saveRestaurantAction} className="grid gap-6">
        <input type="hidden" name="id" value={restaurant?.id ?? ""} />
        <HiddenTimestamps createdAt={restaurant?.createdAt} />
        <FormSection title="Basic info">
          <Field label="Name" name="name" defaultValue={restaurant?.name} placeholder="Bait Al Luban" />
          <Field label="Slug" name="slug" defaultValue={restaurant?.slug} placeholder="bait-al-luban" />
          <CitySelect
            cities={cities}
            defaultValue={restaurantCitySlug(cities, restaurant)}
          />
          <Toggle label="Published" name="published" defaultChecked={restaurant?.published ?? true} />
          <Toggle label="Featured" name="featured" defaultChecked={restaurant?.featured} />
        </FormSection>
        <FormSection title="Optional relationships">
          <SelectField label="Destination" name="destinationId" defaultValue={restaurant?.destinationId || ""}>
            <option value="">No destination</option>
            {destinations.map((destination) => (
              <option key={destination.id} value={destination.id}>
                {destination.name} - {destination.city}
              </option>
            ))}
          </SelectField>
          <Field label="Cuisine" name="cuisineType" defaultValue={restaurant?.cuisineType} placeholder="Omani" />
          <Field label="Price range" name="priceRange" defaultValue={restaurant?.priceRange} placeholder="$$" />
        </FormSection>
        <FormSection title="Image" columns={1}>
          <ImageUploadField fieldName="image" label="Restaurant image" currentImage={restaurant?.image} />
        </FormSection>
        <FormSection title="Description" columns={1}>
          <Area
            label="Short description"
            name="shortDescription"
            defaultValue={restaurant?.shortDescription}
            rows={3}
          />
          <Area
            label="Long description"
            name="longDescription"
            defaultValue={restaurant?.longDescription}
            rows={5}
          />
        </FormSection>
        <FormSection title="Practical info" columns={1}>
          <Field label="Address" name="address" defaultValue={restaurant?.address} />
          <Field label="Google Maps URL" name="googleMapsUrl" defaultValue={restaurant?.googleMapsUrl} />
          <Area
            label="Tags, one per line"
            name="tags"
            defaultValue={lines(restaurant?.tags)}
            placeholder={"rooftop\ntraditional\nseafood"}
          />
        </FormSection>
        <FormActions backHref={backHref} label="Save restaurant" />
      </form>
    </EditShell>
  );
}

function HomepageReviewForm({
  title,
  review,
  backHref,
}: {
  title: string;
  review?: HomepageReview;
  backHref: string;
}) {
  return (
    <EditShell title={title} backHref={backHref}>
      <form action={saveHomepageReviewAction} className="grid gap-6">
        <input type="hidden" name="id" value={review?.id ?? ""} />
        <HiddenTimestamps createdAt={review?.createdAt} />
        <FormSection title="Review" columns={1}>
          <Field label="Person name" name="name" defaultValue={review?.name} placeholder="Maya R." />
          <Area
            label="Review text"
            name="reviewText"
            defaultValue={review?.reviewText}
            placeholder="Top7Spots makes trip research feel calm..."
            rows={5}
          />
        </FormSection>
        <FormSection title="Publishing">
          <Toggle label="Published" name="isPublished" defaultChecked={review?.isPublished ?? true} />
          <Field label="Sort order" name="sortOrder" type="number" defaultValue={review?.sortOrder ?? 0} />
        </FormSection>
        <FormActions backHref={backHref} label="Save review" />
      </form>
    </EditShell>
  );
}

function HomepageFaqForm({
  title,
  faq,
  backHref,
}: {
  title: string;
  faq?: HomepageFaq;
  backHref: string;
}) {
  return (
    <EditShell title={title} backHref={backHref}>
      <form action={saveHomepageFaqAction} className="grid gap-6">
        <input type="hidden" name="id" value={faq?.id ?? ""} />
        <HiddenTimestamps createdAt={faq?.createdAt} />
        <FormSection title="FAQ" columns={1}>
          <Field label="Question" name="question" defaultValue={faq?.question} placeholder="What is Top7Spots?" />
          <Area
            label="Answer"
            name="answer"
            defaultValue={faq?.answer}
            placeholder="Top7Spots is a curated travel discovery site..."
            rows={6}
          />
        </FormSection>
        <FormSection title="Publishing">
          <Toggle label="Published" name="isPublished" defaultChecked={faq?.isPublished ?? true} />
          <Field label="Sort order" name="sortOrder" type="number" defaultValue={faq?.sortOrder ?? 0} />
        </FormSection>
        <FormActions backHref={backHref} label="Save FAQ" />
      </form>
    </EditShell>
  );
}

function SitePageForm({
  title,
  page,
  backHref,
}: {
  title: string;
  page?: SitePage;
  backHref: string;
}) {
  return (
    <EditShell title={title} backHref={backHref}>
      <form action={saveSitePageAction} className="grid gap-6">
        <input type="hidden" name="id" value={page?.id ?? ""} />
        <HiddenTimestamps createdAt={page?.createdAt} />
        <FormSection title="Page content" columns={1}>
          <Field label="Title" name="title" defaultValue={page?.title} placeholder="About Top7Spots" />
          <Field
            label="Slug"
            name="slug"
            defaultValue={page?.slug}
            placeholder="about"
            helperText="Use URL-safe slugs such as about, contact, privacy-policy, terms-and-conditions, cookie-policy, or disclaimer."
          />
          <Area
            label="Content"
            name="content"
            defaultValue={page?.content}
            placeholder={"Write the public page copy here.\n\nUse blank lines to separate paragraphs."}
            rows={14}
          />
        </FormSection>
        <FormSection title="SEO">
          <Field label="Meta title" name="metaTitle" defaultValue={page?.metaTitle} />
          <Field label="Meta description" name="metaDescription" defaultValue={page?.metaDescription} />
          <StatusSelect defaultValue={page?.status ?? "published"} />
        </FormSection>
        <FormActions backHref={backHref} label="Save page" />
      </form>
    </EditShell>
  );
}

function ManagementShell({
  title,
  description,
  addHref,
  addLabel,
  filters,
  children,
}: {
  title: string;
  description: string;
  addHref: string;
  addLabel: string;
  filters: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <Link
          href={addHref}
          className={buttonVariants({
            className: "mt-4 rounded-full bg-[#0A2A66] text-white hover:bg-[#1D4ED8] md:mt-0",
          })}
        >
          <Plus className="size-4" />
          {addLabel}
        </Link>
      </div>
      {filters}
      {children}
    </div>
  );
}

function CommonFilters({
  section,
  searchLabel,
  q,
  status,
  draftLabel = "Draft",
}: {
  section: AdminSection;
  searchLabel: string;
  q: string;
  status: string;
  draftLabel?: string;
}) {
  const formId = `${section}-filters`;

  return (
    <FilterCard formId={formId}>
      <input form={formId} type="hidden" name="section" value={section} />
      <SearchInput formId={formId} label={searchLabel} defaultValue={q} />
      <SelectField formId={formId} label="Status" name="status" defaultValue={status || "all"}>
        <option value="all">All statuses</option>
        <option value="published">Published</option>
        <option value="draft">{draftLabel}</option>
      </SelectField>
      <FilterButtons formId={formId} section={section} />
    </FilterCard>
  );
}

function ContentFilters({
  section,
  cities,
  categories = [],
  searchLabel,
  categoryLabel = "Category",
  searchValue,
  statusValue,
  cityValue,
  categoryValue,
}: {
  section: AdminSection;
  cities: City[];
  categories?: string[];
  searchLabel: string;
  categoryLabel?: string;
  searchValue: string;
  statusValue: string;
  cityValue: string;
  categoryValue?: string;
}) {
  const formId = `${section}-filters`;

  return (
    <FilterCard formId={formId}>
      <input form={formId} type="hidden" name="section" value={section} />
      <SearchInput formId={formId} label={searchLabel} defaultValue={searchValue} />
      <SelectField formId={formId} label="City" name="city" defaultValue={cityValue || "all"}>
        <option value="all">All cities</option>
        {cities.map((city) => (
          <option key={city.id} value={city.slug}>
            {city.name}
          </option>
        ))}
      </SelectField>
      <SelectField formId={formId} label="Status" name="status" defaultValue={statusValue || "all"}>
        <option value="all">All statuses</option>
        <option value="published">Published</option>
        <option value="draft">Draft</option>
      </SelectField>
      {categories.length > 0 ? (
        <SelectField formId={formId} label={categoryLabel} name="category" defaultValue={categoryValue || "all"}>
          <option value="all">All {categoryLabel.toLowerCase()}</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </SelectField>
      ) : null}
      <FilterButtons formId={formId} section={section} />
    </FilterCard>
  );
}

function FilterCard({ children, formId }: { children: ReactNode; formId: string }) {
  return (
    <>
      <form id={formId} action="/admin/dashboard" />
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4 lg:grid-cols-5">
        {children}
      </div>
    </>
  );
}

function FilterButtons({ formId, section }: { formId: string; section: AdminSection }) {
  return (
    <div className="flex items-end gap-2">
      <Button form={formId} type="submit" className="rounded-full bg-[#0A2A66] text-white hover:bg-[#1D4ED8]">
        <Filter className="size-4" />
        Apply
      </Button>
      <Link href={adminHref(section)} className={buttonVariants({ variant: "outline", className: "rounded-full" })}>
        Clear
      </Link>
    </div>
  );
}

function SearchInput({ formId, label, defaultValue }: { formId?: string; label: string; defaultValue: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="q">{label}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input form={formId} id="q" name="q" defaultValue={defaultValue} className="pl-9" />
      </div>
    </div>
  );
}

function EntityTable({ headers, rows }: { headers: string[]; rows: Array<{ key: string; cells: ReactNode[] }> }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 last:text-right">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-slate-50/70">
                {row.cells.map((cell, index) => (
                  <td key={index} className="px-4 py-3 last:text-right">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EntityCell({ image, title, subtitle }: { image?: string; title: string; subtitle?: string }) {
  return (
    <div className="flex min-w-64 items-center gap-3">
      <div className="relative size-14 overflow-hidden rounded-xl bg-slate-100">
        {image ? (
          <Image src={image} alt={title} fill sizes="56px" unoptimized className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-slate-400">
            <ImageIcon className="size-5" />
          </div>
        )}
      </div>
      <div>
        <p className="font-semibold text-[#111827]">{title}</p>
        {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function TextEntityCell({ title, text }: { title: string; text: string }) {
  return (
    <div className="min-w-72 max-w-xl">
      <p className="font-semibold text-[#111827]">{title}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function RowActions({
  collection,
  viewHref,
  editHref,
  redirectTo,
  hidden,
}: {
  collection: AdminCollection;
  viewHref: string;
  editHref: string;
  redirectTo: string;
  hidden: Record<string, string>;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Link href={viewHref} className={iconButtonClass()} title="View">
        <Eye className="size-4" />
      </Link>
      <Link href={editHref} className={iconButtonClass()} title="Edit">
        <PenLine className="size-4" />
      </Link>
      <details className="relative">
        <summary className={cn(iconButtonClass(), "cursor-pointer list-none text-red-600 hover:bg-red-50")} title="Delete">
          <Trash2 className="size-4" />
        </summary>
        <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-red-100 bg-white p-3 text-left shadow-xl">
          <p className="text-xs font-medium text-slate-600">Confirm delete?</p>
          <form action="/api/admin/delete" method="post" className="mt-2">
            <input type="hidden" name="collection" value={collection} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            {Object.entries(hidden).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}
            <Button type="submit" variant="destructive" className="w-full rounded-full">
              Delete
            </Button>
          </form>
        </div>
      </details>
    </div>
  );
}

function iconButtonClass() {
  return "inline-flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-[#0A2A66]";
}

function EditShell({ title, backHref, children }: { title: string; backHref: string; children: ReactNode }) {
  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">Only this form is open. Save to update local JSON data.</p>
        </div>
        <Link href={backHref} className={buttonVariants({ variant: "outline", className: "mt-4 rounded-full md:mt-0" })}>
          Back to list
        </Link>
      </div>
      {children}
    </div>
  );
}

function FormSection({
  title,
  children,
  columns = 3,
}: {
  title: string;
  children: ReactNode;
  columns?: 1 | 3;
}) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className={cn("grid gap-4", columns === 3 ? "md:grid-cols-3" : "grid-cols-1")}>
        {children}
      </CardContent>
    </Card>
  );
}

function FormActions({ backHref, label }: { backHref: string; label: string }) {
  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur">
      <Button type="submit" className="rounded-full bg-[#0A2A66] px-5 text-white hover:bg-[#1D4ED8]">
        {label}
      </Button>
      <Link href={backHref} className={buttonVariants({ variant: "outline", className: "rounded-full" })}>
        Cancel
      </Link>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  helperText,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  helperText?: string;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} />
      {helperText ? <p className="text-xs leading-5 text-slate-500">{helperText}</p> : null}
    </div>
  );
}

function SlugPreview({ slug }: { slug: string }) {
  return (
    <div className="grid gap-2">
      <Label>Slug</Label>
      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
        Slug: {slug || "generated-from-city-name"}
      </div>
      <p className="text-xs leading-5 text-slate-500">
        Generated automatically from the city name and saved as a lowercase URL-safe slug.
      </p>
    </div>
  );
}

function Area({
  label,
  name,
  defaultValue,
  placeholder,
  helperText,
  rows = 4,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  helperText?: string;
  rows?: number;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} defaultValue={defaultValue} placeholder={placeholder} rows={rows} />
      {helperText ? <p className="text-xs leading-5 text-slate-500">{helperText}</p> : null}
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  children,
  formId,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: ReactNode;
  formId?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        form={formId}
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>
    </div>
  );
}

function CitySelect({ cities, defaultValue }: { cities: City[]; defaultValue?: string }) {
  return (
    <SelectField label="City" name="citySlug" defaultValue={defaultValue || cities[0]?.slug || "muscat"}>
      {cities.map((city) => (
        <option key={city.id} value={city.slug}>
          {city.name}, {city.country}
        </option>
      ))}
    </SelectField>
  );
}

function StatusSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <SelectField label="Status" name="status" defaultValue={defaultValue || "published"}>
      <option value="published">Published</option>
      <option value="draft">Draft</option>
    </SelectField>
  );
}

function Toggle({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="size-4 rounded border-slate-300 text-[#1D4ED8]"
      />
      {label}
    </label>
  );
}

function HiddenTimestamps({ createdAt }: { createdAt?: string }) {
  return <input type="hidden" name="createdAt" value={createdAt ?? ""} />;
}

function StatusBadge({ status }: { status: string }) {
  const published = status === "published";
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold",
        published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
      )}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

function PublishBadge({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold",
        published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
      )}
    >
      {published ? "Published" : "Unpublished"}
    </span>
  );
}

function Alert({ tone, children }: { tone: "danger" | "success"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "mb-6 rounded-xl border p-4 text-sm font-medium",
        tone === "danger" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {children}
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <FolderKanban className="mx-auto size-8 text-[#1D4ED8]" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={buttonVariants({
        className: "rounded-full bg-[#0A2A66] px-4 text-white hover:bg-[#1D4ED8]",
      })}
    >
      <Plus className="size-4" />
      {label}
    </Link>
  );
}

function ReadOnlySetting({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#111827]">{value}</p>
    </div>
  );
}

function adminHref(section: AdminSection, params: Record<string, string> = {}) {
  const search = new URLSearchParams({ section, ...params });
  return `/admin/dashboard?${search.toString()}`;
}

function getSection(value: string | string[] | undefined): AdminSection {
  const section = getParam(value);
  return navigation.some((item) => item.section === section) ? (section as AdminSection) : "dashboard";
}

function sectionTitle(section: AdminSection) {
  return navigation.find((item) => item.section === section)?.label || "Dashboard";
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function getContentFilters(params: SearchParams) {
  return {
    q: getParam(params.q).toLowerCase(),
    city: getParam(params.city),
    status: getParam(params.status),
    category: getParam(params.category),
  };
}

function getCrudMode(params: SearchParams) {
  const mode = getParam(params.mode);
  const action = getParam(params.action);

  if (mode) {
    return mode;
  }

  if (action === "new") {
    return "add";
  }

  return action;
}

function searchBlob(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ").toLowerCase();
}

function matchesCity(citySlug: string, filterValue: string) {
  return !filterValue || filterValue === "all" || citySlug === filterValue;
}

function matchesStatus(status: string, filterValue: string) {
  return !filterValue || filterValue === "all" || status === filterValue;
}

function matchesPublication(isPublished: boolean, filterValue: string) {
  return !filterValue || filterValue === "all" || (filterValue === "published" ? isPublished : !isPublished);
}

function matchesValue(value: string, filterValue?: string) {
  return !filterValue || filterValue === "all" || value === filterValue;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function cityLabel(cities: City[], citySlug: string) {
  const city = cities.find((item) => item.slug === citySlug);
  return city ? `${city.name}, ${city.country}` : citySlug;
}

function restaurantCityLabel(cities: City[], restaurant: Restaurant) {
  const city = cities.find((item) => item.id === restaurant.cityId);
  return city ? `${city.name}, ${city.country}` : restaurant.cityId;
}

function restaurantCitySlug(cities: City[], restaurant?: Restaurant) {
  return cities.find((city) => city.id === restaurant?.cityId)?.slug;
}

function restaurantOptions(restaurants: Restaurant[], cities: City[]) {
  return restaurants.map((restaurant) => ({
    id: restaurant.id,
    label: restaurant.name,
    meta: [restaurant.cuisineType, restaurantCityLabel(cities, restaurant)].filter(Boolean).join(" - "),
    description: restaurant.shortDescription || restaurant.address,
    image: restaurant.image,
    badge: restaurant.priceRange || restaurant.cuisineType || "Restaurant",
  }));
}

function countryOptions(cities: City[]) {
  const options = new Map<
    string,
    { id: string; label: string; meta?: string; description?: string; image?: string; badge?: string }
  >();
  const cityCounts = new Map<string, number>();

  for (const city of cities) {
    const country = city.country?.trim();

    if (!country) {
      continue;
    }

    const id = slugify(country);
    cityCounts.set(id, (cityCounts.get(id) || 0) + 1);

    if (!options.has(id)) {
      options.set(id, {
        id,
        label: country,
        description: `Country hub for ${country}.`,
        image: city.featuredImage || city.heroImage || city.cardImage,
        badge: "Country",
      });
    }
  }

  return Array.from(options.values())
    .map((option) => {
      const count = cityCounts.get(option.id) || 0;
      return {
        ...option,
        meta: `${count} ${count === 1 ? "city" : "cities"}`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

function guideTargetLabel(guide: Guide, cities: City[], destinations: Destination[]) {
  if (guide.targetType === "country") {
    const country = cities.find((city) => slugify(city.country) === guide.countryId)?.country;
    return country ? `Country: ${country}` : `Country: ${guide.countryId || "Unassigned"}`;
  }

  if (guide.targetType === "destination") {
    const destination = destinations.find((item) => item.id === guide.destinationId);
    return destination ? `Destination: ${destination.name}` : `Destination: ${guide.destinationId || "Unassigned"}`;
  }

  return `City: ${cityLabel(cities, guide.citySlug)}`;
}

function guideViewHref(guide: Guide) {
  return guide.targetType === "city" && guide.citySlug
    ? `/${guide.citySlug}/guides/${guide.slug}`
    : `/guides/${guide.slug}`;
}

function isPublished(item: { status: string }) {
  return item.status === "published";
}

function isDraft(item: { status: string }) {
  return item.status === "draft";
}

function lines(value?: string[]) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function commaList(value?: string[]) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function formatFaqText(faqs?: Guide["faqs"]) {
  return Array.isArray(faqs)
    ? faqs.map((faq) => `Question: ${faq.question}\nAnswer: ${faq.answer}`).join("\n\n")
    : "";
}

function formatTableOfContentsText(tableOfContents?: Guide["tableOfContents"]) {
  return Array.isArray(tableOfContents)
    ? tableOfContents.map((item) => `${item.label} | ${item.anchor}`).join("\n")
    : "";
}

function formatDate(value: string) {
  if (!value) {
    return "Not saved";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not saved"
    : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}
