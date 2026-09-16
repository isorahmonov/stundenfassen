import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AuthGate } from "./components/AuthGate"
import { ServiceWorkerRegistrar } from "./components/ServiceWorkerRegistrar"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Stundenfassen",
  description: "Zeiterfassung für Studentenjobs",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Stundenfassen",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // Safe-Area auf iPhone X+
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistrar />
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  )
}
