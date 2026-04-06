import type { Metadata } from 'next'
import Image from 'next/image'
import NitroxCalculator from '@/components/NitroxCalculator'
import DisclaimerModal from '@/components/DisclaimerModal'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, BASE_URL, getAlternates } from '@/i18n/config'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    title: dict.metadata.nitrox.title,
    description: dict.metadata.nitrox.description,
    keywords: dict.metadata.nitrox.keywords,
    alternates: getAlternates('/nitrox'),
    openGraph: {
      title: dict.metadata.nitrox.ogTitle,
      description: dict.metadata.nitrox.ogDescription,
      url: `${BASE_URL}/${locale}/nitrox`,
      images: [
        {
          url: '/og-nitrox.png',
          width: 1200,
          height: 630,
          alt: `${dict.metadata.nitrox.ogTitle} — Orque Tools`,
        },
      ],
    },
  }
}

export default async function NitroxPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: dict.nitrox.jsonLd.appName,
      description: dict.nitrox.jsonLd.appDescription,
      url: `${BASE_URL}/${locale}/nitrox`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
      provider: {
        '@type': 'Organization',
        name: 'Aster',
        url: 'https://www.asterdive.com',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: dict.nitrox.jsonLd.breadcrumbHome,
          item: `${BASE_URL}/${locale}`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: dict.nitrox.jsonLd.appName,
          item: `${BASE_URL}/${locale}/nitrox`,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: dict.nitrox.seo.map((item) => ({
        '@type': 'Question',
        name: item.title,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.content,
        },
      })),
    },
  ]

  const embedToken = process.env.ASTER_EMBED_TOKEN || ''
  const embedUrl = embedToken
    ? `https://aster-app-server.fly.dev/embed/experiences?token=${embedToken}&limit=3&cols=3&nitrox=true`
    : ''

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <DisclaimerModal labels={dict.disclaimer} />
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
        {/* ── Breadcrumb + header ──────────────────────────────────── */}
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-400">
            <a href={`/${locale}`} className="transition-colors hover:text-primary">
              {dict.nitrox.breadcrumbHome}
            </a>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700">{dict.nitrox.breadcrumbCurrent}</span>
          </div>
          <div className="flex items-center gap-3">
            <Image
              src="/Nx.png"
              alt="Nitrox"
              width={44}
              height={44}
              className="rounded-xl"
            />
            <h1 className="text-3xl font-extrabold tracking-tight text-black md:text-4xl">
              {dict.nitrox.title}
            </h1>
          </div>
          <p className="mt-3 text-base leading-relaxed text-gray-500">
            {dict.nitrox.subtitle}
          </p>
        </div>

        {/* ── Calculator ──────────────────────────────────────────── */}
        <NitroxCalculator labels={dict.nitrox} />

        {/* ── SEO content ─────────────────────────────────────────── */}
        <div className="mt-16 space-y-10 border-t border-gray-200 pt-12">
          {dict.nitrox.seo.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-lg font-semibold text-black">
                {section.title}
              </h2>
              <p className="text-sm leading-relaxed text-gray-500">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        {/* ── Nitrox experiences on Aster ──────────────────────────── */}
        {embedUrl && (
          <section className="mt-16 border-t border-gray-200 pt-12">
            <div className="mb-2 flex items-center gap-2">
              <Image
                src="/logo_black.png"
                alt="Aster by Orque"
                width={80}
                height={32}
              />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-black">
              {dict.nitrox.experiences.title}
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              {dict.nitrox.experiences.subtitle}
            </p>

            <iframe
              src={embedUrl}
              width="100%"
              height="400"
              frameBorder="0"
              scrolling="no"
              allowTransparency
              className="border-none overflow-hidden bg-transparent"
            />
          </section>
        )}
      </div>
    </>
  )
}
