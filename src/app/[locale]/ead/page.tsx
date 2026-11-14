import type { Metadata } from 'next'
import EadCalculator from '@/components/EadCalculator'
import ToolPage from '@/components/ToolPage'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, getAlternates, socialMeta } from '@/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const m = dict.metadata.ead
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: getAlternates('/ead', locale),
    ...socialMeta(locale, '/ead', { title: m.ogTitle, description: m.ogDescription, image: '/og-ead.png' }),
  }
}

export default async function EadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const t = dict.ead
  return (
    <ToolPage t={t} dict={dict} locale={locale} slug="ead" icon="≈">
      <EadCalculator labels={t} />
    </ToolPage>
  )
}
