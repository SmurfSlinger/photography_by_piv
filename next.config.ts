import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "ubuntu-main",
    "fedora-desktop",
    "fedora-desktop.tail2ad18e.ts.net",
    "100.107.223.105",
  ],
  experimental: {
    proxyClientMaxBodySize: "50mb",
  },
};

export default nextConfig;
