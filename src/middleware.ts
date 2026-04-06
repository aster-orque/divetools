import { NextRequest, NextResponse } from 'next/server'
import { LOCALES, DEFAULT_LOCALE, isValidLocale } from './i18n/config'

const KNOWN_PAGES = ['nitrox', 'convertisseur', 'decompression', 'flottabilite', 'volumes', 'devis']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path already starts with a valid locale
  const segments = pathname.split('/')
  const maybeLocale = segments[1]

  if (isValidLocale(maybeLocale)) {
    return NextResponse.next()
  }

  // Root "/" → redirect to /fr
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(`/${DEFAULT_LOCALE}`, request.url),
      302
    )
  }

  // Known page without locale (e.g. /nitrox) → 301 to /fr/nitrox
  const slug = pathname.replace(/^\//, '')
  if (KNOWN_PAGES.includes(slug)) {
    return NextResponse.redirect(
      new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url),
      301
    )
  }

  // Any other unrecognized path → redirect to default locale
  return NextResponse.redirect(
    new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url),
    302
  )
}

export const config = {
  matcher: ['/((?!_next|api|favicon|.*\\..*).*)'],
}
