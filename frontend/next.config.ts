import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: "dist",
  output: "export",
  eslint: {
    /* Lint is run during `yarn checks` - skip for build: */
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: false,
  },
  trailingSlash: true,
  env: {
    BACKEND_DOMAIN: process.env.BACKEND_DOMAIN || "",
  },
};

export default nextConfig;
