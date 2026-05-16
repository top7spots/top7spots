import {
  absoluteImageUrl,
  absoluteUrl,
  cleanPath,
  defaultSeoDescription,
  defaultSeoImage,
  siteBaseUrl,
  siteName,
} from "@/lib/seo";

type BreadcrumbItem = {
  name: string;
  path: string;
};

type JsonLdProps = {
  data: Record<string, unknown>;
};

type PlaceJsonLdProps = {
  name: string;
  description?: string;
  image?: string;
  path: string;
  city?: string;
  country?: string;
  region?: string;
  type?: "Place" | "TouristDestination";
};

type ArticleJsonLdProps = {
  title: string;
  description?: string;
  image?: string;
  path: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
  section?: string;
};

type FAQItem = {
  question: string;
  answer: string;
};

function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

function compactObject<T extends Record<string, unknown>>(object: T) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return value !== undefined && value !== null && value !== "";
    }),
  );
}

function postalAddress({
  city,
  country,
  region,
}: Pick<PlaceJsonLdProps, "city" | "country" | "region">) {
  const address = compactObject({
    "@type": "PostalAddress",
    addressLocality: city,
    addressRegion: region,
    addressCountry: country,
  });

  return Object.keys(address).length > 1 ? address : undefined;
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

export function PlaceJsonLd({
  name,
  description,
  image,
  path,
  city,
  country,
  region,
  type = "Place",
}: PlaceJsonLdProps) {
  return (
    <JsonLd
      data={compactObject({
        "@context": "https://schema.org",
        "@type": type,
        name,
        description: description || defaultSeoDescription,
        image: imageObject(image),
        url: absoluteUrl(cleanPath(path)),
        address: postalAddress({ city, country, region }),
      })}
    />
  );
}

export function TouristDestinationJsonLd(props: Omit<PlaceJsonLdProps, "type">) {
  return <PlaceJsonLd {...props} type="TouristDestination" />;
}

export function ArticleJsonLd({
  title,
  description,
  image,
  path,
  author,
  datePublished,
  dateModified,
  section,
}: ArticleJsonLdProps) {
  const url = absoluteUrl(cleanPath(path));

  return (
    <JsonLd
      data={compactObject({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        name: title,
        description: description || defaultSeoDescription,
        image: imageObject(image),
        url,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": url,
        },
        author: {
          "@type": "Organization",
          name: author || siteName,
        },
        publisher: {
          "@type": "Organization",
          name: siteName,
          logo: imageObject("/brand/top7spots-light.png"),
        },
        articleSection: section,
        datePublished,
        dateModified: dateModified || datePublished,
      })}
    />
  );
}

export function FAQPageJsonLd({ faqs }: { faqs: FAQItem[] }) {
  const validFaqs = faqs.filter((faq) => faq.question && faq.answer);

  if (validFaqs.length === 0) {
    return null;
  }

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: validFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
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
