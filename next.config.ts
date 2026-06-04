import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['drive.google.com', 'images.unsplash.com', 'fonts.gstatic.com'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;