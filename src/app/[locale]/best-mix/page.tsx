import type { Metadata } from 'next'
import BestMixCalculator from '@/components/BestMixCalculator'
import ToolPage from '@/components/ToolPage'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, getAlternates, socialMeta } from '@/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const m = dict.metadata.bestMix
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: getAlternates('/best-mix', locale),
    ...socialMeta(locale, '/best-mix', { title: m.ogTitle, description: m.ogDescription, image: '/og-best-mix.png' }),
  }
}

export default async function BestMixPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const t = dict.bestMix
  return (
    <ToolPage t={t} dict={dict} locale={locale} slug="best-mix" icon="%">
      <BestMixCalculator labels={t} />
    </ToolPage>
  )
}
