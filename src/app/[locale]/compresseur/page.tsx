import type { Metadata } from 'next'
import CompressorCalculator from '@/components/CompressorCalculator'
import ToolPage from '@/components/ToolPage'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, getAlternates, socialMeta } from '@/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const m = dict.metadata.compresseur
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: getAlternates('/compresseur', locale),
    ...socialMeta(locale, '/compresseur', { title: m.ogTitle, description: m.ogDescription, image: '/og-compresseur.png' }),
  }
}

export default async function CompresseurPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const t = dict.compresseur
  return (
    <ToolPage t={t} dict={dict} locale={locale} slug="compresseur" icon="⚙️">
      <CompressorCalculator labels={t} />
    </ToolPage>
  )
}
