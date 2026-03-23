import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  metadataBase: new URL('https://tools.orque.co'),
  title: {
    default: 'Orque Tools — Calculateurs gratuits pour plongeurs',
    template: '%s | Orque Tools',
  },
  description:
    'Calculateurs gratuits pour plongeurs sous-marins : Nitrox, décompression, flottabilité et plus. Précis, rapides, utilisables sur mobile.',
  keywords: ['plongée', 'nitrox', 'calculateur plongée', 'outils plongeur', 'MOD nitrox'],
  authors: [{ name: 'Orque', url: 'https://orque.co' }],
  creator: 'Orque',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://tools.orque.co',
    siteName: 'Orque Tools',
    title: 'Orque Tools — Calculateurs gratuits pour plongeurs',
    description:
      'Calculateurs gratuits pour plongeurs sous-marins : Nitrox, décompression, flottabilité et plus.',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Orque Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orque Tools — Calculateurs gratuits',
    description: 'Calculateurs gratuits pour plongeurs sous-marins.',
    images: ['/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-black">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
