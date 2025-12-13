import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yzhlfxyfv2essy5i.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
