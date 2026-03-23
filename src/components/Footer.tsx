import Image from 'next/image'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand */}
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
            <p className="mt-1 text-xs text-gray-400">
              Outils gratuits pour plongeurs &mdash; réservez vos plongées sur{' '}
              <a
                href="https://www.asterdive.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 transition hover:text-primary"
              >
                Aster by Orque
              </a>
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-400">
            <a
              href="https://www.asterdive.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-gray-700"
            >
              Aster by Orque
            </a>
            <a
              href="https://www.asterdive.com/experiences"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-gray-700"
            >
              Réserver une plongée
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-xs text-gray-400">
          <p>
            &copy; {year} Orque &mdash; Les informations fournies sont indicatives. Toujours
            vérifier vos calculs avec un instructeur certifié avant chaque plongée.
          </p>
        </div>
      </div>
    </footer>
  )
}
