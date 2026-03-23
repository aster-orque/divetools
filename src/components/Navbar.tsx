import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-70"
        >
          <Image
            src="/logo-orque-black.jpeg"
            alt="Orque"
            width={72}
            height={28}
          />
          <span className="text-xs font-medium text-gray-400">Tools</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6 text-sm">
          <Link
            href="/nitrox"
            className="font-medium text-gray-700 transition-colors hover:text-primary"
          >
            Nitrox
          </Link>
          <span className="cursor-default text-gray-300">Décompression</span>
          <span className="cursor-default text-gray-300">Flottabilité</span>
        </div>

        {/* CTA */}
        <a
          href="https://www.asterdive.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 transition-all hover:border-primary hover:text-primary sm:inline-flex"
        >
          Réserver une plongée
        </a>
      </nav>
    </header>
  )
}
