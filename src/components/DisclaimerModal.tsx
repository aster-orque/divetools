'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'orque-tools-disclaimer-accepted'

export default function DisclaimerModal() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    sessionStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-scale-in rounded-2xl border border-gray-200 bg-white p-6 shadow-float sm:p-8">
        {/* Icon */}
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
          <svg
            className="h-5 w-5 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-black">
          Outil à usage éducatif
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          Ce calculateur est fourni à titre <strong className="text-gray-700">informatif et éducatif uniquement</strong>.
          Il ne remplace en aucun cas la formation d&apos;un instructeur certifié,
          un ordinateur de plongée ou les tables de décompression officielles.
        </p>

        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          Orque ne saurait être tenu responsable de tout incident lié
          à l&apos;utilisation de ces résultats. Vérifiez systématiquement
          vos paramètres avant chaque plongée.
        </p>

        <button
          onClick={accept}
          className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(18,132,199,0.3)] transition-all duration-200 ease-out-expo hover:bg-primary-600 active:scale-[0.98]"
        >
          J&apos;ai compris
        </button>

        <p className="mt-3 text-center text-[11px] text-gray-400">
          Ce message s&apos;affiche une fois par session.
        </p>
      </div>
    </div>
  )
}
