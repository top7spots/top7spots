import Link from "next/link";

type BreadcrumbTrailItem = {
  label: string;
  href?: string;
};

export function BreadcrumbTrail({ items }: { items: BreadcrumbTrailItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
      <Link href="/" className="transition hover:text-[#1D4ED8]">
        Home
      </Link>
      {items.map((item) => (
        <span key={`${item.label}-${item.href || "current"}`} className="flex items-center gap-2">
          <span className="text-slate-300">/</span>
          {item.href ? (
            <Link href={item.href} className="transition hover:text-[#1D4ED8]">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-700">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
