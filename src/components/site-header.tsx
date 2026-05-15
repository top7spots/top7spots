import Link from "next/link";
import { Globe2, Menu, Search } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navigation = [
  { href: "/", label: "Discover" },
  { href: "/destinations", label: "Destinations" },
  { href: "/guides", label: "Guides" },
  { href: "/admin/login", label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <BrandLogo priority imageClassName="h-9 w-auto sm:h-10 lg:h-11" />

        <div className="hidden flex-1 justify-center px-3 md:flex lg:px-5">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Search beaches, mountains, hidden gems..."
            />
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
          {navigation.slice(0, 3).map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-[#1D4ED8]">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="outline" size="sm" className="gap-2 rounded-full border-slate-200">
            <Globe2 className="size-4" aria-hidden="true" />
            EN
          </Button>
          <Link
            href="/admin/login"
            className={buttonVariants({
              size: "sm",
              className: "rounded-full bg-[#0A2A66] px-4 text-white hover:bg-[#1D4ED8]",
            })}
          >
            Admin
          </Link>
        </div>

        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="rounded-full md:hidden"
                aria-label="Open menu"
              />
            }
          >
            <Menu className="size-4" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="right" className="w-80 bg-[#0A2A66] text-white">
            <SheetHeader>
              <SheetTitle>
                <BrandLogo variant="dark" imageClassName="h-12 w-auto" />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 grid gap-2 px-3">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
