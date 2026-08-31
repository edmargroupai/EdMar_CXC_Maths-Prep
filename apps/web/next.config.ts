import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@edmar/design", "@edmar/answer-core", "@edmar/types"],
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
