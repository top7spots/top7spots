import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import { resolveImagePath } from "@/lib/images";
import type { Author } from "@/lib/types";

const fallbackAuthor = {
  name: "Safir Thorappa",
  role: "Editor, Top7Spots",
  bio: "Safir edits Top7Spots destination pages with a focus on practical travel context, route planning, and clear local decision-making for readers.",
};

type DestinationAuthorSectionProps = {
  author?: Author;
};

export function DestinationAuthorSection({ author }: DestinationAuthorSectionProps) {
  const name = author?.name || fallbackAuthor.name;
  const role = author?.role || fallbackAuthor.role;
  const bio = author?.shortBio || fallbackAuthor.bio;
  const profileHref = author ? `/authors/${author.slug}` : "";
  const content = (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <AuthorAvatar author={author} fallbackName={name} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#FF6B00]">About the author</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#111827]">{name}</h2>
        <p className="mt-1 text-sm font-semibold text-[#1D4ED8]">{role}</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{bio}</p>
        {author?.expertise?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {author.expertise.slice(0, 5).map((item) => (
              <span key={item} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#B54708]">
                {item}
              </span>
            ))}
          </div>
        ) : null}
        {profileHref ? (
          <span className="mt-4 inline-flex text-sm font-semibold text-[#1D4ED8]">View author profile</span>
        ) : null}
      </div>
    </div>
  );

  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8" aria-label="About the author">
      <div className="rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)] md:p-7">
        {profileHref ? (
          <Link href={profileHref} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    </section>
  );
}

export function selectDestinationAuthor(authors: Author[]) {
  return (
    authors.find((author) => author.name.toLowerCase() === fallbackAuthor.name.toLowerCase()) ||
    authors.find((author) => author.slug === "safir-thorappa") ||
    authors.find((author) => author.slug.startsWith("safir"))
  );
}

function AuthorAvatar({ author, fallbackName }: { author?: Author; fallbackName: string }) {
  const image = author?.profileImage ? resolveImagePath(author.profileImage) : "";
  const initials = fallbackName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="relative flex size-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-blue-100 text-xl font-semibold text-[#0A2A66] shadow-inner">
      {image ? (
        <SafeImage
          src={image}
          alt={author?.profileImageAlt || fallbackName}
          fill
          sizes="80px"
          className="object-cover"
        />
      ) : (
        <span className="grid size-full place-items-center">{initials}</span>
      )}
    </span>
  );
}
