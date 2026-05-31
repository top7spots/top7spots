import type { Metadata } from "next";
import Script from "next/script";
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
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
        {process.env.NEXT_PUBLIC_TRAVELPAYOUTS_ENABLED === "true" ? (
          <Script
            id="travelpayouts-drive"
            strategy="afterInteractive"
            data-noptimize="1"
            data-cfasync="false"
            data-wpfc-render="false"
            seraph-accel-crit="1"
            data-no-defer="1"
          >
            {`(function () {
  var script = document.createElement("script");
  script.async = 1;
  script.src = "https://emrldtp.cc/NTM0Mjk3.js?t=534297";
  document.head.appendChild(script);
})();`}
          </Script>
        ) : null}
        {children}
      </body>
    </html>
  );
}
