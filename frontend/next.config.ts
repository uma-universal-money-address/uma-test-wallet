import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: "dist",
  output: "export",
  eslint: {
    /* Lint is run during `yarn checks` - skip for build: */
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
