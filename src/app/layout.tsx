import type { Metadata, Viewport } from 'next'
import './globals.css'

const APP_URL = 'https://roastem.app'

export const metadata: Metadata = {
  title: {
    default: "ROAST'em — Roast or Be Roasted",
    template: "%s | ROAST'em",
  },
  description: "The anonymous roasting arena where Aura is everything. Roast. Earn. Dominate. 18+ only.",
  keywords: ['roast', 'roasting', 'social media', 'aura points', 'anonymous', 'genz', 'entertainment'],
  authors: [{ name: "ROAST'em" }],
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "ROAST'em — Roast or Be Roasted",
    description: "Anonymous. Brutal. Real. Earn Aura by roasting. Lose it by getting roasted. 18+ only.",
    url: APP_URL,
    siteName: "ROAST'em",
    images: [{ url: '/og-image.jpg', width: 1024, height: 1024, alt: "ROAST'em" }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: "ROAST'em",
    description: "Anonymous roasting arena. Earn Aura. Destroy egos.",
    images: ['/og-image.jpg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "ROAST'em",
  },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#FF3CAC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="noise-overlay">
        {children}
      </body>
    </html>
  )
}
