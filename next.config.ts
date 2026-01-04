import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "o42adyjkazl35sk2.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co", // ← Add this for placeholder images
      },
    ],
  },
};

export default nextConfig;
