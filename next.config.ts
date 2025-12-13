import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "", //my cdn url
      },
    ],
  },
};

export default nextConfig;
