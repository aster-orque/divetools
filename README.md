# Aster Tools — Outils plongée

Site d'outils gratuits pour plongeurs. Stack : **Next.js 15 + Tailwind CSS + TypeScript**,
hébergé sur **Vercel**.

---

## 🚀 Mise en ligne (Vercel) — étapes

### 1. Pré-requis
- Compte [Vercel](https://vercel.com) (gratuit)
- [Git](https://git-scm.com/) installé
- [Node.js 18+](https://nodejs.org) installé

---

### 2. Premier lancement en local

```bash
cd divetools
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

---

### 3. Déploiement sur Vercel

#### Option A — Via l'interface Vercel (recommandé)

1. Pousse le projet sur GitHub :
   ```bash
   git init
   git add .
   git commit -m "Initial commit — Aster Tools"
   gh repo create aster-tools --private --source=. --push
   ```

2. Va sur [vercel.com/new](https://vercel.com/new)
3. **Import Git Repository** → sélectionne `aster-tools`
4. Framework preset → **Next.js** (détecté automatiquement)
5. Clique **Deploy** — c'est tout.

Vercel te donne une URL type `aster-tools.vercel.app`.

---

### 4. Configurer le sous-domaine `tools.asterdive.com`

#### Sur Vercel
1. Dashboard du projet → **Settings → Domains**
2. Ajoute `tools.asterdive.com`
3. Vercel te donne un enregistrement CNAME à ajouter

#### Sur Cloudflare (DNS d'Aster)
1. Ajoute un enregistrement **CNAME** :
   - **Name** : `tools`
   - **Target** : `cname.vercel-dns.com`
   - **Proxy status** : ☁ Proxied (ou DNS only si tu préfères)
2. Retourne sur Vercel → le domaine passe en vert en 1-2 min

> **Note** : Si Cloudflare est en mode Proxy (orange), désactive SSL Flexible →
> mets **Full (strict)** dans SSL/TLS pour éviter les redirections infinies.

---

### 5. Variables d'environnement

Aucune variable nécessaire pour le moment — tout est statique.

Si tu ajoutes Google Analytics plus tard, ajoute dans Vercel → Settings → Environment Variables :
```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 📁 Structure du projet

```
src/
  app/
    layout.tsx          # Layout global + fonts + metadata de base
    page.tsx            # Homepage — liste des outils
    globals.css         # Design system dark ocean
    sitemap.ts          # /sitemap.xml auto-généré
    robots.ts           # /robots.txt
    nitrox/
      page.tsx          # Page /nitrox — SEO + JSON-LD
  components/
    NitroxCalculator.tsx  # Calculateur interactif (client component)
    Navbar.tsx
    Footer.tsx
```

## ➕ Ajouter un nouvel outil

1. Crée `src/app/[nom-outil]/page.tsx` avec ses metadata
2. Crée `src/components/[NomOutil].tsx` (client component si interactif)
3. Ajoute l'outil dans la liste `TOOLS` dans `src/app/page.tsx`
4. Ajoute l'URL dans `src/app/sitemap.ts`

---

## 🔧 Commandes utiles

```bash
npm run dev      # Dev local (http://localhost:3000)
npm run build    # Build de production
npm run lint     # Linting TypeScript
```

---

## 📝 SEO — checklist par outil

- [ ] `title` unique et ciblé (mot-clé principal)
- [ ] `description` avec keywords naturels (155 chars max)
- [ ] `canonical` URL
- [ ] `openGraph` image (1200×630, à créer dans /public)
- [ ] `JSON-LD` structured data (`WebApplication`)
- [ ] Section HTML explicative sous le calculateur (contenu textuel pour Google)
- [ ] Ajout dans `sitemap.ts`

---

*Pour toute la plomberie SEO et l'ajout d'outils, référez-vous à la structure de `/nitrox`
qui sert de template de référence.*
