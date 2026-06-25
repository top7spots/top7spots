import type { NextConfig } from "next";

// Report-only CSP is intentionally non-enforcing while the app is observed in
// production and preview. Tighten this with nonces/hashes before promoting it
// to a real Content-Security-Policy header.
const cspReportOnlyDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel.app",
  "style-src 'self' 'unsafe-inline' https://*.vercel.app",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://*.vercel.app",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.vercel.app",
  "media-src 'self' data: blob: https://*.supabase.co",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
];

const securityHeaders = [
  {
    key: "Content-Security-Policy-Report-Only",
    value: cspReportOnlyDirectives.join("; "),
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

function supabaseImageHost() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!url) {
    return undefined;
  }

  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

const configuredSupabaseImageHost = supabaseImageHost();
const top7SpotsSupabaseHost = "nilsoxlpjvudlfbmvxbl.supabase.co";
const supabaseImageHosts = Array.from(
  new Set([top7SpotsSupabaseHost, configuredSupabaseImageHost].filter((host): host is string => Boolean(host))),
);
const supabaseStorageBuckets = ["top7spots", "top7spots-media"] as const;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [62, 65, 68, 70, 72, 74, 75, 78],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...supabaseImageHosts.flatMap((hostname) =>
        supabaseStorageBuckets.map((bucket) => ({
          protocol: "https" as const,
          hostname,
          pathname: `/storage/v1/object/public/${bucket}/**`,
        })),
      ),
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
