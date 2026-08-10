import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs'],
  turbopack: {
    resolveAlias: {
      bcryptjs: 'bcryptjs/index.js',
    },
  },
};

export default nextConfig;
