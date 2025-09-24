import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/widget',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://framer.com https://*.framer.com https://*.framer.website https://www.queenie.works https://queenie.works;"
          }
        ],
      },
      {
        source: '/widget/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://framer.com https://*.framer.com https://*.framer.website https://www.queenie.works https://queenie.works;"
          }
        ],
      },
    ];
  },
};

export default nextConfig;
