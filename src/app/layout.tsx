import type { Metadata } from "next";
import { OrganizationJsonLd } from "@/components/seo-json-ld";
import {
  absoluteImageUrl,
  absoluteUrl,
  defaultSeoDescription,
  defaultSeoTitle,
  siteBaseUrl,
  siteName,
} from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  title: defaultSeoTitle,
  description: defaultSeoDescription,
  metadataBase: new URL(siteBaseUrl),
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: defaultSeoTitle,
    description: defaultSeoDescription,
    url: absoluteUrl("/"),
    siteName,
    type: "website",
    images: [
      {
        url: absoluteImageUrl(),
        width: 1200,
        height: 630,
        alt: defaultSeoTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultSeoTitle,
    description: defaultSeoDescription,
    images: [absoluteImageUrl()],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <OrganizationJsonLd />
        {children}
      </body>
    </html>
  );
}
