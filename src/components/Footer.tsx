import Image from 'next/image'

const ASTER_BASE = 'https://www.asterdive.com/fr'

const FOOTER_LINKS = {
  Entreprise: [
    { label: 'À propos', href: `${ASTER_BASE}/about` },
    { label: 'Contact', href: `${ASTER_BASE}/contact` },
    { label: 'Médias', href: `${ASTER_BASE}/medias` },
    { label: 'Devenir centre partenaire', href: `${ASTER_BASE}/why-become-host` },
    { label: 'Pourquoi Aster', href: `${ASTER_BASE}/why-become-diver` },
  ],
  Support: [
    { label: 'FAQ Plongeurs', href: `${ASTER_BASE}/faq` },
    { label: 'FAQ Centres', href: `${ASTER_BASE}/faq-pro` },
    { label: 'Nous contacter', href: `${ASTER_BASE}/contact` },
  ],
  // Légal: [
  //   { label: 'CGU', href: `${ASTER_BASE}/terms` },
  //   { label: 'CGV', href: `${ASTER_BASE}/cgv` },
  //   { label: 'Confidentialité', href: `${ASTER_BASE}/privacy` },
  //   { label: 'Mentions légales', href: `${ASTER_BASE}/mentions-legales` },
  // ],
  Plateforme: [
    { label: 'Expériences', href: `${ASTER_BASE}/experiences` },
    { label: 'Centres de plongée', href: `${ASTER_BASE}/structures` },
    { label: 'Organiser un voyage', href: `${ASTER_BASE}/organize-trip` },
    { label: 'Blog', href: 'https://blog.orque.co' },
  ],
}

const SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/OrqueFrance',
    path: 'M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/orquefrance/',
    path: 'M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.508-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428.247-.67.645-1.276 1.153-1.772a4.904 4.904 0 011.772-1.153c.637-.247 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z',
  },
  {
    label: 'Podcast Narcose',
    href: 'https://creators.spotify.com/pod/profile/narcose/',
    path: 'M12 1c-5.5 0-10 4.5-10 10v1c0 2.2 1.8 4 4 4h1v-7H5v-1c0-3.9 3.1-7 7-7s7 3.1 7 7v1h-2v7h1c2.2 0 4-1.8 4-4v-1c0-5.5-4.5-10-10-10zm-2 11v6c0 .6.4 1 1 1s1-.4 1-1v-6c0-.6-.4-1-1-1s-1 .4-1 1z',
  },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* Top: logo + socials */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/logo-orque-black.jpeg"
                alt="Orque"
                width={64}
                height={24}
              />
              <span className="text-xs font-medium text-gray-400">Tools</span>
            </div>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-gray-400">
              Outils gratuits pour plongeurs sous-marins. Réservez vos plongées
              sur Aster by Orque.
            </p>
          </div>

          {/* Socials */}
          <div className="flex gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-all duration-200 hover:bg-gray-200 hover:text-gray-700"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-3">
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-3 text-xs font-semibold text-black">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href + link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-400 transition-colors duration-200 hover:text-gray-700"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-gray-200 pt-6 text-xs text-gray-400 sm:flex-row">
          <p>&copy; {year} Orque &mdash; Les informations fournies sont indicatives.</p>
          <p>
            Propulsé par{' '}
            <a
              href="https://www.orque.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 transition-colors duration-200 hover:text-primary"
            >
              Orque
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
