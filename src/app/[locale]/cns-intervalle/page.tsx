import type { Metadata } from 'next'
import CnsIntervalCalculator from '@/components/CnsIntervalCalculator'
import ToolPage from '@/components/ToolPage'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, getAlternates, socialMeta } from '@/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const m = dict.metadata.cnsInterval
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: getAlternates('/cns-intervalle', locale),
    ...socialMeta(locale, '/cns-intervalle', { title: m.ogTitle, description: m.ogDescription, image: '/og-cns-intervalle.png' }),
  }
}

export default async function CnsIntervalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const t = dict.cnsInterval
  return (
    <ToolPage t={t} dict={dict} locale={locale} slug="cns-intervalle" icon="⏲">
      <CnsIntervalCalculator labels={t} locale={locale} />
    </ToolPage>
  )
}
