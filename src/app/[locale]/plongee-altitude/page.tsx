import type { Metadata } from 'next'
import AltitudeCalculator from '@/components/AltitudeCalculator'
import ToolPage from '@/components/ToolPage'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, getAlternates, socialMeta } from '@/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const m = dict.metadata.altitude
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: getAlternates('/plongee-altitude', locale),
    ...socialMeta(locale, '/plongee-altitude', { title: m.ogTitle, description: m.ogDescription, image: '/og-plongee-altitude.png' }),
  }
}

export default async function AltitudePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const t = dict.altitude
  return (
    <ToolPage t={t} dict={dict} locale={locale} slug="plongee-altitude" icon="⛰">
      <AltitudeCalculator labels={t} />
    </ToolPage>
  )
}
