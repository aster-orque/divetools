import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

const TOOL_ICONS: Record<string, string> = {
  '/nitrox': '/Nx.png',
}

export const metadata: Metadata = {
  title: 'Orque Tools — Calculateurs gratuits pour plongeurs',
  description:
    'Calculateurs gratuits pour plongeurs sous-marins : Nitrox (MOD, EAD, CNS), décompression, flottabilité. Précis, gratuits, sans inscription.',
  alternates: { canonical: 'https://tools.orque.co' },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Orque Tools',
    url: 'https://tools.orque.co',
    description:
      'Calculateurs gratuits pour plongeurs sous-marins : Nitrox, décompression, flottabilité et plus.',
    inLanguage: 'fr',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Orque',
    url: 'https://orque.co',
    logo: 'https://tools.orque.co/logo-icon-orque-black.jpeg',
  },
]

const TOOLS = [
  {
    slug: '/nitrox',
    status: 'live' as const,
    icon: 'N\u2082',
    tag: 'Nitrox',
    title: 'Calculateur Nitrox',
    description:
      "MOD, EAD, meilleur mélange et toxicité CNS. Tout ce qu'il faut pour planifier une plongée enrichie.",
    keywords: ['MOD', 'EAD', 'PPO\u2082', 'CNS', 'EANx'],
  },
  {
    slug: '/decompression',
    status: 'soon' as const,
    icon: '\u23F1',
    tag: 'Décompression',
    title: 'Planner de décompression',
    description: 'Paliers, temps de remontée, profil de plongée optimisé.',
    keywords: ['paliers déco', 'GF', 'Bühlmann'],
  },
  {
    slug: '/flottabilite',
    status: 'soon' as const,
    icon: '\u2696',
    tag: 'Flottabilité',
    title: 'Calculateur de flottabilité',
    description: 'Lestage optimal selon ta combinaison, bouteille et équipement.',
    keywords: ['lest', 'flottabilité', 'combinaison'],
  },
  {
    slug: '/volumes',
    status: 'soon' as const,
    icon: '\uD83E\uDEE7',
    tag: 'Volumes & Pression',
    title: 'Convertisseur volumes & pressions',
    description: 'Bar, PSI, litres, cu.ft — toutes les conversions plongée.',
    keywords: ['bar', 'psi', 'volume bouteille'],
  },
  {
    slug: '/devis',
    status: 'soon' as const,
    icon: '\uD83D\uDCCB',
    tag: 'Devis',
    title: 'Générateur de devis',
    description:
      'Créez et envoyez des devis pros en quelques secondes. Idéal en salon ou en centre pour établir un devis live avec les infos de votre structure.',
    keywords: ['devis', 'salon plongée', 'centre', 'facturation'],
  },
]

export default function HomePage() {
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
              Gratuit &middot; Sans inscription
            </div>
            <h1 className="animate-slide-up text-4xl font-extrabold tracking-tight text-black md:text-5xl">
              Les outils du plongeur
            </h1>
            <p className="mt-4 animate-slide-up-1 text-lg leading-relaxed text-gray-500">
              Calculs Nitrox, planification déco, flottabilité — tout ce dont tu as
              besoin sur le bateau ou en salle de gonflage.
            </p>
            <Link
              href="/nitrox"
              className="mt-8 inline-flex animate-slide-up-2 items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(18,132,199,0.3)] transition-all duration-200 ease-out-expo hover:bg-primary-600 hover:shadow-[0_4px_20px_rgba(18,132,199,0.35)] active:scale-95"
            >
              Essayer le calculateur Nitrox
            </Link>
          </div>
        </section>

        {/* ── Tool grid ───────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black">Tous les outils</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400">
              {TOOLS.filter((t) => t.status === 'live').length} disponible
              {TOOLS.filter((t) => t.status === 'soon').length > 0 &&
                ` · ${TOOLS.filter((t) => t.status === 'soon').length} à venir`}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {TOOLS.map((tool, i) => (
              <ToolCard key={tool.slug} tool={tool} index={i} />
            ))}
          </div>
        </section>

        {/* ── CTA Aster ───────────────────────────────────────────── */}
        <section className="border-t border-gray-200 bg-gray-50 px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
              Réservez vos plongées sur
            </p>
            <Image
              src="/logo_black.png"
              alt="Aster by Orque"
              width={140}
              height={56}
              className="mx-auto mt-4"
            />
            <p className="mt-3 text-gray-500">
              La marketplace des expériences de plongée. Trouvez et réservez les
              meilleures sorties avec des centres certifiés partout dans le monde.
            </p>
            <a
              href="https://www.asterdive.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-soft transition-all duration-200 ease-out-expo hover:border-primary hover:text-primary hover:shadow-lifted active:scale-95"
            >
              Découvrir Aster
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
]

function ToolCard({ tool, index = 0 }: { tool: (typeof TOOLS)[number]; index?: number }) {
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
        {TOOL_ICONS[tool.slug] ? (
          <Image
            src={TOOL_ICONS[tool.slug]}
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
          {isLive ? tool.tag : 'Bientôt'}
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
          Ouvrir l&apos;outil
        </div>
      )}
    </div>
  )

  if (!isLive) return <div>{inner}</div>
  return <Link href={tool.slug}>{inner}</Link>
}
