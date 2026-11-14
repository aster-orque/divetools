import type { ReactNode } from 'react'
import DisclaimerModal from '@/components/DisclaimerModal'
import { BASE_URL } from '@/i18n/config'
import type fr from '@/i18n/dictionaries/fr'

type Dict = typeof fr

/** Textes de page communs aux outils (fil d'Ariane, titre, contenu « Comprendre… », FAQ, JSON-LD). */
export type ToolPageText = {
  breadcrumbHome: string
  breadcrumbCurrent: string
  title: string
  subtitle: string
  learnMore: string
  seo: readonly { title: string; content: string }[]
  faq: { title: string; items: readonly { q: string; a: string }[] }
  jsonLd: { appName: string; appDescription: string; breadcrumbHome: string }
}

const LINK_SLUGS: Record<string, string> = {
  nitrox: 'nitrox',
  mod: 'mod',
  ppo2: 'ppo2',
  ead: 'ead',
  bestmix: 'best-mix',
  lestage: 'lestage',
  cns: 'cns',
  cnsint: 'cns-intervalle',
  cnsred: 'cns-reduction',
  otu: 'otu',
  altitude: 'plongee-altitude',
  etiquette: 'etiquette-nitrox',
  blender: 'gas-blender',
  conso: 'consommation',
  convertisseur: 'convertisseur',
}

/** Remplace {mod}, {ppo2}, {ead}… par des liens vers les autres outils (maillage interne). */
export function withToolLinks(text: string, locale: string, names: Dict['toolLinks']) {
  const keys = Object.keys(LINK_SLUGS).join('|')
  return text.split(new RegExp(`(\\{(?:${keys})\\})`)).map((part, i) => {
    const k = part.slice(1, -1) as keyof typeof names
    if (part.startsWith('{') && k in LINK_SLUGS) {
      return (
        <a key={i} href={`/${locale}/${LINK_SLUGS[k]}`} className="text-primary underline-offset-2 hover:underline">
          {names[k]}
        </a>
      )
    }
    return part
  })
}

export default function ToolPage({ t, dict, locale, slug, icon, children, width = 'max-w-6xl' }: {
  t: ToolPageText; dict: Dict; locale: string; slug: string; icon: string; children: ReactNode; width?: string
}) {
  const url = `${BASE_URL}/${locale}/${slug}`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: t.jsonLd.appName,
      description: t.jsonLd.appDescription,
      url,
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
        { '@type': 'ListItem', position: 2, name: t.jsonLd.appName, item: url },
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
      <div className={`mx-auto ${width} px-4 py-6 md:px-6 md:py-14`}>
        <div className="mb-5 md:mb-10">
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-400 md:mb-3">
            <a href={`/${locale}`} className="transition-colors hover:text-primary">{t.breadcrumbHome}</a>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700">{t.breadcrumbCurrent}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-base font-semibold text-primary md:h-11 md:w-11">
              {icon}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-black md:text-4xl">{t.title}</h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-gray-500 md:mt-3 md:text-base">{t.subtitle}</p>
        </div>

        {children}

        <details className="group mx-auto mt-12 max-w-3xl border-t border-gray-200 pt-8">
          <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-black shadow-soft transition-all duration-200 ease-out-expo marker:hidden hover:border-primary hover:text-primary [&::-webkit-details-marker]:hidden">
            {t.learnMore}
            <span aria-hidden className="transition-transform duration-200 group-open:rotate-180">⌄</span>
          </summary>
          <div className="mt-10 animate-fade-in space-y-10">
            {t.seo.map((section) => (
              <section key={section.title}>
                <h2 className="mb-3 text-lg font-semibold text-black">{section.title}</h2>
                <p className="text-sm font-medium leading-relaxed text-gray-600">{withToolLinks(section.content, locale, dict.toolLinks)}</p>
              </section>
            ))}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-black">{t.faq.title}</h2>
              <div className="space-y-2">
                {t.faq.items.map((item) => (
                  <details key={item.q} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-black marker:hidden [&::-webkit-details-marker]:hidden">{item.q}</summary>
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
