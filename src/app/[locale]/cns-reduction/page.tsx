import type { Metadata } from 'next'
import CnsReductionCalculator from '@/components/CnsReductionCalculator'
import ToolPage from '@/components/ToolPage'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, getAlternates, socialMeta } from '@/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const m = dict.metadata.cnsReduction
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: getAlternates('/cns-reduction', locale),
    ...socialMeta(locale, '/cns-reduction', { title: m.ogTitle, description: m.ogDescription, image: '/og-cns-reduction.png' }),
  }
}

export default async function CnsReductionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const t = dict.cnsReduction
  return (
    <ToolPage t={t} dict={dict} locale={locale} slug="cns-reduction" icon="½">
      <CnsReductionCalculator labels={t} locale={locale} />
    </ToolPage>
  )
}
