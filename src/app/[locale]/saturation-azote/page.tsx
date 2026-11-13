import type { Metadata } from 'next'
import NitrogenSaturation from '@/components/NitrogenSaturation'
import DisclaimerModal from '@/components/DisclaimerModal'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, BASE_URL, getAlternates, socialMeta } from '@/i18n/config'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    title: dict.metadata.saturation.title,
    description: dict.metadata.saturation.description,
    keywords: dict.metadata.saturation.keywords,
    alternates: getAlternates('/saturation-azote', locale),
    ...socialMeta(locale, '/saturation-azote', {
      title: dict.metadata.saturation.ogTitle,
      description: dict.metadata.saturation.ogDescription,
      image: '/og-saturation-azote.png',
    }),
  }
}

/** Remplace {nitrox} et {blender} par des liens vers les autres outils (maillage interne). */
function withToolLinks(text: string, locale: string, links: { nitrox: string; blender: string }) {
  const parts = text.split(/(\{nitrox\}|\{blender\})/)
  return parts.map((part, i) => {
    if (part === '{nitrox}' || part === '{blender}') {
      const isNitrox = part === '{nitrox}'
      return (
        <a key={i} href={`/${locale}/${isNitrox ? 'nitrox' : 'gas-blender'}`} className="text-primary underline-offset-2 hover:underline">
          {isNitrox ? links.nitrox : links.blender}
        </a>
      )
    }
    return part
  })
}

export default async function NitrogenSaturationPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const t = dict.saturation

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: t.jsonLd.appName,
      description: t.jsonLd.appDescription,
      url: `${BASE_URL}/${locale}/saturation-azote`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      inLanguage: locale,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      provider: { '@type': 'Organization', name: 'Aster', url: 'https://www.asterdive.com' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t.jsonLd.breadcrumbHome, item: `${BASE_URL}/${locale}` },
        { '@type': 'ListItem', position: 2, name: t.jsonLd.appName, item: `${BASE_URL}/${locale}/saturation-azote` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: t.faq.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <DisclaimerModal labels={dict.disclaimer} />
      {/* max-w-3xl : une colonne, comme le modèle (graphique pensé d'abord pour le mobile). */}
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-14">
        {/* ── Breadcrumb + header ──────────────────────────────────── */}
        <div className="mb-5 md:mb-10">
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-400 md:mb-3">
            <a href={`/${locale}`} className="transition-colors hover:text-primary">
              {t.breadcrumbHome}
            </a>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700">{t.breadcrumbCurrent}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-base font-semibold text-primary md:h-11 md:w-11">
              N₂
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-black md:text-4xl">{t.title}</h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-gray-500 md:mt-3 md:text-base">
            {t.subtitle}
          </p>
        </div>

        {/* ── Outil ──────────────────────────────────────────────── */}
        <NitrogenSaturation labels={t} locale={locale} />

        {/* ── Partie pédagogique, repliée derrière un bouton ─────────── */}
        <details className="group mx-auto mt-12 max-w-3xl border-t border-gray-200 pt-8">
          <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-black shadow-soft transition-all duration-200 ease-out-expo marker:hidden hover:border-primary hover:text-primary [&::-webkit-details-marker]:hidden">
            {t.learnMore}
            <span aria-hidden className="transition-transform duration-200 group-open:rotate-180">⌄</span>
          </summary>

          <div className="mt-10 space-y-10 animate-fade-in">
            {t.seo.map((section) => (
              <section key={section.title}>
                <h2 className="mb-3 text-lg font-semibold text-black">{section.title}</h2>
                <p className="text-sm font-medium leading-relaxed text-gray-600">
                  {withToolLinks(section.content, locale, { nitrox: t.seoNitroxLink, blender: t.seoGasBlenderLink })}
                </p>
              </section>
            ))}

            {/* Hypothèses et limites du modèle */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-black">{t.hypothesesTitle}</h2>
              <ul className="list-disc space-y-1.5 pl-5 text-sm font-medium leading-relaxed text-gray-600">
                {t.hypotheses.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </section>

            {/* FAQ : même contenu que le JSON-LD FAQPage */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-black">{t.faq.title}</h2>
              <div className="space-y-2">
                {t.faq.items.map((item) => (
                  <details key={item.q} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
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
