import type { Metadata } from 'next'
import PressureConverter from '@/components/PressureConverter'
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
    title: dict.metadata.convertisseur.title,
    description: dict.metadata.convertisseur.description,
    keywords: dict.metadata.convertisseur.keywords,
    alternates: getAlternates('/convertisseur'),
    openGraph: {
      title: dict.metadata.convertisseur.ogTitle,
      description: dict.metadata.convertisseur.ogDescription,
      url: `${BASE_URL}/${locale}/convertisseur`,
      images: [
        {
          url: '/og-convertisseur.png',
          width: 1200,
          height: 630,
          alt: `${dict.metadata.convertisseur.ogTitle} — Orque Tools`,
        },
      ],
    },
  }
}

export default async function ConvertisseurPage({
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
      name: dict.converter.jsonLd.appName,
      description: dict.converter.jsonLd.appDescription,
      url: `${BASE_URL}/${locale}/convertisseur`,
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
          name: dict.converter.jsonLd.breadcrumbHome,
          item: `${BASE_URL}/${locale}`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: dict.converter.jsonLd.appName,
          item: `${BASE_URL}/${locale}/convertisseur`,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: dict.converter.faq.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    },
  ]

  return (
    <>
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
              {dict.converter.breadcrumbHome}
            </a>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700">{dict.converter.breadcrumbCurrent}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 font-mono text-base font-semibold text-primary">
              ⇄
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-black md:text-4xl">
              {dict.converter.title}
            </h1>
          </div>
          <p className="mt-3 text-base leading-relaxed text-gray-500">
            {dict.converter.subtitle}
          </p>
        </div>

        {/* ── Converter ──────────────────────────────────────────── */}
        <PressureConverter labels={dict.converter} />

        {/* ── SEO content ─────────────────────────────────────────── */}
        <div className="mt-16 space-y-10 border-t border-gray-200 pt-12">
          {dict.converter.seo.map((section) => (
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
      </div>
    </>
  )
}
