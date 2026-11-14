import type { Metadata } from 'next'
import PpO2Calculator from '@/components/PpO2Calculator'
import ToolPage from '@/components/ToolPage'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, getAlternates, socialMeta } from '@/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const m = dict.metadata.ppo2
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: getAlternates('/ppo2', locale),
    ...socialMeta(locale, '/ppo2', { title: m.ogTitle, description: m.ogDescription, image: '/og-ppo2.png' }),
  }
}

export default async function PpO2Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const t = dict.ppo2
  return (
    <ToolPage t={t} dict={dict} locale={locale} slug="ppo2" icon="O₂">
      <PpO2Calculator labels={t} />
    </ToolPage>
  )
}
