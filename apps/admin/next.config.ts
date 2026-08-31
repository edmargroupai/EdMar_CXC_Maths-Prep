import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@edmar/assessment-core", "@edmar/types"],
};

export default nextConfig;
