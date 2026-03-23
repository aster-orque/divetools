const dict = {
  metadata: {
    home: {
      title: 'Orque Tools — Calculateurs gratuits pour plongeurs',
      description:
        'Calculateurs gratuits pour plongeurs sous-marins : Nitrox (MOD, EAD, CNS), décompression, flottabilité. Précis, gratuits, sans inscription.',
      ogTitle: 'Orque Tools — Calculateurs gratuits pour plongeurs',
      ogDescription:
        'Calculateurs gratuits pour plongeurs sous-marins : Nitrox, décompression, flottabilité et plus.',
    },
    nitrox: {
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
      ogTitle: 'Calculateur Nitrox — MOD, EAD et Toxicité O\u2082',
      ogDescription:
        'Calculez la profondeur maximale (MOD), EAD, meilleur mélange et toxicité CNS pour vos plongées nitrox.',
    },
  },
  home: {
    badge: 'Gratuit \u00b7 Sans inscription',
    heroTitle: 'Les outils du plongeur',
    heroSubtitle:
      'Calculs Nitrox, planification déco, flottabilité — tout ce dont tu as besoin sur le bateau ou en salle de gonflage.',
    heroCta: 'Essayer le calculateur Nitrox',
    allTools: 'Tous les outils',
    available: 'disponible',
    coming: 'à venir',
    openTool: "Ouvrir l'outil",
    soon: 'Bientôt',
    tools: [
      {
        tag: 'Nitrox',
        title: 'Calculateur Nitrox',
        description:
          "MOD, EAD, meilleur mélange et toxicité CNS. Tout ce qu'il faut pour planifier une plongée enrichie.",
        keywords: ['MOD', 'EAD', 'PPO\u2082', 'CNS', 'EANx'],
      },
      {
        tag: 'Décompression',
        title: 'Planner de décompression',
        description: 'Paliers, temps de remontée, profil de plongée optimisé.',
        keywords: ['paliers déco', 'GF', 'Bühlmann'],
      },
      {
        tag: 'Flottabilité',
        title: 'Calculateur de flottabilité',
        description:
          'Lestage optimal selon ta combinaison, bouteille et équipement.',
        keywords: ['lest', 'flottabilité', 'combinaison'],
      },
      {
        tag: 'Volumes & Pression',
        title: 'Convertisseur volumes & pressions',
        description:
          'Bar, PSI, litres, cu.ft — toutes les conversions plongée.',
        keywords: ['bar', 'psi', 'volume bouteille'],
      },
      {
        tag: 'Devis',
        title: 'Générateur de devis',
        description:
          'Créez et envoyez des devis pros en quelques secondes. Idéal en salon ou en centre pour établir un devis live avec les infos de votre structure.',
        keywords: ['devis', 'salon plongée', 'centre', 'facturation'],
      },
    ],
    asterSubtitle: 'Réservez vos plongées sur',
    asterDescription:
      'La marketplace des expériences de plongée. Trouvez et réservez les meilleures sorties avec des centres certifiés partout dans le monde.',
    asterCta: 'Découvrir Aster',
  },
  nitrox: {
    breadcrumbHome: 'Outils',
    breadcrumbCurrent: 'Nitrox',
    title: 'Calculateur Nitrox',
    subtitle:
      'MOD, EAD, meilleur mélange et toxicité O\u2082 — calculs en temps réel pour planifier vos plongées nitrox en toute sécurité.',
    tabs: {
      calc: 'Calculateur',
      bestmix: 'Meilleur mélange',
      cns: 'Toxicité CNS',
    },
    calc: {
      mixSection: 'Mélange (FO\u2082)',
      fractionLabel: 'Fraction O\u2082',
      ppo2Section: 'PPO\u2082 maximale',
      ppo2Hints: {
        1.2: 'Très conservateur — profils longs ou technique',
        1.4: 'Recommandé pour la plongée loisir',
        1.5: 'Limite recommandée PADI / SSI',
        1.6: 'Maximum absolu NOAA — ne pas maintenir',
      } as Record<number, string>,
      modSection: 'Profondeur maximale',
      modLabel: 'MOD',
      po2AtModLabel: 'PO\u2082 à la MOD',
      modVerification: 'Vérification : FO\u2082 \u00d7 (MOD/10 + 1)',
      depthSection: 'Profondeur prévue',
      depthLabel: 'Profondeur',
      resultsAtDepth: 'Résultats à {depth} m',
      eadLabel: 'EAD (profondeur air équiv.)',
      eadSub: '\u2212{saving} m vs air',
      eadSubAir: "Équivalent à l'air",
      po2AtDepthLabel: 'PO\u2082 à cette profondeur',
      dangerLabel: 'DANGER — dépasse 1.6 bar',
      warningLabel: 'Attention — au-delà de la PPO\u2082 cible',
      safeLabel: 'Dans les limites',
      dangerMsg:
        'La profondeur {depth} m dépasse la MOD de {mod} m. PPO\u2082 = {po2} bar — DANGEREUX.',
      warningMsg:
        'Proche de la MOD — il reste {margin} m de marge. Restez vigilant.',
      safeMsg:
        "Profondeur sûre — {margin} m de marge jusqu'à la MOD.",
    },
    bestmix: {
      paramsSection: 'Paramètres',
      depthLabel: 'Profondeur cible',
      ppo2Label: 'PPO\u2082 cible',
      resultSection: 'Résultat',
      bestMixLabel: 'Meilleur mélange (FO\u2082)',
      bestMixCapped: 'Plafonné à EANx40',
      bestMixMin: 'Minimum : air (21%)',
      bestMixOptimal: 'EANx{mix} — optimal pour {depth} m',
      modLabel: 'MOD de ce mélange',
      modSub: 'Avec PPO\u2082 max {ppo2} bar',
      adviceHigh:
        'EANx{mix} est un mélange très enrichi. Bénéfices décompression optimaux pour {depth} m. Vérifiez la compatibilité O\u2082 de votre équipement.',
      adviceMid:
        'EANx{mix} — bon équilibre enrichissement / disponibilité. Standard pour la plongée tropicale entre 25 et 35 m.',
      adviceLow:
        'EANx{mix} — enrichissement modéré. Pour profiter pleinement du nitrox, envisagez un mélange plus riche si la profondeur le permet.',
      tableSection: 'Tableau de référence — MOD par mélange',
      tableMix: 'Mélange',
      tableMod14: 'MOD 1.4 bar',
      tableMod16: 'MOD 1.6 bar',
      recommended: 'recommandé',
    },
    cns: {
      paramsSection: 'Paramètres de la plongée',
      fo2Label: 'FO\u2082 du mélange',
      depthLabel: 'Profondeur',
      durationLabel: 'Durée de la plongée',
      initialLabel: '% CNS initial',
      resultSection: 'Résultats',
      ppo2Label: 'PPO\u2082 calculée',
      noaaLimitLabel: 'Limite NOAA à cette PPO\u2082',
      noaaOutOfRange: 'Hors table NOAA',
      noaaForPpo2: 'Pour PPO\u2082 = {ppo2} bar',
      cnsTotalLabel: 'CNS total après cette plongée',
      cnsRecommended: '80 % recommandé / jour',
      dangerPpo2Msg:
        "PPO\u2082 dépasse 1.6 bar — hors limites NOAA. Cette profondeur n'est pas plongeable en nitrox avec ce mélange.",
      dangerCnsMsg:
        'CNS total de {cns} % — dépasse 100 %. Risque de convulsions O\u2082. Réduisez la durée ou la profondeur.',
      warningCnsMsg:
        'CNS de {cns} % — proche de la limite journalière recommandée (80 %). Évitez une plongée supplémentaire sans récupération.',
      safeCnsMsg:
        'CNS de {cns} % — dans les limites acceptables. Marge restante : {margin} % avant le seuil de 80 %.',
      noaaTableTitle: "Table NOAA — limites d'exposition",
      noaaTablePpo2: 'PPO\u2082',
      noaaTableLimit: 'Limite unique',
      noaaTableRate: '% CNS / min',
    },
    seo: [
      {
        title: 'Comment calculer la MOD (profondeur maximale) en nitrox ?',
        content:
          "La MOD (Maximum Operating Depth) est la profondeur à ne pas dépasser avec un mélange nitrox donné, pour une PPO\u2082 maximale définie. Elle se calcule avec la formule : MOD = ((PPO\u2082 / FO\u2082) \u2212 1) \u00d7 10. Par exemple, pour un EANx32 avec une PPO\u2082 max de 1,4 bar, la MOD est de ((1,4 / 0,32) \u2212 1) \u00d7 10 = 33,75 m.",
      },
      {
        title: "Qu'est-ce que l'EAD (profondeur air équivalente) ?",
        content:
          "L'EAD (Equivalent Air Depth) est la profondeur sur air qui provoquerait la même narcose et la même charge en azote qu'une plongée nitrox à une profondeur donnée. Plus votre FO\u2082 est élevée, plus l'EAD est réduite — ce qui allonge les temps de non-décompression. Formule : EAD = ((FO\u2082 / 0,21) \u00d7 (P + 10)) \u2212 10.",
      },
      {
        title: 'Toxicité O\u2082 et table NOAA : comprendre le % CNS',
        content:
          "L'exposition prolongée à une PPO\u2082 élevée peut provoquer une toxicité du système nerveux central (CNS), se manifestant par des convulsions. La table NOAA définit des durées maximales d'exposition pour chaque niveau de PPO\u2082. Le % CNS cumulé permet de suivre l'exposition sur une journée de plongée. Il est recommandé de ne pas dépasser 80 % de CNS par jour et 100 % en cumulé.",
      },
      {
        title: 'Quel mélange nitrox choisir pour ma plongée ?',
        content:
          "Le meilleur mélange est celui dont la MOD correspond exactement à votre profondeur cible, pour une PPO\u2082 max choisie. C'est ce qu'on appelle le \"mélange optimal\". Dans la pratique, les plongeurs choisissent entre EANx32 (nitrox 32%) et EANx36 pour la plupart des plongées récifales entre 20 et 35 m. Au-delà de 40 % de FO\u2082, les risques de toxicité oxygène augmentent significativement.",
      },
    ],
    experiences: {
      title: 'Expériences nitrox à réserver',
      subtitle:
        'Plongées et formations nitrox disponibles sur Aster by Orque.',
      viewOnAster: 'Voir sur Aster',
      viewAll: 'Voir toutes les expériences nitrox',
      dives: 'plongées',
    },
    jsonLd: {
      appName: 'Calculateur Nitrox',
      appDescription:
        'Calculateur nitrox gratuit : MOD, EAD, meilleur mélange et toxicité CNS selon la table NOAA.',
      breadcrumbHome: 'Orque Tools',
    },
  },
  disclaimer: {
    title: 'Outil à usage éducatif',
    body1Bold: 'informatif et éducatif uniquement',
    body1:
      "Ce calculateur est fourni à titre informatif et éducatif uniquement. Il ne remplace en aucun cas la formation d'un instructeur certifié, un ordinateur de plongée ou les tables de décompression officielles.",
    body2:
      "Orque ne saurait être tenu responsable de tout incident lié à l'utilisation de ces résultats. Vérifiez systématiquement vos paramètres avant chaque plongée.",
    accept: "J'ai compris",
    sessionNote: "Ce message s'affiche une fois par session.",
  },
  nav: {
    links: [
      { label: 'Nitrox', live: true },
      { label: 'Décompression', live: false },
      { label: 'Flottabilité', live: false },
      { label: 'Devis', live: false },
    ],
    bookDive: 'Réserver une plongée',
    soonBadge: 'Bientôt',
    onAster: 'sur Aster by Orque',
  },
  footer: {
    tagline:
      'Outils gratuits pour plongeurs sous-marins. Réservez vos plongées sur Aster by Orque.',
    sections: {
      company: {
        title: 'Entreprise',
        links: [
          { label: 'À propos' },
          { label: 'Contact' },
          { label: 'Médias' },
          { label: 'Devenir centre partenaire' },
          { label: 'Pourquoi Aster' },
        ],
      },
      support: {
        title: 'Support',
        links: [
          { label: 'FAQ Plongeurs' },
          { label: 'FAQ Centres' },
          { label: 'Nous contacter' },
        ],
      },
      platform: {
        title: 'Plateforme',
        links: [
          { label: 'Expériences' },
          { label: 'Centres de plongée' },
          { label: 'Organiser un voyage' },
          { label: 'Blog' },
        ],
      },
    },
    copyright: '{year} Orque — Les informations fournies sont indicatives.',
    poweredBy: 'Propulsé par',
    socials: {
      facebook: 'Facebook',
      instagram: 'Instagram',
      podcast: 'Podcast Narcose',
    },
  },
}

export default dict
