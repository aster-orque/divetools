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
