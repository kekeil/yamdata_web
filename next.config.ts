import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  
  // Configuration Turbopack (stable)
  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname),
    },
  },
  
  // Configuration Webpack (uniquement pour les builds de production)
  webpack: (config, { dev }) => {
    // Ne configurer Webpack que pour les builds de production
    if (!dev) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@': path.resolve(__dirname),
      };
    }
    return config;
  },
};

console.log("🔧 Next.js a chargé next.config.ts");
export default nextConfig;
