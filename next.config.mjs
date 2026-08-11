/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  serverExternalPackages: ['pg'],
};

export default nextConfig;
