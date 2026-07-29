const { existsSync } = require('fs');
const { resolve } = require('path');
const dotenv = require('dotenv');

// Next.js only loads .env files from this app's own directory — walk up to the
// monorepo root .env (shared with the API) so NEXT_PUBLIC_API_URL etc. resolve here too.
for (let depth = 0; depth < 8; depth++) {
  const base = depth === 0 ? process.cwd() : resolve(process.cwd(), ...Array(depth).fill('..'));
  const envPath = resolve(base, '.env');
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

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
