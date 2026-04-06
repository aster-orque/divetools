import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, BASE_URL, getAlternates } from '@/i18n/config'

const TOOL_ICONS: Record<string, string> = {
  '/nitrox': '/Nx.png',
}

const TOOL_SLUGS = ['/nitrox', '/convertisseur', '/decompression', '/flottabilite', '/volumes', '/devis']
const TOOL_STATUSES: ('live' | 'soon')[] = ['live', 'live', 'soon', 'soon', 'soon', 'soon']
const TOOL_ICON_CHARS = ['N\u2082', '\u21c4', '\u23F1', '\u2696', '\uD83E\uDEE7', '\uD83D\uDCCB']

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    title: dict.metadata.home.title,
    description: dict.metadata.home.description,
    alternates: getAlternates(),
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  const TOOLS = dict.home.tools.map((tool, i) => ({
    slug: `/${locale}${TOOL_SLUGS[i]}`,
    status: TOOL_STATUSES[i],
    icon: TOOL_ICON_CHARS[i],
    tag: tool.tag,
    title: tool.title,
    description: tool.description,
    keywords: tool.keywords,
  }))

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Orque Tools',
      url: `${BASE_URL}/${locale}`,
      description: dict.metadata.home.ogDescription,
      inLanguage: locale,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Orque',
      url: 'https://orque.co',
      logo: `${BASE_URL}/logo-icon-orque-black.jpeg`,
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm text-gray-500">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              {dict.home.badge}
            </div>
            <h1 className="animate-slide-up text-4xl font-extrabold tracking-tight text-black md:text-5xl">
              {dict.home.heroTitle}
            </h1>
            <p className="mt-4 animate-slide-up-1 text-lg leading-relaxed text-gray-500">
              {dict.home.heroSubtitle}
            </p>
            <Link
              href={`/${locale}/nitrox`}
              className="mt-8 inline-flex animate-slide-up-2 items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(18,132,199,0.3)] transition-all duration-200 ease-out-expo hover:bg-primary-600 hover:shadow-[0_4px_20px_rgba(18,132,199,0.35)] active:scale-95"
            >
              {dict.home.heroCta}
            </Link>
          </div>
        </section>

        {/* ── Tool grid ───────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black">{dict.home.allTools}</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400">
              {TOOLS.filter((t) => t.status === 'live').length} {dict.home.available}
              {TOOLS.filter((t) => t.status === 'soon').length > 0 &&
                ` \u00b7 ${TOOLS.filter((t) => t.status === 'soon').length} ${dict.home.coming}`}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {TOOLS.map((tool, i) => (
              <ToolCard key={tool.slug} tool={tool} index={i} labels={dict.home} />
            ))}
          </div>
        </section>

        {/* ── CTA Aster ───────────────────────────────────────────── */}
        <section className="border-t border-gray-200 bg-gray-50 px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
              {dict.home.asterSubtitle}
            </p>
            <Image
              src="/logo_black.png"
              alt="Aster by Orque"
              width={140}
              height={56}
              className="mx-auto mt-4"
            />
            <p className="mt-3 text-gray-500">
              {dict.home.asterDescription}
            </p>
            <a
              href="https://www.asterdive.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-soft transition-all duration-200 ease-out-expo hover:border-primary hover:text-primary hover:shadow-lifted active:scale-95"
            >
              {dict.home.asterCta}
            </a>
          </div>
        </section>
      </div>
    </>
  )
}

/* ── Tool card ─────────────────────────────────────────────────────── */
const staggerClass = [
  'animate-slide-up-1',
  'animate-slide-up-2',
  'animate-slide-up-3',
  'animate-slide-up-4',
  'animate-slide-up-4',
  'animate-slide-up-4',
]

type ToolType = {
  slug: string
  status: 'live' | 'soon'
  icon: string
  tag: string
  title: string
  description: string
  keywords: string[]
}

function ToolCard({
  tool,
  index = 0,
  labels,
}: {
  tool: ToolType
  index?: number
  labels: { openTool: string; soon: string }
}) {
  const isLive = tool.status === 'live'

  const inner = (
    <div
      className={`group relative flex h-full flex-col rounded-2xl border bg-white p-6 transition-lift ${staggerClass[index] || ''} ${
        isLive
          ? 'cursor-pointer border-gray-200 shadow-soft hover-lift hover:shadow-float hover:border-gray-300'
          : 'cursor-default border-gray-100 opacity-50'
      }`}
    >
      {/* Icon + badge */}
      <div className="mb-4 flex items-start justify-between">
        {TOOL_ICONS[tool.slug.replace(/^\/[a-z]{2}/, '')] ? (
          <Image
            src={TOOL_ICONS[tool.slug.replace(/^\/[a-z]{2}/, '')]!}
            alt={tool.title}
            width={44}
            height={44}
            className="rounded-xl"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 font-mono text-base font-semibold text-primary">
            {tool.icon}
          </div>
        )}
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isLive
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {isLive ? tool.tag : labels.soon}
        </span>
      </div>

      {/* Title + description */}
      <h3
        className={`text-base font-semibold transition-colors ${
          isLive ? 'text-black group-hover:text-primary' : 'text-gray-400'
        }`}
      >
        {tool.title}
      </h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-gray-500">
        {tool.description}
      </p>

      {/* Keywords */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {tool.keywords.map((kw) => (
          <span
            key={kw}
            className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs text-gray-400"
          >
            {kw}
          </span>
        ))}
      </div>

      {/* Hover label */}
      {isLive && (
        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-all duration-200 ease-out-expo translate-y-1 group-hover:opacity-100 group-hover:translate-y-0">
          {labels.openTool}
        </div>
      )}
    </div>
  )

  if (!isLive) return <div>{inner}</div>
  return <Link href={tool.slug}>{inner}</Link>
}
