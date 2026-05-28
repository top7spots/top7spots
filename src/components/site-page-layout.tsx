import Link from "next/link";
import { ArrowRight, Globe2, Menu } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { SitePage } from "@/lib/types";

const navLinks = [
  { href: "/", label: "Discover" },
  { href: "/destinations", label: "Destinations" },
  { href: "/guides", label: "Travel Guides" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SitePageLayout({
  page,
  children,
}: {
  page: SitePage;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <TrustPageHeader />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">
              Top7Spots
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#111827] md:text-6xl">
              {page.title}
            </h1>
            {page.metaDescription ? (
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                {page.metaDescription}
              </p>
            ) : null}
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:px-8">
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <RichText content={page.content} />
          </article>
          {children}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function TrustPageHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Top7Spots home">
          <BrandLogo imageClassName="h-10 w-auto sm:h-11 lg:h-12" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-[#1D4ED8]">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Select language, English"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Globe2 className="size-4" aria-hidden="true" />
            EN
          </button>
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
            <SheetContent side="right" className="z-[70] w-80 max-w-[calc(100vw-1rem)] bg-[#0A2A66] text-white">
              <SheetHeader>
                <SheetTitle>
                  <BrandLogo variant="dark" imageClassName="h-12 w-auto" />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 grid gap-2 px-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                  >
                    {link.label}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function RichText({ content }: { content: string }) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return (
      <p className="text-sm leading-7 text-slate-600">
        This page is being prepared by the Top7Spots team.
      </p>
    );
  }

  return (
    <div className="grid gap-5 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
      {blocks.map((block, index) =>
        isListBlock(block) ? (
          <ul key={index} className="grid gap-2 pl-5">
            {block.split("\n").map((line) => (
              <li key={line} className="list-disc">
                {line.replace(/^[-*]\s*/, "")}
              </li>
            ))}
          </ul>
        ) : (
          <p key={index}>{block}</p>
        ),
      )}
    </div>
  );
}

function isListBlock(block: string) {
  const lines = block.split("\n").filter(Boolean);
  return lines.length > 1 && lines.every((line) => /^[-*]\s+/.test(line.trim()));
}
