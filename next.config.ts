import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin (und Subpfad-Exporte) sowie ical.js dürfen nicht gebundelt werden.
  // Next.js 16 prüft mit exaktem .includes() — jeder importierte Subpfad muss einzeln stehen.
  serverExternalPackages: [
    "firebase-admin",
    "firebase-admin/app",
    "firebase-admin/auth",
    "firebase-admin/firestore",
    "ical.js",
  ],
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
