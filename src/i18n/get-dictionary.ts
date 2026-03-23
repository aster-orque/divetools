import type { Locale } from './config'

const dictionaries = {
  fr: () => import('./dictionaries/fr').then((m) => m.default),
  en: () => import('./dictionaries/en').then((m) => m.default),
}

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]()
}
