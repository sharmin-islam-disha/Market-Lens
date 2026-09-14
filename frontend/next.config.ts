import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.BACKEND_URL 
          ? `${process.env.BACKEND_URL}/api/:path*` 
          : "http://backend:8000/api/:path*", // Default for docker-compose network
      },
      {
        source: "/uploads/:path*",
        destination: process.env.BACKEND_URL 
          ? `${process.env.BACKEND_URL}/uploads/:path*` 
          : "http://backend:8000/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
