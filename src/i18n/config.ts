export const LOCALES = ['fr', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'fr'
export const BASE_URL = 'https://tools.orque.co'

export function isValidLocale(s: string): s is Locale {
  return LOCALES.includes(s as Locale)
}

export function getLocalePath(locale: Locale, path: string = '') {
  return `/${locale}${path}`
}

/** canonical = la page dans sa propre langue (sinon Google n'indexe pas la version EN). */
export function getAlternates(path: string = '', locale: string = DEFAULT_LOCALE) {
  const self = isValidLocale(locale) ? locale : DEFAULT_LOCALE
  return {
    canonical: `${BASE_URL}/${self}${path}`,
    languages: {
      fr: `${BASE_URL}/fr${path}`,
      en: `${BASE_URL}/en${path}`,
      'x-default': `${BASE_URL}/fr${path}`,
    },
  }
}

/**
 * Balises de partage d'une page outil (Open Graph + Twitter/X).
 * À utiliser dans chaque generateMetadata : un `openGraph` ou `twitter` défini dans une page
 * remplace entièrement celui du layout (sinon X affiche le titre et l'image de l'accueil).
 */
export function socialMeta(locale: string, path: string, o: { title: string; description: string; image: string }) {
  const en = locale === 'en'
  return {
    openGraph: {
      type: 'website' as const,
      locale: en ? 'en_US' : 'fr_FR',
      alternateLocale: [en ? 'fr_FR' : 'en_US'],
      siteName: 'Orque Tools',
      url: `${BASE_URL}/${isValidLocale(locale) ? locale : DEFAULT_LOCALE}${path}`,
      title: o.title,
      description: o.description,
      images: [{ url: o.image, width: 1200, height: 630, alt: `${o.title} — Orque Tools` }],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: o.title,
      description: o.description,
      images: [o.image],
    },
  }
}
