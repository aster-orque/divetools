import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, LOCALES, BASE_URL, getAlternates } from '@/i18n/config'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import '../globals.css'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: dict.metadata.home.title,
      template: '%s | Orque Tools',
    },
    description: dict.metadata.home.description,
    keywords: ['plongée', 'nitrox', 'calculateur plongée', 'outils plongeur', 'MOD nitrox'],
    authors: [{ name: 'Orque', url: 'https://orque.co' }],
    creator: 'Orque',
    openGraph: {
      type: 'website',
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      url: `${BASE_URL}/${locale}`,
      siteName: 'Orque Tools',
      title: dict.metadata.home.ogTitle,
      description: dict.metadata.home.ogDescription,
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Orque Tools' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.metadata.home.ogTitle,
      description: dict.metadata.home.ogDescription,
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
    alternates: getAlternates(),
  }
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <html lang={locale}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="dns-prefetch" href="https://www.asterdive.com" />
        <link rel="dns-prefetch" href="https://blog.orque.co" />
        <link rel="dns-prefetch" href="https://imagedelivery.net" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-black">
        <Navbar locale={locale} labels={dict.nav} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} labels={dict.footer} />
      </body>
    </html>
  )
}
