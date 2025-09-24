import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors https://www.queenie.works https://queenie.works https://*.framer.app https://*.framer.website https://framer.com;"
          }
        ],
      },
    ];
  },
};

export default nextConfig;
