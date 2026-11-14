import type { Metadata } from 'next'
import WeightCalculator from '@/components/WeightCalculator'
import ToolPage from '@/components/ToolPage'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, getAlternates, socialMeta } from '@/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const m = dict.metadata.lestage
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: getAlternates('/lestage', locale),
    ...socialMeta(locale, '/lestage', { title: m.ogTitle, description: m.ogDescription, image: '/og-lestage.png' }),
  }
}

export default async function LestagePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const t = dict.lestage
  return (
    <ToolPage t={t} dict={dict} locale={locale} slug="lestage" icon="⚖">
      <WeightCalculator labels={t} />
    </ToolPage>
  )
}
