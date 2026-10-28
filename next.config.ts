import type { NextConfig } from "next";

const transportMaxAge = 2 * 365 * 24 * 60 * 60;

const sharedHeaders = [
  { key: "Strict-Transport-Security", value: `max-age=${transportMaxAge}` },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const operatorHeaders = [
  { key: "Cache-Control", value: "no-store" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/", headers: sharedHeaders },
      { source: "/:path*", headers: sharedHeaders },
      { source: "/operator/:path*", headers: operatorHeaders },
      { source: "/en/operator/:path*", headers: operatorHeaders },
      { source: "/api/operator/:path*", headers: operatorHeaders },
    ];
  },
};

export default nextConfig;
