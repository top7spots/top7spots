import Link from "next/link";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, Mail, MapPin, UserRound } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { BreadcrumbTrail } from "@/components/breadcrumb-trail";
import { JsonLd } from "@/components/seo-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getAuthorBySlug, getPublishedGuidesByAuthor } from "@/lib/data";
import { getGuideHref } from "@/lib/guide-routes";
import { guideImageAlt } from "@/lib/image-seo";
import { resolveImagePath } from "@/lib/images";
import { absoluteSeoImageUrl, absoluteUrl, cleanPath, seoMetadata, siteName } from "@/lib/seo";
import type { Author, Guide } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AuthorPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);

  if (!author) {
    return {};
  }

  return seoMetadata({
    title: author.seoTitle || `${author.name} - Top7Spots Author`,
    description:
      author.seoDescription ||
      author.shortBio ||
      `Read travel guides and destination articles by ${author.name} on Top7Spots.`,
    path: `/authors/${author.slug}`,
    image: author.profileImage,
    imageAlt: author.profileImageAlt || `Portrait of ${author.name}`,
  });
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);

  if (!author) {
    notFound();
  }

  const guides = await getPublishedGuidesByAuthor(author.id);
  const image = author.profileImage ? resolveImagePath(author.profileImage) : "";
  const jsonLd = buildAuthorJsonLd(author);

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <JsonLd data={jsonLd} />
      <SiteHeader />
      <main>
        <section className="px-4 pb-8 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <BreadcrumbTrail
              items={[
                { label: "Guides", href: "/guides" },
                { label: author.name },
              ]}
            />
            <div className="mt-3 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[180px_minmax(0,1fr)] lg:p-10">
                <div className="relative size-36 overflow-hidden rounded-full border border-slate-200 bg-slate-100 md:size-44">
                  {image ? (
                    <SafeImage
                      src={image}
                      alt={author.profileImageAlt || author.name}
                      fill
                      priority
                      sizes="176px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-slate-400">
                      <UserRound className="size-14" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1D4ED8]">Top7Spots author</p>
                  <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight text-[#111827] md:text-5xl">
                    {author.name}
                  </h1>
                  {author.role || author.location ? (
                    <p className="mt-3 text-base font-medium text-slate-600">
                      {[author.role, author.location].filter(Boolean).join(" - ")}
                    </p>
                  ) : null}
                  {author.shortBio ? (
                    <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-[1.0625rem]">
                      {author.shortBio}
                    </p>
                  ) : null}
                  <AuthorLinks author={author} />
                  {author.expertise.length > 0 ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {author.expertise.map((item) => (
                        <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(280px,0.28fr)] lg:items-start">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.04)] md:p-6">
              <p className="text-sm font-medium text-[#1D4ED8]">Bio</p>
              <h2 className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight text-[#111827]">
                About {author.name}
              </h2>
              <div className="mt-4 grid gap-4 text-base leading-7 text-slate-600">
                {(author.fullBio || author.shortBio || "This author profile is being updated.")
                  .split(/\n\s*\n/)
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
              </div>
            </div>

            <aside className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.04)] md:p-6">
              <p className="text-sm font-medium text-[#1D4ED8]">Published guides</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-[#111827]">{guides.length}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Active guide articles currently linked to this author profile.
              </p>
            </aside>
          </div>
        </section>

        <section className="bg-white px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6">
              <p className="text-sm font-medium text-[#1D4ED8]">Latest by {author.name}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#111827]">Travel guides</h2>
            </div>
            {guides.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {guides.map((guide) => (
                  <AuthorGuideCard key={guide.id} guide={guide} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm font-medium text-slate-600">No published guides are linked to this author yet.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function AuthorLinks({ author }: { author: Author }) {
  type AuthorLinkItem = { label: string; href: string; icon: ReactNode };
  const linkItems: Array<AuthorLinkItem | undefined> = [
    author.location ? { label: author.location, href: "", icon: <MapPin className="size-4" aria-hidden="true" /> } : undefined,
    author.websiteUrl ? { label: "Website", href: author.websiteUrl, icon: <ExternalLink className="size-4" aria-hidden="true" /> } : undefined,
    author.linkedinUrl ? { label: "LinkedIn", href: author.linkedinUrl, icon: <ExternalLink className="size-4" aria-hidden="true" /> } : undefined,
    author.instagramUrl ? { label: "Instagram", href: author.instagramUrl, icon: <ExternalLink className="size-4" aria-hidden="true" /> } : undefined,
    author.xUrl ? { label: "X", href: author.xUrl, icon: <ExternalLink className="size-4" aria-hidden="true" /> } : undefined,
    author.email ? { label: "Email", href: `mailto:${author.email}`, icon: <Mail className="size-4" aria-hidden="true" /> } : undefined,
  ];
  const links = linkItems.filter((item): item is AuthorLinkItem => Boolean(item));

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap gap-2.5">
      {links.map((item) =>
        item.href ? (
          <Link
            key={`${item.label}-${item.href}`}
            href={item.href}
            target={item.href.startsWith("http") ? "_blank" : undefined}
            rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0A2A66]"
          >
            {item.icon}
            {item.label}
          </Link>
        ) : (
          <span key={item.label} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm">
            {item.icon}
            {item.label}
          </span>
        ),
      )}
    </div>
  );
}

function AuthorGuideCard({ guide }: { guide: Guide }) {
  const href = getGuideHref(guide);
  const image = guide.coverImage || guide.image ? resolveImagePath(guide.coverImage || guide.image) : "";

  return (
    <article className="group grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#FCFDFF] shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:border-blue-200 hover:shadow-md motion-safe:hover:-translate-y-0.5 sm:grid-cols-[11rem_minmax(0,1fr)]">
      <Link href={href} className="relative block aspect-[16/10] overflow-hidden bg-slate-100 sm:aspect-auto" aria-label={`Read ${guide.title}`}>
        {image ? (
          <SafeImage
            src={image}
            alt={guideImageAlt(guide)}
            fill
            sizes="(min-width: 640px) 180px, calc(100vw - 3rem)"
            quality={65}
            loading="lazy"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full min-h-40 items-center justify-center bg-[#EAF1F8] text-sm font-semibold text-[#1D4ED8]">
            {guide.category || "Guide"}
          </div>
        )}
      </Link>
      <div className="flex min-w-0 flex-col p-5">
        <p className="text-sm font-medium text-[#1D4ED8]">{[guide.category, guide.readTime].filter(Boolean).join(" - ") || "Travel guide"}</p>
        <h3 className="mt-2 line-clamp-2 text-xl font-semibold leading-7 tracking-tight text-[#111827]">
          <Link href={href} className="hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]">
            {guide.title}
          </Link>
        </h3>
        {guide.excerpt || guide.seoDescription ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{guide.excerpt || guide.seoDescription}</p>
        ) : null}
      </div>
    </article>
  );
}

function buildAuthorJsonLd(author: Author) {
  const url = absoluteUrl(cleanPath(`/authors/${author.slug}`));

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}#profile`,
    url,
    name: author.name,
    description: author.seoDescription || author.shortBio,
    mainEntity: {
      "@type": "Person",
      name: author.name,
      url,
      image: absoluteSeoImageUrl(author.profileImage),
      jobTitle: author.role || undefined,
      description: author.shortBio || undefined,
      worksFor: {
        "@type": "Organization",
        name: siteName,
      },
      knowsAbout: author.expertise,
    },
  };
}
