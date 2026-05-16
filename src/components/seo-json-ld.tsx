import { absoluteImageUrl, absoluteUrl, cleanPath, defaultSeoDescription, defaultSeoImage, siteBaseUrl, siteName } from "@/lib/seo";

type BreadcrumbItem = {
  name: string;
  path: string;
};

type JsonLdProps = {
  data: Record<string, unknown>;
};

function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: siteName,
        url: siteBaseUrl,
        logo: absoluteImageUrl("/brand/top7spots-light.png"),
        description: defaultSeoDescription,
      }}
    />
  );
}

export function WebsiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteName,
        url: siteBaseUrl,
        description: defaultSeoDescription,
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteBaseUrl}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const breadcrumbItems = [{ name: "Home", path: "/" }, ...items].map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(cleanPath(item.path)),
  }));

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems,
      }}
    />
  );
}

export function imageObject(image?: string) {
  return {
    "@type": "ImageObject",
    url: absoluteImageUrl(image || defaultSeoImage),
  };
}
