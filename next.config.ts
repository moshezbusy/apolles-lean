import "./src/env";

import type { NextConfig } from "next";

const DEFAULT_ALLOWED_IMAGE_HOSTS = ["images.trvl-media.com"];

function getAllowedImageHosts(): string[] {
  const configuredHosts = process.env.NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS;

  if (!configuredHosts) {
    return DEFAULT_ALLOWED_IMAGE_HOSTS;
  }

  const hosts = configuredHosts
    .split(",")
    .map((host) => host.trim())
    .filter((host) => host.length > 0);

  return hosts.length > 0 ? hosts : DEFAULT_ALLOWED_IMAGE_HOSTS;
}

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: getAllowedImageHosts().map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
};

export default config;
