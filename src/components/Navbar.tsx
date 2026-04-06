'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const SLUGS = ['/nitrox', '/convertisseur', '/decompression', '/flottabilite', '/devis']

export default function Navbar({
  locale,
  labels,
}: {
  locale: string
  labels: {
    links: { label: string; live: boolean }[]
    bookDive: string
    soonBadge: string
    onAster: string
  }
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const NAV_LINKS = labels.links.map((link, i) => ({
    href: `/${locale}${SLUGS[i]}`,
    label: link.label,
    live: link.live,
  }))

  // Close on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

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
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-70"
          >
            <Image
              src="/logo-orque-black.jpeg"
              alt="Orque"
              width={72}
              height={28}
            />
            <span className="text-xs font-medium text-gray-400">Tools</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 text-sm md:flex">
            {NAV_LINKS.map((link) =>
              link.live ? (
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
              ) : (
                <span key={link.href} className="cursor-default text-gray-300">
                  {link.label}
                </span>
              )
            )}
          </div>

          {/* Desktop: lang toggle + CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <LangToggle locale={locale} pathname={pathname} />
            <a
              href="https://www.asterdive.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 shadow-soft transition-all duration-200 ease-out-expo hover:border-primary hover:text-primary hover:shadow-lifted active:scale-95"
            >
              {labels.bookDive}
            </a>
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setOpen(!open)}
            className="relative z-[60] flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-200 hover:bg-gray-100 active:scale-95 md:hidden"
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
        className={`fixed inset-0 z-[55] bg-black/20 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Mobile slide-in panel — full-screen overlay approach */}
      <div
        className={`fixed inset-y-0 right-0 z-[60] w-full max-w-[280px] bg-white shadow-float transition-transform duration-300 ease-out-expo md:hidden ${
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
