import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // keep the dev badge away from the header controls (it intercepts taps on the language button)
  devIndicators: { position: "bottom-left" },
};

export default nextConfig;
