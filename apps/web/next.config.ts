import type { NextConfig } from "next";
import path from "node:path";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.resolve(process.cwd(), "../.."),
  },
  allowedDevOrigins: [
    "automaker-speed-unroasted.ngrok-free.dev",
    "10.147.116.33",
    "10.122.223.33",
    "192.168.56.1",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiBaseUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
