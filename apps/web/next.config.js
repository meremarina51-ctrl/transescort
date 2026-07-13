/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (process.env.NEXT_PUBLIC_API_URL?.trim()) {
      return [];
    }
    const upstream = (process.env.API_PROXY_UPSTREAM || 'http://127.0.0.1:3010').replace(/\/$/, '');
    return [{ source: '/api/:path*', destination: `${upstream}/:path*` }];
  },
};

module.exports = nextConfig;
