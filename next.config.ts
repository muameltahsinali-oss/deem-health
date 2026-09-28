import type { NextConfig } from "next";

const storageBackendUrl = process.env.RAILWAY_STORAGE_URL || process.env.NEXT_PUBLIC_STORAGE_URL || "";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
    localPatterns: [
      { pathname: "/images/**" },
      { pathname: "/brand/**" },
      { pathname: "/api/uploads/**" },
    ],
  },
  async rewrites() {
    if (storageBackendUrl) {
      const cleanUrl = storageBackendUrl.replace(/\/$/, "");
      return [
        {
          source: "/api/uploads/:path*",
          destination: `${cleanUrl}/api/uploads/:path*`,
        },
        {
          source: "/api/upload",
          destination: `${cleanUrl}/api/upload`,
        },
      ];
    }
    return [];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
