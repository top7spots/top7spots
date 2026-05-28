import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Circle,
  Compass,
  Mail,
  MapPin,
  Play,
  Send,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { getSiteSettings } from "@/lib/site-settings";
import type { SiteSettings } from "@/lib/types";

const quickLinks = [
  { href: "/destinations", label: "Destinations" },
  { href: "/guides", label: "Travel Guides" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/disclaimer", label: "Disclaimer" },
];

const categories = [
  "Beaches",
  "Mountains",
  "Luxury",
  "Hidden Gems",
  "Road Trips",
  "City Guides",
];

type SocialLink = {
  key: keyof Pick<
    SiteSettings,
    "youtubeUrl" | "pinterestUrl"
  >;
  label: string;
  icon: LucideIcon;
};

const socialLinks: SocialLink[] = [
  { key: "youtubeUrl", label: "YouTube", icon: Play },
  { key: "pinterestUrl", label: "Pinterest", icon: Circle },
];

export async function SiteFooter() {
  const settings = await getSiteSettings();
  const visibleSocialLinks = socialLinks
    .map((link) => ({ ...link, href: settings[link.key].trim() }))
    .filter((link) => link.href);

  return (
    <footer className="border-t border-white/10 bg-[#071B42] text-white" aria-labelledby="site-footer-title">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.9fr_0.85fr_0.85fr_1.05fr]">
          <section aria-labelledby="site-footer-title">
            <BrandLogo variant="dark" imageClassName="h-14 w-auto sm:h-16" />
            <h2 id="site-footer-title" className="sr-only">
              Top7Spots footer
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-blue-100">
              {settings.footerDescription}
            </p>
            {settings.footerTrustText ? (
              <p className="mt-5 flex max-w-md items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-blue-50">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-orange-200" aria-hidden="true" />
                {settings.footerTrustText}
              </p>
            ) : null}
          </section>

          <nav aria-labelledby="footer-quick-links">
            <h2 id="footer-quick-links" className="text-sm font-semibold text-white">
              Quick Links
            </h2>
            <ul className="mt-4 grid gap-3 text-sm text-blue-100">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-200" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-categories">
            <h2 id="footer-categories" className="text-sm font-semibold text-white">
              Travel Categories
            </h2>
            <ul className="mt-4 grid gap-3 text-sm text-blue-100">
              {categories.map((category) => (
                <li key={category} className="flex items-center gap-2">
                  <Compass className="size-3.5 text-orange-200" aria-hidden="true" />
                  <span>{category}</span>
                </li>
              ))}
            </ul>
          </nav>

          <section aria-labelledby="footer-follow-us">
            <h2 id="footer-follow-us" className="text-sm font-semibold text-white">
              Follow Us
            </h2>
            {visibleSocialLinks.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-3">
                {visibleSocialLinks.map((link) => (
                  <li key={link.key}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Follow Top7Spots on ${link.label}`}
                      className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-blue-50 transition hover:-translate-y-0.5 hover:border-orange-200/60 hover:bg-orange-200 hover:text-[#071B42] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-200"
                    >
                      <link.icon className="size-4" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-6 text-blue-100">
                Social channels will appear here when URLs are added in Website Settings.
              </p>
            )}
          </section>

          <section aria-labelledby="footer-newsletter">
            <h2 id="footer-newsletter" className="text-sm font-semibold text-white">
              Newsletter
            </h2>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-orange-100">Newsletter coming soon</p>
              <p className="mt-2 text-sm leading-6 text-blue-100">
                Destination ideas and practical travel guides are being prepared for inbox delivery.
              </p>
              {settings.newsletterEnabled ? (
                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-blue-50">
                  <Send className="size-3.5" aria-hidden="true" />
                  Signup temporarily disabled
                </span>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 text-sm text-blue-100" aria-labelledby="footer-contact-info">
              <h2 id="footer-contact-info" className="text-sm font-semibold text-white">
                Contact Info
              </h2>
              <span className="flex items-center gap-2">
                <MapPin className="size-4 text-orange-200" aria-hidden="true" />
                Global travel discovery
              </span>
              {settings.contactEmail ? (
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="flex items-center gap-2 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-200"
                >
                  <Mail className="size-4 text-orange-200" aria-hidden="true" />
                  {settings.contactEmail}
                </a>
              ) : null}
            </div>
          </section>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-blue-100 md:flex md:items-center md:justify-between">
          <p>{settings.copyrightText}</p>
          <p className="mt-3 flex items-center gap-2 md:mt-0">
            <BookOpen className="size-3.5 text-orange-200" aria-hidden="true" />
            Curated destination guides for modern travelers.
          </p>
        </div>
      </div>
    </footer>
  );
}
