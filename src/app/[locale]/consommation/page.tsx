import type { Metadata, Viewport } from 'next'
import AirConsumption from '@/components/AirConsumption'
import DisclaimerModal from '@/components/DisclaimerModal'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, BASE_URL, getAlternates } from '@/i18n/config'

/* viewport-fit=cover : la barre d'onglets mobile de l'outil utilise
   env(safe-area-inset-bottom) pour éviter la barre d'accueil iOS. */
export const viewport: Viewport = {
  viewportFit: 'cover',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    title: dict.metadata.consumption.title,
    description: dict.metadata.consumption.description,
    keywords: dict.metadata.consumption.keywords,
    alternates: getAlternates('/consommation'),
    openGraph: {
      title: dict.metadata.consumption.ogTitle,
      description: dict.metadata.consumption.ogDescription,
      url: `${BASE_URL}/${locale}/consommation`,
      images: [
        {
          url: '/og-consommation.png',
          width: 1200,
          height: 630,
          alt: `${dict.metadata.consumption.ogTitle} — Orque Tools`,
        },
      ],
    },
  }
}

/** Remplace {converter} par un lien vers le convertisseur pression/profondeur (maillage interne). */
function withConverterLink(text: string, locale: string, label: string) {
  const [before, after] = text.split('{converter}')
  if (after === undefined) return text
  return (
    <>
      {before}
      <a href={`/${locale}/convertisseur`} className="text-primary underline-offset-2 hover:underline">
        {label}
      </a>
      {after}
    </>
  )
}

export default async function ConsommationPage({
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
      name: dict.consumption.jsonLd.appName,
      description: dict.consumption.jsonLd.appDescription,
      url: `${BASE_URL}/${locale}/consommation`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      inLanguage: locale,
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
          name: dict.consumption.jsonLd.breadcrumbHome,
          item: `${BASE_URL}/${locale}`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: dict.consumption.jsonLd.appName,
          item: `${BASE_URL}/${locale}/consommation`,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: dict.consumption.faq.items.map((item) => ({
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
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-14">
        {/* ── Breadcrumb + header ──────────────────────────────────── */}
        <div className="mb-5 md:mb-10">
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-400 md:mb-3">
            <a href={`/${locale}`} className="transition-colors hover:text-primary">
              {dict.consumption.breadcrumbHome}
            </a>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700">{dict.consumption.breadcrumbCurrent}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-base font-semibold text-primary md:h-11 md:w-11">
              💨
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-black md:text-4xl">
              {dict.consumption.title}
            </h1>
          </div>
          <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500 md:mt-3 md:text-base">
            {dict.consumption.subtitle}
          </p>
        </div>

        {/* ── Outil ──────────────────────────────────────────────── */}
        <AirConsumption labels={dict.consumption} />

        {/* ── Partie pédagogique, repliée derrière un bouton ───────────
            Le contenu reste dans le HTML (indexé, et visible pour la FAQPage) mais n'alourdit pas la page. */}
        <details className="group mt-12 border-t border-gray-200 pt-8">
          <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-black shadow-soft transition-all duration-200 ease-out-expo marker:hidden hover:border-primary hover:text-primary [&::-webkit-details-marker]:hidden">
            {dict.consumption.learnMore}
            <span aria-hidden className="transition-transform duration-200 group-open:rotate-180">⌄</span>
          </summary>

          <div className="mt-10 space-y-10 animate-fade-in">
            {/* Note de calcul de l'outil (formules, limites) */}
            <p className="rounded-xl bg-gray-50 px-4 py-3 text-xs font-medium leading-relaxed text-gray-600">
              {dict.consumption.footnote}
            </p>

            {dict.consumption.seo.map((section) => (
              <section key={section.title}>
                <h2 className="mb-3 text-lg font-semibold text-black">
                  {section.title}
                </h2>
                <p className="text-sm font-medium leading-relaxed text-gray-600">
                  {withConverterLink(section.content, locale, dict.consumption.seoConverterLink)}
                </p>
              </section>
            ))}

            {/* FAQ : même contenu que le JSON-LD FAQPage */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-black">
                {dict.consumption.faq.title}
              </h2>
              <div className="space-y-2">
                {dict.consumption.faq.items.map((item) => (
                  <details
                    key={item.q}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3"
                  >
                    <summary className="cursor-pointer list-none text-sm font-semibold text-black marker:hidden [&::-webkit-details-marker]:hidden">
                      {item.q}
                    </summary>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-gray-600">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>
        </details>
      </div>
    </>
  )
}
