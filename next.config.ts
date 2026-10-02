import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin/analytics',
        permanent: false,
      },
    ]
  },
  serverExternalPackages: ['bcryptjs'],
  turbopack: {
    resolveAlias: {
      bcryptjs: 'bcryptjs/index.js',
    },
  },
};

export default nextConfig;
