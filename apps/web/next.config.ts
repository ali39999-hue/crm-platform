import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@crm/domain', '@crm/contracts', '@crm/design-tokens'],
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
