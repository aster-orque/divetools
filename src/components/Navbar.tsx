'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

/* Slug de chaque lien, indexé par l'`id` de l'entrée correspondante dans
   `dict.nav.links` (même principe que TOOLS_CONFIG sur l'accueil) : l'ordre
   du dictionnaire peut changer sans désynchroniser libellés et liens. */
const SLUGS: Record<string, string> = {
  nitrox: '/nitrox',
  convertisseur: '/convertisseur',
  consommation: '/consommation',
  'gas-blender': '/gas-blender',
  'etiquette-nitrox': '/etiquette-nitrox',
  'saturation-azote': '/saturation-azote',
  mod: '/mod',
  ppo2: '/ppo2',
  ead: '/ead',
  'best-mix': '/best-mix',
  lestage: '/lestage',
  decompression: '/decompression',
  devis: '/devis',
}

export default function Navbar({
  locale,
  labels,
}: {
  locale: string
  labels: {
    links: { id: string; label: string; live: boolean; group?: string }[]
    nitroxGroup: string
    bookDive: string
    soonBadge: string
    onAster: string
  }
}) {
  const [open, setOpen] = useState(false)
  const [groupOpen, setGroupOpen] = useState(false)
  const groupRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const NAV_LINKS = labels.links.map((link) => ({
    href: `/${locale}${SLUGS[link.id]}`,
    label: link.label,
    live: link.live,
    group: link.group,
  }))
  /* Desktop : les outils nitrox sont regroupés dans un menu déroulant « Nitrox », placé à la
     position du premier d'entre eux ; les autres outils en ligne restent des liens directs. */
  const groupLinks = NAV_LINKS.filter((link) => link.live && link.group === 'nitrox')
  const groupActive = groupLinks.some((link) => link.href === pathname)
  const firstGroupIndex = NAV_LINKS.findIndex((link) => link.live && link.group === 'nitrox')

  // Close on route change
  useEffect(() => {
    setOpen(false)
    setGroupOpen(false)
  }, [pathname])

  // Ferme le menu Nitrox au clic à l'extérieur ou sur Échap
  useEffect(() => {
    if (!groupOpen) return
    const onDown = (e: MouseEvent) => {
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) setGroupOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGroupOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [groupOpen])

  // Lock body scroll when menu open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-200 ${
        open ? 'border-transparent bg-white' : 'border-gray-100 bg-white/80'
      }`}>
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex shrink-0 items-center gap-2.5 transition-opacity duration-200 hover:opacity-70"
          >
            {/* L'asset est carré et très margé : on fixe la boîte et on recadre,
                sinon le preflight Tailwind (`height: auto`) rend un 72x72. */}
            <Image
              src="/logo-orque-black.jpeg"
              alt="Orque"
              width={72}
              height={28}
              className="h-7 w-[72px] object-cover"
            />
            <span className="text-xs font-medium text-gray-400">Tools</span>
          </Link>

          {/* Desktop nav : outils en ligne seulement (les « bientôt » restent dans le menu mobile, faute de place) */}
          <div className="hidden min-w-0 items-center gap-3.5 whitespace-nowrap text-sm min-[1100px]:flex xl:gap-5">
            {NAV_LINKS.map((link, i) => {
              if (!link.live) return null
              if (link.group === 'nitrox') {
                if (i !== firstGroupIndex) return null
                return (
                  <div
                    key="nitrox-group"
                    ref={groupRef}
                    className="relative"
                    onMouseEnter={() => setGroupOpen(true)}
                    onMouseLeave={() => setGroupOpen(false)}
                  >
                    <button
                      type="button"
                      aria-expanded={groupOpen}
                      aria-haspopup="true"
                      onClick={() => setGroupOpen((v) => !v)}
                      className={`relative flex items-center gap-1 font-medium transition-colors duration-200 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-primary after:transition-all after:duration-200 after:ease-out-expo ${
                        groupActive ? 'text-primary after:w-full' : 'text-gray-700 after:w-0 hover:text-primary hover:after:w-full'
                      }`}
                    >
                      {labels.nitroxGroup}
                      <svg aria-hidden className={`h-3.5 w-3.5 transition-transform duration-200 ${groupOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {/* pt-3 : pont invisible entre le bouton et le menu, pour ne pas le perdre au survol */}
                    <div className={`absolute left-1/2 top-full -translate-x-1/2 pt-3 transition-all duration-200 ease-out-expo ${groupOpen ? 'visible opacity-100' : 'invisible -translate-y-1 opacity-0'}`}>
                      <div className="min-w-[210px] rounded-xl border border-gray-200 bg-white p-1.5 shadow-float">
                        {groupLinks.map((g) => (
                          <Link
                            key={g.href}
                            href={g.href}
                            className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                              pathname === g.href ? 'bg-primary-50 text-primary' : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
                            }`}
                          >
                            {g.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative font-medium transition-colors duration-200 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-primary after:transition-all after:duration-200 after:ease-out-expo ${
                    pathname === link.href
                      ? 'text-primary after:w-full'
                      : 'text-gray-700 after:w-0 hover:text-primary hover:after:w-full'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Desktop: lang toggle + CTA */}
          <div className="hidden shrink-0 items-center gap-3 min-[1100px]:flex">
            <LangToggle locale={locale} pathname={pathname} />
            <a
              href="https://www.asterdive.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 shadow-soft transition-all duration-200 ease-out-expo hover:border-primary hover:text-primary hover:shadow-lifted active:scale-95"
            >
              {labels.bookDive}
            </a>
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setOpen(!open)}
            className="relative z-[60] flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-200 hover:bg-gray-100 active:scale-95 min-[1100px]:hidden"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            <div className="flex w-5 flex-col items-end gap-[5px]">
              <span
                className={`block h-[2px] rounded-full bg-black transition-all duration-300 ease-out-expo ${
                  open ? 'w-5 translate-y-[7px] rotate-45' : 'w-5'
                }`}
              />
              <span
                className={`block h-[2px] rounded-full bg-black transition-all duration-300 ease-out-expo ${
                  open ? 'w-0 opacity-0' : 'w-3.5 opacity-100'
                }`}
              />
              <span
                className={`block h-[2px] rounded-full bg-black transition-all duration-300 ease-out-expo ${
                  open ? 'w-5 -translate-y-[7px] -rotate-45' : 'w-5'
                }`}
              />
            </div>
          </button>
        </nav>
      </header>

      {/* Mobile overlay — outside header to avoid stacking issues */}
      <div
        className={`fixed inset-0 z-[55] bg-black/20 backdrop-blur-sm transition-opacity duration-300 min-[1100px]:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Mobile slide-in panel — full-screen overlay approach */}
      <div
        className={`fixed inset-y-0 right-0 z-[60] w-full max-w-[280px] bg-white shadow-float transition-transform duration-300 ease-out-expo min-[1100px]:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel header with close button */}
        <div className="flex h-[65px] items-center justify-end px-4">
          <button
            onClick={() => setOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-200 hover:bg-gray-100 active:scale-95"
            aria-label="Fermer le menu"
          >
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex h-[calc(100dvh-65px)] flex-col overflow-y-auto px-6 pb-6">
          {/* Links */}
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link, i) =>
              link.live ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-4 py-3 text-[15px] font-medium transition-all duration-200 ${
                    pathname === link.href
                      ? 'bg-primary-50 text-primary'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{
                    transitionDelay: open ? `${i * 40}ms` : '0ms',
                    opacity: open ? 1 : 0,
                    transform: open ? 'translateX(0)' : 'translateX(12px)',
                  }}
                >
                  {link.label}
                </Link>
              ) : (
                <span
                  key={link.href}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-[15px] text-gray-300 transition-all duration-200"
                  style={{
                    transitionDelay: open ? `${i * 40}ms` : '0ms',
                    opacity: open ? 1 : 0,
                    transform: open ? 'translateX(0)' : 'translateX(12px)',
                  }}
                >
                  {link.label}
                  <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                    {labels.soonBadge}
                  </span>
                </span>
              )
            )}
          </div>

          {/* Mobile lang switch */}
          <div
            className="mt-4 flex gap-2 transition-all duration-200"
            style={{
              transitionDelay: open ? '220ms' : '0ms',
              opacity: open ? 1 : 0,
              transform: open ? 'translateX(0)' : 'translateX(12px)',
            }}
          >
            {(['fr', 'en'] as const).map((lang) => {
              const switchedPath = pathname.replace(`/${locale}`, `/${lang}`)
              const isActive = locale === lang
              return (
                <Link
                  key={lang}
                  href={switchedPath}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gray-100 text-black'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                  }`}
                >
                  <span className="text-base">{lang === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
                  {lang === 'fr' ? 'Français' : 'English'}
                </Link>
              )
            })}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Mobile CTA */}
          <div
            className="border-t border-gray-100 pt-5 transition-all duration-200"
            style={{
              transitionDelay: open ? '260ms' : '0ms',
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            <a
              href="https://www.asterdive.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(18,132,199,0.3)] transition-all duration-200 hover:bg-primary-600 active:scale-95"
            >
              {labels.bookDive}
            </a>
            <p className="mt-3 text-center text-xs text-gray-400">
              {labels.onAster}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

function LangToggle({ locale, pathname }: { locale: string; pathname: string }) {
  const otherLocale = locale === 'fr' ? 'en' : 'fr'
  const switchedPath = pathname.replace(`/${locale}`, `/${otherLocale}`)

  return (
    <Link
      href={switchedPath}
      className="flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5 text-xs font-medium shadow-soft transition-all duration-200 ease-out-expo hover:shadow-lifted"
    >
      <span
        className={`rounded-md px-2 py-1 transition-all duration-200 ${
          locale === 'fr'
            ? 'bg-black text-white'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        FR
      </span>
      <span
        className={`rounded-md px-2 py-1 transition-all duration-200 ${
          locale === 'en'
            ? 'bg-black text-white'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        EN
      </span>
    </Link>
  )
}
