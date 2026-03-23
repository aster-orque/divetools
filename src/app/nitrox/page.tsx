import type { Metadata } from 'next'
import Image from 'next/image'
import NitroxCalculator from '@/components/NitroxCalculator'
import DisclaimerModal from '@/components/DisclaimerModal'

// ── Metadata SEO ciblé ────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Calculateur Nitrox — MOD, EAD, Meilleur Mélange et CNS',
  description:
    'Calculateur nitrox gratuit : calculez la profondeur maximale (MOD), la profondeur air équivalente (EAD), le meilleur mélange pour votre plongée et la toxicité oxygène CNS selon la table NOAA. Outil en ligne, sans inscription.',
  keywords: [
    'calculateur nitrox',
    'calculateur MOD nitrox',
    'profondeur maximum nitrox',
    'calcul EAD plongée',
    'meilleur mélange nitrox',
    'toxicité oxygène CNS plongée',
    'table NOAA plongée',
    'nitrox enrichi plongée',
    'EANx calculateur',
    'ppO2 plongée nitrox',
    'calculateur plongée nitrox gratuit',
  ],
  alternates: {
    canonical: 'https://tools.orque.co/nitrox',
  },
  openGraph: {
    title: 'Calculateur Nitrox — MOD, EAD et Toxicité O₂',
    description:
      'Calculez la profondeur maximale (MOD), EAD, meilleur mélange et toxicité CNS pour vos plongées nitrox.',
    url: 'https://tools.orque.co/nitrox',
    images: [
      {
        url: '/og-nitrox.png',
        width: 1200,
        height: 630,
        alt: 'Calculateur Nitrox — Orque Tools',
      },
    ],
  },
}

// ── Données structurées JSON-LD (Rich Results Google) ─────────────────────────
const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Calculateur Nitrox',
    description:
      'Calculateur nitrox gratuit : MOD, EAD, meilleur mélange et toxicité CNS selon la table NOAA.',
    url: 'https://tools.orque.co/nitrox',
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
        name: 'Orque Tools',
        item: 'https://tools.orque.co',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Calculateur Nitrox',
        item: 'https://tools.orque.co/nitrox',
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Comment calculer la MOD (profondeur maximale) en nitrox ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'La MOD (Maximum Operating Depth) se calcule avec la formule : MOD = ((PPO₂ / FO₂) − 1) × 10. Par exemple, pour un EANx32 avec une PPO₂ max de 1,4 bar, la MOD est de 33,75 m.',
        },
      },
      {
        '@type': 'Question',
        name: "Qu'est-ce que l'EAD (profondeur air équivalente) ?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: "L'EAD (Equivalent Air Depth) est la profondeur sur air qui provoquerait la même narcose et la même charge en azote qu'une plongée nitrox à une profondeur donnée. Plus la FO₂ est élevée, plus l'EAD est réduite, ce qui allonge les temps de non-décompression.",
        },
      },
      {
        '@type': 'Question',
        name: 'Toxicité O₂ et table NOAA : comment comprendre le % CNS ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "La table NOAA définit des durées maximales d'exposition pour chaque niveau de PPO₂. Le % CNS cumulé permet de suivre l'exposition sur une journée de plongée. Il est recommandé de ne pas dépasser 80 % de CNS par jour et 100 % en cumulé.",
        },
      },
      {
        '@type': 'Question',
        name: 'Quel mélange nitrox choisir pour ma plongée ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Le meilleur mélange est celui dont la MOD correspond exactement à votre profondeur cible. En pratique, les plongeurs choisissent entre EANx32 et EANx36 pour les plongées récifales entre 20 et 35 m. Au-delà de 40 % de FO₂, les risques de toxicité oxygène augmentent significativement.",
        },
      },
    ],
  },
]

export default function NitroxPage() {
  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <DisclaimerModal />
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
        {/* ── Breadcrumb + header ──────────────────────────────────── */}
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-400">
            <a href="/" className="transition-colors hover:text-primary">
              Outils
            </a>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700">Nitrox</span>
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
              Calculateur Nitrox
            </h1>
          </div>
          <p className="mt-3 text-base leading-relaxed text-gray-500">
            MOD, EAD, meilleur mélange et toxicité O&#8322; — calculs en temps
            réel pour planifier vos plongées nitrox en toute sécurité.
          </p>
        </div>

        {/* ── Calculator ──────────────────────────────────────────── */}
        <NitroxCalculator />

        {/* ── SEO content ─────────────────────────────────────────── */}
        <div className="mt-16 space-y-10 border-t border-gray-200 pt-12">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-black">
              Comment calculer la MOD (profondeur maximale) en nitrox ?
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">
              La MOD (Maximum Operating Depth) est la profondeur à ne pas dépasser
              avec un mélange nitrox donné, pour une PPO&#8322; maximale définie.
              Elle se calcule avec la formule :{' '}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-primary text-xs">
                MOD = ((PPO&#8322; / FO&#8322;) &minus; 1) &times; 10
              </code>
              . Par exemple, pour un EANx32 avec une PPO&#8322; max de 1,4 bar, la
              MOD est de ((1,4 / 0,32) &minus; 1) &times; 10 ={' '}
              <strong className="text-black">33,75 m</strong>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-black">
              Qu&apos;est-ce que l&apos;EAD (profondeur air équivalente) ?
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">
              L&apos;EAD (Equivalent Air Depth) est la profondeur sur air qui
              provoquerait la même narcose et la même charge en azote qu&apos;une
              plongée nitrox à une profondeur donnée. Plus votre FO&#8322; est
              élevée, plus l&apos;EAD est réduite — ce qui allonge les temps de
              non-décompression. Formule :{' '}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-primary text-xs">
                EAD = ((FO&#8322; / 0,21) &times; (P + 10)) &minus; 10
              </code>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-black">
              Toxicité O&#8322; et table NOAA : comprendre le % CNS
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">
              L&apos;exposition prolongée à une PPO&#8322; élevée peut provoquer une
              toxicité du système nerveux central (CNS), se manifestant par des
              convulsions. La table NOAA définit des durées maximales
              d&apos;exposition pour chaque niveau de PPO&#8322;. Le % CNS cumulé
              permet de suivre l&apos;exposition sur une journée de plongée. Il est
              recommandé de ne pas dépasser 80 % de CNS par jour et 100 % en cumulé.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-black">
              Quel mélange nitrox choisir pour ma plongée ?
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">
              Le meilleur mélange est celui dont la MOD correspond exactement à votre
              profondeur cible, pour une PPO&#8322; max choisie. C&apos;est ce
              qu&apos;on appelle le &quot;mélange optimal&quot;. Dans la pratique, les
              plongeurs choisissent entre EANx32 (nitrox 32%) et EANx36 pour la
              plupart des plongées récifales entre 20 et 35 m. Au-delà de 40 % de
              FO&#8322;, les risques de toxicité oxygène augmentent
              significativement.
            </p>
          </section>
        </div>

        {/* ── Nitrox experiences on Aster ──────────────────────────── */}
        <NitroxExperiences />
      </div>
    </>
  )
}

// ── Experiences data ──────────────────────────────────────────────────────────
const NITROX_EXPERIENCES = [
  {
    title: "Journée de plongée sur l'île de Pianosa",
    location: 'Procchio - Marciana, Italie',
    dives: '2 plongées',
    price: '182 €',
    image:
      'https://imagedelivery.net/WaB-aX0zqDQOeXGLCHAdWg/d5b4abb6-6cf6-426e-9d66-e79fa3634300/experiencecard',
    href: 'https://www.asterdive.com/fr/Diving%20in%20Elba%20-%20Italy/journe-de-plonge-sur-lle-de-pianosa-park-marin-national',
  },
  {
    title: 'Plongées raies aigles léopard',
    location: 'Playa del Carmen, Mexique',
    dives: '2 plongées',
    price: '222 €',
    image:
      'https://imagedelivery.net/WaB-aX0zqDQOeXGLCHAdWg/523ea3bc-7f57-46b9-1b9c-9c1410ed5b00/experiencecard',
    href: 'https://www.asterdive.com/fr/Phocea/plonges-raies-aigles-lopard',
  },
  {
    title: 'Plongée avec des requins bouledogues',
    location: 'Quintana Roo, Mexique',
    dives: '1 plongée',
    price: '160 €',
    image:
      'https://imagedelivery.net/WaB-aX0zqDQOeXGLCHAdWg/6c61cc83-0d91-454b-246d-3d9005139600/experiencecard',
    href: 'https://www.asterdive.com/fr/Phocea/plonge-avec-des-requins-bouledogues-',
  },
  {
    title: 'PADI Wreck Diver',
    location: 'Playa del Carmen, Mexique',
    dives: '4 plongées',
    price: '490 €',
    image:
      'https://imagedelivery.net/WaB-aX0zqDQOeXGLCHAdWg/bc51725d-0884-4282-7701-ebef469de900/experiencecard',
    href: 'https://www.asterdive.com/fr/Phocea/padi-wreck-diver-o-laventure-rencontre-lhistoire',
  },
]

function NitroxExperiences() {
  return (
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
        Expériences nitrox à réserver
      </h2>
      <p className="mb-6 text-sm text-gray-500">
        Plongées et formations nitrox disponibles sur Aster by Orque.
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
                  {exp.dives}
                </span>
                <span className="text-xs font-medium text-primary opacity-0 transition-all duration-200 ease-out-expo translate-x-1 group-hover:opacity-100 group-hover:translate-x-0">
                  Voir sur Aster
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
          Voir toutes les expériences nitrox
        </a>
      </div>
    </section>
  )
}
