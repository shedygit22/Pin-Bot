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
  serverExternalPackages: ["sharp", "bullmq", "ioredis"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
