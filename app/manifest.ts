import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stundenfassen",
    short_name: "Stundenfassen",
    description: "Zeiterfassung für Studentenjobs",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#111111",
    theme_color: "#111111",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
