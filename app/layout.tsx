import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AuthGate } from "./components/AuthGate"
import { ServiceWorkerRegistrar } from "./components/ServiceWorkerRegistrar"
import { ThemeProvider } from "./components/ThemeProvider"
import { APP_NAME, APP_TAGLINE } from "@/lib/brand"

// Reads sf_theme from localStorage before React hydrates to avoid FOUC.
// "system" (null/unknown) resolves to OS preference via matchMedia.
const FOUC_SCRIPT = `(function(){try{var t=localStorage.getItem('sf_theme'),d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-theme',t==='dark'||(t!=='light'&&d)?'dark':'light')}catch(e){}})()`

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      // SVG favicons switch with system color scheme
      { url: "/favicon-light.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.svg",  type: "image/svg+xml", media: "(prefers-color-scheme: dark)"  },
    ],
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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ServiceWorkerRegistrar />
          <AuthGate>{children}</AuthGate>
        </ThemeProvider>
      </body>
    </html>
  )
}
