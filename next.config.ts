// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allow production builds to complete even if type errors exist
    ignoreBuildErrors: true,
  },
  // Correct top-level property for Cross-Origin Development Hosts
  allowedDevOrigins: ["192.168.56.1", "localhost:3000"],
  images: {
    // Disables server-side image processing optimization in dev
    unoptimized: true,
  },
};

export default nextConfig;
