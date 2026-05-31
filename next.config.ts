import type { NextConfig } from "next";

module.exports = {
  images: {
    domains: ['drive.google.com', 'images.unsplash.com'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;