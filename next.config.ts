import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin und ical.js dürfen nicht vom Next.js-Bundler verarbeitet werden
  serverExternalPackages: ["firebase-admin", "ical.js"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ]
  },
};

export default nextConfig;
