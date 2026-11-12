import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Lets start-all.ps1 build a second copy beside a running dev/prod server without touching .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Hides the floating Next.js dev indicator (the "N" badge with the Issues panel).
  devIndicators: false,
};

export default nextConfig;
