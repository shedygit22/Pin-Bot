import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.pollinations.ai" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "api-inference.huggingface.co" },
    ],
  },
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  serverExternalPackages: ["sharp", "bullmq", "ioredis"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
