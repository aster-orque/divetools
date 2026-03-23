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

export function getAlternates(path: string = '') {
  return {
    canonical: `${BASE_URL}/fr${path}`,
    languages: {
      fr: `${BASE_URL}/fr${path}`,
      en: `${BASE_URL}/en${path}`,
      'x-default': `${BASE_URL}/fr${path}`,
    },
  }
}
