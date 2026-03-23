import type { Metadata } from 'next'
import Image from 'next/image'
import NitroxCalculator from '@/components/NitroxCalculator'
import DisclaimerModal from '@/components/DisclaimerModal'
import { getDictionary } from '@/i18n/get-dictionary'
import { Locale, BASE_URL, getAlternates } from '@/i18n/config'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    title: dict.metadata.nitrox.title,
    description: dict.metadata.nitrox.description,
    keywords: dict.metadata.nitrox.keywords,
    alternates: getAlternates('/nitrox'),
    openGraph: {
      title: dict.metadata.nitrox.ogTitle,
      description: dict.metadata.nitrox.ogDescription,
      url: `${BASE_URL}/${locale}/nitrox`,
      images: [
        {
          url: '/og-nitrox.png',
          width: 1200,
          height: 630,
          alt: `${dict.metadata.nitrox.ogTitle} — Orque Tools`,
        },
      ],
    },
  }
}

export default async function NitroxPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: dict.nitrox.jsonLd.appName,
      description: dict.nitrox.jsonLd.appDescription,
      url: `${BASE_URL}/${locale}/nitrox`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
      provider: {
        '@type': 'Organization',
        name: 'Aster',
        url: 'https://www.asterdive.com',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: dict.nitrox.jsonLd.breadcrumbHome,
          item: `${BASE_URL}/${locale}`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: dict.nitrox.jsonLd.appName,
          item: `${BASE_URL}/${locale}/nitrox`,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: dict.nitrox.seo.map((item) => ({
        '@type': 'Question',
        name: item.title,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.content,
        },
      })),
    },
  ]

  const NITROX_EXPERIENCES = [
    {
      title: "Journée de plongée sur l'île de Pianosa",
      location: 'Procchio - Marciana, Italie',
      dives: '2',
      price: '182 \u20ac',
      image:
        'https://imagedelivery.net/WaB-aX0zqDQOeXGLCHAdWg/d5b4abb6-6cf6-426e-9d66-e79fa3634300/experiencecard',
      href: 'https://www.asterdive.com/fr/Diving%20in%20Elba%20-%20Italy/journe-de-plonge-sur-lle-de-pianosa-park-marin-national',
    },
    {
      title: 'Plongées raies aigles léopard',
      location: 'Playa del Carmen, Mexique',
      dives: '2',
      price: '222 \u20ac',
      image:
        'https://imagedelivery.net/WaB-aX0zqDQOeXGLCHAdWg/523ea3bc-7f57-46b9-1b9c-9c1410ed5b00/experiencecard',
      href: 'https://www.asterdive.com/fr/Phocea/plonges-raies-aigles-lopard',
    },
    {
      title: 'Plongée avec des requins bouledogues',
      location: 'Quintana Roo, Mexique',
      dives: '1',
      price: '160 \u20ac',
      image:
        'https://imagedelivery.net/WaB-aX0zqDQOeXGLCHAdWg/6c61cc83-0d91-454b-246d-3d9005139600/experiencecard',
      href: 'https://www.asterdive.com/fr/Phocea/plonge-avec-des-requins-bouledogues-',
    },
    {
      title: 'PADI Wreck Diver',
      location: 'Playa del Carmen, Mexique',
      dives: '4',
      price: '490 \u20ac',
      image:
        'https://imagedelivery.net/WaB-aX0zqDQOeXGLCHAdWg/bc51725d-0884-4282-7701-ebef469de900/experiencecard',
      href: 'https://www.asterdive.com/fr/Phocea/padi-wreck-diver-o-laventure-rencontre-lhistoire',
    },
  ]

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <DisclaimerModal labels={dict.disclaimer} />
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
        {/* ── Breadcrumb + header ──────────────────────────────────── */}
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-400">
            <a href={`/${locale}`} className="transition-colors hover:text-primary">
              {dict.nitrox.breadcrumbHome}
            </a>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700">{dict.nitrox.breadcrumbCurrent}</span>
          </div>
          <div className="flex items-center gap-3">
            <Image
              src="/Nx.png"
              alt="Nitrox"
              width={44}
              height={44}
              className="rounded-xl"
            />
            <h1 className="text-3xl font-extrabold tracking-tight text-black md:text-4xl">
              {dict.nitrox.title}
            </h1>
          </div>
          <p className="mt-3 text-base leading-relaxed text-gray-500">
            {dict.nitrox.subtitle}
          </p>
        </div>

        {/* ── Calculator ──────────────────────────────────────────── */}
        <NitroxCalculator labels={dict.nitrox} />

        {/* ── SEO content ─────────────────────────────────────────── */}
        <div className="mt-16 space-y-10 border-t border-gray-200 pt-12">
          {dict.nitrox.seo.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-lg font-semibold text-black">
                {section.title}
              </h2>
              <p className="text-sm leading-relaxed text-gray-500">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        {/* ── Nitrox experiences on Aster ──────────────────────────── */}
        <section className="mt-16 border-t border-gray-200 pt-12">
          <div className="mb-2 flex items-center gap-2">
            <Image
              src="/logo_black.png"
              alt="Aster by Orque"
              width={80}
              height={32}
            />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-black">
            {dict.nitrox.experiences.title}
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            {dict.nitrox.experiences.subtitle}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {NITROX_EXPERIENCES.map((exp) => (
              <a
                key={exp.href}
                href={exp.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-soft transition-lift hover-lift hover:shadow-float"
              >
                {/* Image */}
                <div className="relative h-40 overflow-hidden bg-gray-100">
                  <img
                    src={exp.image}
                    alt={exp.title}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out-expo group-hover:scale-105"
                  />
                  <div className="absolute right-3 top-3 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-black backdrop-blur-sm">
                    {exp.price}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-black transition-colors duration-200 group-hover:text-primary line-clamp-1">
                    {exp.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-400">{exp.location}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-lg bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary">
                      {exp.dives} {dict.nitrox.experiences.dives}
                    </span>
                    <span className="text-xs font-medium text-primary opacity-0 transition-all duration-200 ease-out-expo translate-x-1 group-hover:opacity-100 group-hover:translate-x-0">
                      {dict.nitrox.experiences.viewOnAster}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-6 text-center">
            <a
              href="https://www.asterdive.com/fr/experiences?nitrox=true"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-soft transition-all duration-200 ease-out-expo hover:border-primary hover:text-primary hover:shadow-lifted active:scale-95"
            >
              {dict.nitrox.experiences.viewAll}
            </a>
          </div>
        </section>
      </div>
    </>
  )
}
