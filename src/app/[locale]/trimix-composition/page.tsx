import type { Metadata } from 'next'
import TrimixCompositionCalculator from '@/components/TrimixCompositionCalculator'
import ToolPage from '@/components/ToolPage'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, getAlternates, socialMeta } from '@/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const m = dict.metadata.trimix
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: getAlternates('/trimix-composition', locale),
    ...socialMeta(locale, '/trimix-composition', { title: m.ogTitle, description: m.ogDescription, image: '/og-trimix-composition.png' }),
  }
}

export default async function TrimixCompositionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const t = dict.trimix
  return (
    <ToolPage t={t} dict={dict} locale={locale} slug="trimix-composition" icon="Tx">
      <TrimixCompositionCalculator labels={t} />
    </ToolPage>
  )
}
