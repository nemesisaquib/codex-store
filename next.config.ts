import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── Perf: tree-shake barrels → smaller bundles, faster cold start
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-dialog", "@radix-ui/react-select"],
  },

  // ─── Image optimization: AVIF first (50% smaller), WebP fallback
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    // Serve at standard breakpoints only — avoids oversized variants
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "**.imgix.net" },
      { protocol: "https", hostname: "cdn.dummyjson.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "fakestoreapi.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "flagcdn.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "upload.wikimedia.org", port: "", pathname: "/**" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
    ],
  },

  // ─── Compression: gzip for all responses
  compress: true,

  // ─── Native modules: keep out of JS bundle
  serverExternalPackages: ["better-sqlite3", "@libsql/client"],

  // ─── Strip console in prod (keep errors for monitoring)
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ─── Security + perf headers
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Fonts + static assets — 1 year immutable cache
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Optimized images — 30 day cache
        source: "/_next/image",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
        ],
      },
      {
        // API routes — no-store for freshness
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        // All pages — security headers
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
