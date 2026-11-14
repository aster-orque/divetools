import type { Metadata } from 'next'
import OtuCalculator from '@/components/OtuCalculator'
import ToolPage from '@/components/ToolPage'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, getAlternates, socialMeta } from '@/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const m = dict.metadata.otu
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: getAlternates('/otu', locale),
    ...socialMeta(locale, '/otu', { title: m.ogTitle, description: m.ogDescription, image: '/og-otu.png' }),
  }
}

export default async function OtuPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const t = dict.otu
  return (
    <ToolPage t={t} dict={dict} locale={locale} slug="otu" icon="🫁">
      <OtuCalculator labels={t} locale={locale} />
    </ToolPage>
  )
}
