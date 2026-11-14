import type { Metadata } from 'next'
import ThermalBalanceCalculator from '@/components/ThermalBalanceCalculator'
import ToolPage from '@/components/ToolPage'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, getAlternates, socialMeta } from '@/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const m = dict.metadata.thermique
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: getAlternates('/bilan-thermique', locale),
    ...socialMeta(locale, '/bilan-thermique', { title: m.ogTitle, description: m.ogDescription, image: '/og-bilan-thermique.png' }),
  }
}

export default async function BilanThermiquePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const t = dict.thermique
  return (
    <ToolPage t={t} dict={dict} locale={locale} slug="bilan-thermique" icon="🌡️">
      <ThermalBalanceCalculator labels={t} />
    </ToolPage>
  )
}
