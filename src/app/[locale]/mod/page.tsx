import type { Metadata } from 'next'
import ModCalculator from '@/components/ModCalculator'
import ToolPage from '@/components/ToolPage'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, getAlternates, socialMeta } from '@/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const m = dict.metadata.mod
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: getAlternates('/mod', locale),
    ...socialMeta(locale, '/mod', { title: m.ogTitle, description: m.ogDescription, image: '/og-mod.png' }),
  }
}

export default async function ModPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const t = dict.mod
  return (
    <ToolPage t={t} dict={dict} locale={locale} slug="mod" icon="↧">
      <ModCalculator labels={t} />
    </ToolPage>
  )
}
