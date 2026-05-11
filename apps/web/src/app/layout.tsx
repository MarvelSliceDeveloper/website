import type { Metadata, Viewport } from "next";
import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";

// ─── Fonts ────────────────────────────────────────────────────────────────────
// Sora: distinctive geometric display face for headings & UI chrome
const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

// DM Sans: humanist sans with great readability at body sizes
const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

// ─── Viewport (separate export — Next.js 14+) ─────────────────────────────────
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f12" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,       // allow pinch-zoom for accessibility
};

// ─── Metadata ─────────────────────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://lms.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "LMS Portal — Learn, Teach, Grow",
    template: "%s · LMS Portal",          // child pages get "Page · LMS Portal"
  },
  description:
    "A modern learning management system with live sessions, a course marketplace, and Microsoft Teams integration.",

  // ── Open Graph ──────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    siteName: "LMS Portal",
    title: "LMS Portal — Learn, Teach, Grow",
    description:
      "Live sessions, course marketplace, and Microsoft Teams integration — all in one place.",
    url: BASE_URL,
    images: [
      {
        url: "/og-image.png",   // 1200 × 630 recommended
        width: 1200,
        height: 630,
        alt: "LMS Portal preview",
      },
    ],
    locale: "en_US",
  },

  // ── Twitter / X Card ────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "LMS Portal — Learn, Teach, Grow",
    description:
      "Live sessions, course marketplace, and Microsoft Teams integration — all in one place.",
    images: ["/og-image.png"],
  },

  // ── Icons ────────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },

  // ── Misc ─────────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/site.webmanifest",
};

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      // font variables available as CSS custom properties everywhere
      className={`${sora.variable} ${dmSans.variable} h-full antialiased`}
      // prevents a hydration mismatch when browser extensions modify the DOM
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {/*
          Wrap with a <Providers> component when you need:
            - React Query / SWR
            - Auth context (next-auth SessionProvider)
            - Theme context
            - Toast / notification providers
        */}
        {children}
      </body>
    </html>
  );
}
