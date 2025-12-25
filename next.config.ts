import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yzhlfxyfv2essy5i.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "o42adyjkazl35sk2.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
