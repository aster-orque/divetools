import type { Metadata } from 'next'
import EndCalculator from '@/components/EndCalculator'
import ToolPage from '@/components/ToolPage'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, getAlternates, socialMeta } from '@/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const m = dict.metadata.end
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: getAlternates('/end', locale),
    ...socialMeta(locale, '/end', { title: m.ogTitle, description: m.ogDescription, image: '/og-end.png' }),
  }
}

export default async function EndPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const t = dict.end
  return (
    <ToolPage t={t} dict={dict} locale={locale} slug="end" icon="He">
      <EndCalculator labels={t} />
    </ToolPage>
  )
}
