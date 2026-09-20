import type { NextConfig } from "next";

const backendHost = process.env.BACKEND_HOST || "backend";
const backendPort = process.env.BACKEND_PORT || "8000";
const defaultBackendUrl = `http://${backendHost}:${backendPort}`;
const targetBackend = (process.env.BACKEND_URL || defaultBackendUrl).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${targetBackend}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${targetBackend}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
