import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page is precomputed from a fixed bracket, so the whole site is static.
  // `output: "export"` emits a portable `out/` (deploy to Vercel or any static host).
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
