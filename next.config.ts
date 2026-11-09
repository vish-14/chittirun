import type { NextConfig } from "next";

const assetBase = process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `img-src 'self' data: blob: ${assetBase}`.trim(),
      `connect-src 'self' ${assetBase}`.trim(),
      "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
      "style-src 'self' 'unsafe-inline'",
      "media-src 'self' blob: data:",
      "font-src 'self' data:",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

/**
 * BUILD_TARGET=app → static export (`out/`) for the Capacitor Android/iOS apps.
 * Server route handlers are named `route.ts`; restricting pageExtensions to `tsx` leaves them out of the
 * app bundle, so the app is 100 % offline / local-first with no server dependency.
 */
const isApp = process.env.BUILD_TARGET === "app";

const appConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  pageExtensions: ["tsx"],
  images: { unoptimized: true },
  poweredByHeader: false,
  env: { NEXT_PUBLIC_PLATFORM: "app" },
};

const webConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Content-hashed game assets: long-lived immutable caching (CDN friendly).
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default isApp ? appConfig : webConfig;
