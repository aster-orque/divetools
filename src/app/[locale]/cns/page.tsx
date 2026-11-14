import type { Metadata } from 'next'
import CnsCalculator from '@/components/CnsCalculator'
import ToolPage from '@/components/ToolPage'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, getAlternates, socialMeta } from '@/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const m = dict.metadata.cns
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: getAlternates('/cns', locale),
    ...socialMeta(locale, '/cns', { title: m.ogTitle, description: m.ogDescription, image: '/og-cns.png' }),
  }
}

export default async function CNSPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const t = dict.cns
  return (
    <ToolPage t={t} dict={dict} locale={locale} slug="cns" icon="O₂">
      <CnsCalculator labels={t} locale={locale} />
    </ToolPage>
  )
}
