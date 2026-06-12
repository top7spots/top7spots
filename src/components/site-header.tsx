import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BookOpen, Building2, ChevronDown, Compass, Globe2, MapPin, Menu } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { BrandLogo } from "@/components/brand-logo";
import { SearchBox } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { countryPath } from "@/lib/country-hubs";
import { getCanonicalDestinationPath } from "@/lib/city-intelligence";
import { getPublishedCities, getPublishedDestinations, getPublishedGuides } from "@/lib/data";
import { getGuideHref } from "@/lib/guide-routes";
import { getCurrentUser, userAvatarUrl, userDisplayName, userInitials } from "@/lib/public-auth";
import type { City, Destination, Guide } from "@/lib/types";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  variant?: "default" | "homepage";
};

export async function SiteHeader({ variant = "default" }: SiteHeaderProps = {}) {
  const isHomepage = variant === "homepage";
  const [cities, destinations, guides, user] = await Promise.all([
    getPublishedCities(),
    getPublishedDestinations(),
    getPublishedGuides(),
    getCurrentUser(),
  ]);
  const cityBySlug = new Map(cities.map((city) => [city.slug, city]));
  const cityGroups = groupCitiesByCountry(cities);
  const destinationGroups = groupDestinationsByCity(destinations, cityBySlug);
  const guideGroups = groupGuidesByCity(guides, cityBySlug);

  return (
    <header
      className={cn(
        "sticky top-0 z-[60] shadow-sm",
        isHomepage
          ? "border-b border-white/10 bg-[#0A2A66]/95 text-white shadow-blue-950/20 backdrop-blur-xl"
          : "border-b border-slate-200 bg-white/95 shadow-slate-950/5 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <BrandLogo
          variant={isHomepage ? "dark" : "light"}
          useHeaderAsset
          imageClassName="h-9 w-auto sm:h-10 lg:h-11"
        />

        {!isHomepage ? (
          <div className="hidden flex-1 justify-center px-3 md:flex lg:px-5">
            <SearchBox
              containerClassName="relative w-full max-w-xl"
              placeholder="Search cities, spots, guides..."
            />
          </div>
        ) : (
          <div className="hidden flex-1 lg:block" />
        )}

        <DesktopNavigation
          cityGroups={cityGroups}
          destinationGroups={destinationGroups}
          guideGroups={guideGroups}
          variant={variant}
        />

        <div className={cn("items-center gap-2", isHomepage ? "flex" : "hidden md:flex")}>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 rounded-full",
              isHomepage
                ? "border-white/30 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                : "border-slate-200",
            )}
            aria-label="Select language, English"
          >
            <Globe2 className="size-4" aria-hidden="true" />
            EN
          </Button>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <HeaderAuthControls user={user} variant={variant} />
        </div>

        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "rounded-full lg:hidden",
                  isHomepage
                    ? "border-white/30 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                    : "",
                )}
                aria-label="Open menu"
              />
            }
          >
            <Menu className="size-4" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="right" className="z-[70] w-80 max-w-[calc(100vw-1rem)] overflow-y-auto bg-[#0A2A66] text-white">
            <SheetHeader>
              <SheetTitle>
                <BrandLogo variant="dark" useHeaderAsset imageClassName="h-12 w-auto" />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 grid gap-2 overflow-y-auto px-3 pb-6">
              <details className="group rounded-lg">
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white">
                  Cities
                  <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="grid gap-4 px-3 pb-3 pt-1">
                  {cityGroups.slice(0, 8).map((group) => (
                    <div key={group.country}>
                      <Link href={countryPath(group.country)} className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-200">
                        {group.country}
                      </Link>
                      <div className="mt-2 grid gap-1.5">
                        {group.cities.slice(0, 5).map((city) => (
                          <Link key={city.id} href={`/${city.slug}`} className="text-sm font-medium text-white/80 transition hover:text-white">
                            {city.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
              {destinationGroups.length > 0 ? (
                <details className="group rounded-lg">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white">
                    Destinations
                    <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="grid gap-4 px-3 pb-3 pt-1">
                    <Link href="/destinations" className="text-sm font-semibold text-white transition hover:text-orange-200">
                      View all destinations
                    </Link>
                    {destinationGroups.slice(0, 8).map((group) => (
                      <div key={group.label}>
                        {group.href ? (
                          <Link href={group.href} className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-200">
                            {group.label}
                          </Link>
                        ) : (
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-200">
                            {group.label}
                          </p>
                        )}
                        <div className="mt-2 grid gap-1.5">
                          {group.destinations.slice(0, 4).map((destination) => (
                            <Link
                              key={destination.id}
                              href={getCanonicalDestinationPath(destination, cityBySlug.get(destination.citySlug))}
                              className="line-clamp-1 text-sm font-medium text-white/80 transition hover:text-white"
                            >
                              {destination.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  href="/destinations"
                  className="rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                >
                  Destinations
                </Link>
              )}
              {guideGroups.length > 0 ? (
                <details className="group rounded-lg">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white">
                    Travel Guides
                    <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="grid gap-4 px-3 pb-3 pt-1">
                    <Link href="/guides" className="text-sm font-semibold text-white transition hover:text-orange-200">
                      All travel guides
                    </Link>
                    {guideGroups.slice(0, 8).map((group) => (
                      <div key={group.city.id}>
                        <Link href={`/${group.city.slug}/guides`} className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-200">
                          {group.city.name}
                        </Link>
                        <div className="mt-2 grid gap-1.5">
                          {group.guides.slice(0, 3).map((guide) => (
                            <Link
                              key={guide.id}
                              href={getGuideHref(guide)}
                              className="line-clamp-1 text-sm font-medium text-white/80 transition hover:text-white"
                            >
                              {guide.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  href="/guides"
                  className="rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                >
                  Travel Guides
                </Link>
              )}
              <MobileAuthControls user={user} />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function HeaderAuthControls({
  user,
  variant = "default",
}: {
  user: Awaited<ReturnType<typeof getCurrentUser>>;
  variant?: SiteHeaderProps["variant"];
}) {
  const isHomepage = variant === "homepage";

  if (!user) {
    return (
      <>
        <Link
          href="/signin"
          className={cn(
            "inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold transition",
            isHomepage ? "bg-white/10 text-white hover:bg-white/15" : "bg-[#0A2A66] text-white hover:bg-[#123A7A]",
          )}
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className={cn(
            "inline-flex h-9 items-center rounded-full border px-4 text-sm font-semibold transition",
            isHomepage
              ? "border-white/25 text-white hover:bg-white/10"
              : "border-slate-200 bg-white text-[#0A2A66] hover:bg-orange-50",
          )}
        >
          Sign up
        </Link>
      </>
    );
  }

  const displayName = userDisplayName(user);
  const avatarUrl = userAvatarUrl(user);

  return (
    <details className="group relative">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-2 rounded-full border px-2 py-1 text-sm font-semibold shadow-sm transition [&::-webkit-details-marker]:hidden",
          isHomepage
            ? "border-white/25 bg-white/10 text-white hover:bg-white/15"
            : "border-slate-200 bg-white text-[#0A2A66] hover:bg-orange-50",
        )}
        aria-label="Open account menu"
      >
        <UserAvatar name={displayName} avatarUrl={avatarUrl} className="size-8" />
        <span className="max-w-24 truncate">{displayName}</span>
        <ChevronDown className="size-3.5 transition group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
        <Link href="/account" className="block rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-orange-50 hover:text-[#0A2A66]">
          Account
        </Link>
        <form action={signOutAction}>
          <button type="submit" className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 transition hover:bg-orange-50 hover:text-[#0A2A66]">
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}

function MobileAuthControls({ user }: { user: Awaited<ReturnType<typeof getCurrentUser>> }) {
  if (!user) {
    return (
      <div className="mt-4 grid gap-2 border-t border-white/10 pt-4">
        <Link href="/signin" className="rounded-lg bg-white px-3 py-3 text-sm font-semibold text-[#0A2A66] transition hover:bg-orange-100">
          Sign in
        </Link>
        <Link href="/signup" className="rounded-lg border border-white/15 px-3 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
          Create account
        </Link>
      </div>
    );
  }

  const displayName = userDisplayName(user);
  const avatarUrl = userAvatarUrl(user);

  return (
    <div className="mt-4 grid gap-2 border-t border-white/10 pt-4">
      <div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-3">
        <UserAvatar name={displayName} avatarUrl={avatarUrl} className="size-9" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          <p className="truncate text-xs text-white/65">{user.email}</p>
        </div>
      </div>
      <Link href="/account" className="rounded-lg px-3 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white">
        Account
      </Link>
      <form action={signOutAction}>
        <button type="submit" className="w-full rounded-lg px-3 py-3 text-left text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white">
          Sign out
        </button>
      </form>
    </div>
  );
}

function UserAvatar({ name, avatarUrl, className }: { name: string; avatarUrl: string; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-50 text-xs font-bold text-[#C24A00] ring-1 ring-orange-100", className)}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="size-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        userInitials(name)
      )}
    </span>
  );
}

function DesktopNavigation({
  cityGroups,
  destinationGroups,
  guideGroups,
  variant = "default",
}: {
  cityGroups: ReturnType<typeof groupCitiesByCountry>;
  destinationGroups: ReturnType<typeof groupDestinationsByCity>;
  guideGroups: ReturnType<typeof groupGuidesByCity>;
  variant?: SiteHeaderProps["variant"];
}) {
  const isHomepage = variant === "homepage";
  const navItemClassName = cn(
    "relative inline-flex items-center gap-1.5 px-3 py-5 transition after:absolute after:bottom-3 after:left-3 after:right-3 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-[#FF6B00] after:content-[''] after:transition-transform group-hover:after:scale-x-100 group-focus-within:after:scale-x-100 focus-visible:outline-none focus-visible:after:scale-x-100",
    isHomepage ? "text-white/90 hover:text-white" : "text-slate-700 hover:text-[#0A2A66]",
  );
  const panelClassName =
    "invisible absolute top-full z-50 translate-y-3 rounded-[1.75rem] border border-slate-200/80 bg-white p-5 text-slate-900 opacity-0 shadow-[0_24px_70px_rgb(15_23_42_/_18%)] ring-1 ring-white/80 transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100";

  return (
    <nav className={cn("hidden items-center gap-1 text-sm font-semibold lg:flex", isHomepage ? "text-white" : "text-slate-700")}>
      <div className="group relative">
        <Link href="/#all-cities" className={navItemClassName}>
          Cities
          <ChevronDown className="size-3.5 transition group-hover:rotate-180" aria-hidden="true" />
        </Link>
        {cityGroups.length > 0 ? (
          <div className={cn(panelClassName, "left-1/2 w-[640px] -translate-x-1/2")}>
            <MegaMenuIntro
              icon={<Building2 className="size-5" aria-hidden="true" />}
              title="Explore cities"
              subtitle="Start with popular travel hubs and curated city guides."
            />
            <div className="mt-5 grid grid-cols-2 gap-4">
              {cityGroups.slice(0, 6).map((group) => (
                <div key={group.country}>
                  <Link href={countryPath(group.country)} className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8] transition hover:text-[#0A2A66]">
                    {group.country}
                  </Link>
                  <div className="mt-3 grid gap-2">
                    {group.cities.slice(0, 5).map((city) => (
                      <MegaMenuRow key={city.id} href={`/${city.slug}`} icon={<MapPin className="size-3.5" aria-hidden="true" />}>
                        {city.name}
                      </MegaMenuRow>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <MegaMenuFooter href="/#all-cities" label="View all cities" />
          </div>
        ) : null}
      </div>
      <div className="group relative">
        <Link href="/destinations" className={navItemClassName}>
          Destinations
          <ChevronDown className="size-3.5 transition group-hover:rotate-180" aria-hidden="true" />
        </Link>
        {destinationGroups.length > 0 ? (
          <div className={cn(panelClassName, "left-1/2 w-[660px] -translate-x-1/2")}>
            <MegaMenuIntro
              icon={<Compass className="size-5" aria-hidden="true" />}
              title="Explore destinations"
              subtitle="Browse curated spots grouped by city and country context."
            />
            <div className="mt-5 grid grid-cols-2 gap-4">
              {destinationGroups.slice(0, 6).map((group) => (
                <div key={group.label}>
                  {group.href ? (
                    <Link href={group.href} className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8] transition hover:text-[#0A2A66]">
                      {group.label}
                    </Link>
                  ) : (
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
                      {group.label}
                    </p>
                  )}
                  <div className="mt-3 grid gap-2">
                    {group.destinations.slice(0, 4).map((destination) => (
                      <MegaMenuRow
                        key={destination.id}
                        href={getCanonicalDestinationPath(destination, group.city)}
                        icon={<Compass className="size-3.5" aria-hidden="true" />}
                      >
                        {destination.name}
                      </MegaMenuRow>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <MegaMenuFooter href="/destinations" label="View all destinations" />
          </div>
        ) : null}
      </div>
      <div className="group relative">
        <Link href="/guides" className={navItemClassName}>
          Travel Guides
          <ChevronDown className="size-3.5 transition group-hover:rotate-180" aria-hidden="true" />
        </Link>
        {guideGroups.length > 0 ? (
          <div className={cn(panelClassName, "right-0 w-[620px]")}>
            <MegaMenuIntro
              icon={<BookOpen className="size-5" aria-hidden="true" />}
              title="Travel guides"
              subtitle="Read practical planning notes connected to the places you are exploring."
            />
            <div className="mt-5 grid grid-cols-2 gap-4">
              {guideGroups.slice(0, 6).map((group) => (
                <div key={group.city.id}>
                  <Link href={`/${group.city.slug}/guides`} className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8] transition hover:text-[#0A2A66]">
                    {group.city.name}
                  </Link>
                  <div className="mt-3 grid gap-2">
                    {group.guides.slice(0, 3).map((guide) => (
                      <MegaMenuRow
                        key={guide.id}
                        href={getGuideHref(guide)}
                        icon={<BookOpen className="size-3.5" aria-hidden="true" />}
                      >
                        {guide.title}
                      </MegaMenuRow>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <MegaMenuFooter href="/guides" label="View all guides" />
          </div>
        ) : null}
      </div>
    </nav>
  );
}

function MegaMenuIntro({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1D4ED8]">
        {icon}
      </span>
      <div>
        <p className="text-base font-semibold tracking-tight text-[#0A2A66]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function MegaMenuRow({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group/item flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-sm font-semibold text-[#0A2A66] transition hover:border-blue-200 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[#1D4ED8] shadow-sm">
          {icon}
        </span>
        <span className="line-clamp-1">{children}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-slate-400 transition group-hover/item:translate-x-0.5 group-hover/item:text-[#FF6B00]" aria-hidden="true" />
    </Link>
  );
}

function MegaMenuFooter({ href, label }: { href: string; label: string }) {
  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#0A2A66] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
      >
        {label}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

function groupCitiesByCountry(cities: City[]) {
  const groups = new Map<string, City[]>();

  for (const city of cities) {
    const country = city.country || "Global";
    groups.set(country, [...(groups.get(country) || []), city]);
  }

  return Array.from(groups.entries())
    .map(([country, groupCities]) => ({
      country,
      cities: [...groupCities].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.country.localeCompare(b.country));
}

function groupDestinationsByCity(destinations: Destination[], cityBySlug: Map<string, City>) {
  const groups = new Map<string, { label: string; href?: string; city?: City; destinations: Destination[] }>();

  for (const destination of sortDestinations(destinations)) {
    if (!destination.name || !destination.slug) {
      continue;
    }

    const city = cityBySlug.get(destination.citySlug);
    const key = city?.slug || destination.city || destination.region || "More destinations";
    const label = city?.name || destination.city || destination.region || "More destinations";
    const current = groups.get(key);

    groups.set(key, {
      label,
      href: city ? `/${city.slug}` : undefined,
      city,
      destinations: [...(current?.destinations || []), destination],
    });
  }

  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function sortDestinations(destinations: Destination[]) {
  return [...destinations].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) {
      return a.isFeatured ? -1 : 1;
    }

    const orderA = a.displayOrder || 999;
    const orderB = b.displayOrder || 999;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const cityCompare = a.city.localeCompare(b.city);
    return cityCompare || a.name.localeCompare(b.name);
  });
}

function groupGuidesByCity(guides: Guide[], cityBySlug: Map<string, City>) {
  const groups = new Map<string, { city: City; guides: Guide[] }>();

  for (const guide of guides) {
    if (guide.targetType !== "city") {
      continue;
    }

    const city = cityBySlug.get(guide.citySlug);

    if (!city) {
      continue;
    }

    const current = groups.get(city.slug);
    groups.set(city.slug, {
      city,
      guides: [...(current?.guides || []), guide],
    });
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      guides: [...group.guides].sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) {
          return a.isFeatured ? -1 : 1;
        }

        const orderA = a.displayOrder || 999;
        const orderB = b.displayOrder || 999;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return a.title.localeCompare(b.title);
      }),
    }))
    .sort((a, b) => a.city.name.localeCompare(b.city.name));
}
