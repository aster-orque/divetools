# Orque Tools (divetools)

Site d'outils gratuits pour plongeurs, en ligne sur **https://tools.orque.co**.
Stack : Next.js 15 (App Router) + React 19 + TypeScript strict + Tailwind 3. Hébergé sur Vercel
(déploiement automatique depuis `master` sur github.com/aster-orque/divetools).
Aucune dépendance runtime en dehors de next/react : on n'en ajoute pas sans demander.

## Architecture

```
src/
  middleware.ts                 # redirige / → /fr et /slug → /fr/slug (liste KNOWN_PAGES)
  i18n/
    config.ts                   # LOCALES ['fr','en'], BASE_URL, getAlternates(path)
    get-dictionary.ts
    dictionaries/fr.ts, en.ts   # TOUS les textes visibles, mêmes clés dans les deux langues
  app/
    sitemap.ts, robots.ts
    globals.css                 # variables couleur, slider, focus, .transition-lift / .hover-lift
    [locale]/
      layout.tsx                # <html>, metadata globale, Navbar, Footer, polices Poppins + JetBrains Mono
      page.tsx                  # accueil : TOOLS_CONFIG (clé = id) + dict.home.tools
      nitrox/page.tsx           # page outil de référence
      convertisseur/page.tsx    # page outil de référence (la plus récente, à copier)
  components/
    NitroxCalculator.tsx        # composant client de l'outil
    PressureConverter.tsx       # composant client de l'outil (StatCard, NumInput, onglets…)
    DisclaimerModal.tsx         # avertissement sécurité, à mettre sur chaque page outil
    Navbar.tsx, Footer.tsx
public/
  og-<slug>.png                 # image Open Graph 1200×630 par outil
```

## Anatomie d'un outil (checklist d'intégration)

Un outil `<slug>` (slug en français, minuscules, tirets : `gas-blender`, `consommation`…) touche :

1. `src/components/<NomOutil>.tsx` : `'use client'`, logique de calcul pure en haut du fichier
   (fonctions sans état, constantes nommées), puis sous-composants, puis composant exporté.
   Tous les textes viennent d'une prop `labels` typée par le dictionnaire.
2. `src/app/[locale]/<slug>/page.tsx` : copie la structure de `convertisseur/page.tsx`
   (generateMetadata, JSON-LD WebApplication + BreadcrumbList + FAQPage, DisclaimerModal,
   fil d'Ariane, h1, composant, sections SEO).
3. `src/i18n/dictionaries/fr.ts` et `en.ts` : `metadata.<clé>`, bloc `<clé>` de l'outil,
   entrée dans `home.tools` (avec `id`), entrée dans `nav.links`.
4. `src/app/[locale]/page.tsx` : entrée dans `TOOLS_CONFIG` (même `id`).
5. `src/components/Navbar.tsx` : slug dans `SLUGS` (attention, appariement par position avec `nav.links`).
6. `src/middleware.ts` : slug dans `KNOWN_PAGES`.
7. `src/app/sitemap.ts` : URLs fr et en avec alternates.
8. `public/og-<slug>.png` (1200×630).

## Agents du projet (.claude/agents)

Pipeline pour publier un nouvel outil à partir d'un HTML brut : commande `/nouvel-outil`.

| Agent | Rôle |
|---|---|
| `optimiseur-code` | Porte le HTML/JS brut en composant React TS propre et performant |
| `verificateur-calculs` | Vérifie que les calculs de plongée du port donnent les mêmes résultats que l'original |
| `designer-orque` | Met en page au design Orque (tokens, composants, responsive, accessibilité) |
| `traducteur-i18n` | Extrait les textes, remplit fr.ts et en.ts, vérifie la parité des clés |
| `expert-seo` | Metadata, mots-clés, JSON-LD, contenu SEO, sitemap, image OG |
| `integrateur-site` | Branche l'outil partout (route, accueil, navbar, middleware, sitemap) |
| `controle-qualite` | tsc, lint, build, revue finale avant commit |

## Règles

- Les calculs sont liés à la sécurité des plongeurs : ne jamais changer une formule, une constante
  ou un arrondi sans le signaler explicitement.
- Langue par défaut : français. Les slugs d'URL restent en français dans les deux langues.
- Ne pas pousser sur `master` ni ouvrir de PR sans l'accord de Maxime ; travailler sur une branche `outil/<slug>`.
- Commandes : `npm run dev` (localhost:3000), `npm run build`, `npm run lint`, `npx tsc --noEmit`.
  ESLint (`eslint.config.mjs`, règles Next.js core-web-vitals + TypeScript) tourne aussi pendant
  `npm run build` : une erreur de lint fait échouer le déploiement Vercel.
