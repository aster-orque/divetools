import type { Metadata } from 'next'
import CurrentsCalculator from '@/components/CurrentsCalculator'
import ToolPage from '@/components/ToolPage'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, getAlternates, socialMeta } from '@/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const m = dict.metadata.courants
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: getAlternates('/courants', locale),
    ...socialMeta(locale, '/courants', { title: m.ogTitle, description: m.ogDescription, image: '/og-courants.png' }),
  }
}

export default async function CourantsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const t = dict.courants
  return (
    <ToolPage t={t} dict={dict} locale={locale} slug="courants" icon="🌊">
      <CurrentsCalculator labels={t} />
    </ToolPage>
  )
}
