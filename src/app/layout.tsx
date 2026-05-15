import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Top7Spots | Curated Travel Destinations and Hidden Gems",
  description:
    "Top7Spots is a premium global travel discovery platform for curated destinations, hidden gems, road trips, beaches, mountains, guides, and luxury experiences.",
  metadataBase: new URL("https://top7spots.com"),
  openGraph: {
    title: "Top7Spots",
    description:
      "Discover curated travel destinations, hidden gems, guides, and top recommended places around the world.",
    url: "https://top7spots.com",
    siteName: "Top7Spots",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
