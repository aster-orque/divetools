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
    convertisseur: {
      title: 'Convertisseur Pression & Profondeur — Bar, PSI, Mètres, Pieds',
      description:
        'Convertisseur pression-profondeur gratuit pour plongeurs : bar ↔ psi, mètres ↔ pieds, pression absolue ↔ profondeur, eau douce vs eau salée. Calculs instantanés, sans inscription.',
      keywords: [
        'convertisseur pression plongée',
        'bar psi conversion',
        'profondeur pression absolue',
        'pression eau salée plongée',
        'convertisseur mètres pieds plongée',
        'pression hydrostatique plongée',
        'calculateur profondeur bar',
        'pression relative plongée',
        'conversion unités plongée',
        'table pression profondeur',
      ],
      ogTitle: 'Convertisseur Pression & Profondeur — Plongée',
      ogDescription:
        'Conversions instantanées pression ↔ profondeur : bar, psi, mètres, pieds. Eau douce vs salée, pression absolue et relative.',
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
        tag: 'Pression & Profondeur',
        title: 'Convertisseur Pression & Profondeur',
        description:
          'Conversions instantanées : bar ↔ psi, mètres ↔ pieds, pression absolue ↔ profondeur, eau douce vs salée.',
        keywords: ['bar', 'psi', 'profondeur', 'pression'],
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
  converter: {
    breadcrumbHome: 'Outils',
    breadcrumbCurrent: 'Convertisseur',
    title: 'Convertisseur Pression & Profondeur',
    subtitle:
      'Conversions instantanées : bar ↔ psi, mètres ↔ pieds, pression absolue ↔ profondeur, eau douce vs eau salée.',
    tabs: {
      converter: 'Convertisseur',
      comparison: 'Comparaison',
      table: 'Table',
    },
    prefs: {
      depth: 'Profondeur',
      pressure: 'Pression',
      temperature: 'Température',
      both: 'Les deux',
    },
    model: {
      label: 'Modèle de calcul',
      theory: 'Simplifié',
      salt: 'Eau de mer',
      fresh: 'Eau douce',
      theoryNote:
        'Mode simplifié : P_atm arrondie à 1 bar et densité eau de mer simplifiée. Suffisant pour la plongée loisir (écart < 1 % à 30 m).',
    },
    conv: {
      depthToPressure: 'Profondeur → Pression',
      depthLabel: 'Profondeur',
      pressureAbs: 'Pression absolue',
      pressureRel: 'Pression relative',
      formulaLabel: 'Formule appliquée',
      formulaTheory: 'P_abs = profondeur ÷ 10 + 1',
      formulaSalt: 'P_abs = profondeur ÷ 10 + 1,013',
      formulaFresh: 'P_abs = profondeur ÷ 10,3 + 1,013',
      pressureToDepth: 'Pression → Profondeur',
      pressureLabel: 'Pression absolue',
      depthResult: 'Profondeur équivalente',
      quickRule: 'Règle rapide : psi ÷ 15 ≈ bar',
      swap: '⇄',
    },
    comparison: {
      sliderLabel: 'Profondeur de comparaison',
      theoryCard: 'Simplifié',
      saltCard: 'Eau de mer',
      freshCard: 'Eau douce',
      synthesis:
        'À {depth} m, l\'écart entre le modèle simplifié et l\'eau de mer est de {deltaSalt} bar — {verdict}.',
      negligible: 'négligeable en plongée loisir',
      notable: 'notable pour la planification technique',
      tableTitle: 'Comparaison par profondeur',
      colDepth: 'Profondeur',
      colTheory: 'Simplifié',
      colSalt: 'Eau de mer',
      colFresh: 'Eau douce',
    },
    table: {
      title: 'Table de référence',
      colM: 'm',
      colFt: 'ft',
      colTheory: 'Simplifié (bar)',
      colSalt: 'Eau salée (bar)',
      colFresh: 'Eau douce (bar)',
      colPsi: 'psi',
    },
    glossary: {
      title: 'Glossaire',
      terms: [
        {
          term: 'Mode simplifié',
          definition:
            'Modèle pédagogique où la pression atmosphérique est arrondie à 1 bar et la densité de l\'eau de mer simplifiée. Écart < 1 % à 30 m par rapport au modèle réel.',
        },
        {
          term: 'Pression absolue',
          definition:
            'Pression totale subie par le plongeur : pression atmosphérique + pression de la colonne d\'eau. C\'est la valeur utilisée dans la loi de Boyle.',
        },
        {
          term: 'Pression relative',
          definition:
            'Pression de la seule colonne d\'eau, sans la pression atmosphérique. P_rel = P_abs − P_atm.',
        },
        {
          term: 'Bar',
          definition:
            'Unité de pression métrique. 1 bar ≈ pression atmosphérique au niveau de la mer. 1 bar = 14,5038 psi.',
        },
        {
          term: 'PSI (pound per square inch)',
          definition:
            'Unité de pression impériale. 1 psi = 0,0689 bar. Utilisée principalement en Amérique du Nord et sur les manomètres impériaux.',
        },
        {
          term: 'Eau salée vs eau douce',
          definition:
            'L\'eau salée (densité ≈ 1025 kg/m³) exerce plus de pression que l\'eau douce (1000 kg/m³) à même profondeur. 10 m d\'eau salée ≈ 1,006 bar ; 10 m d\'eau douce ≈ 0,981 bar.',
        },
        {
          term: 'Loi de Boyle-Mariotte',
          definition:
            'À température constante, le volume d\'un gaz est inversement proportionnel à sa pression : P × V = constante. Fondamentale pour comprendre les variations de volume en plongée.',
        },
      ],
    },
    faq: {
      title: 'Questions fréquentes',
      items: [
        {
          q: 'Quelle pression subit-on à 30 mètres de profondeur ?',
          a: 'À 30 m en eau de mer, la pression absolue est d\'environ 4,013 bar (soit ≈ 58,2 psi). En mode simplifié, on obtient 4,000 bar — l\'écart est inférieur à 1 %.',
        },
        {
          q: 'Pourquoi la pression diffère-t-elle entre eau douce et eau salée ?',
          a: 'L\'eau salée a une densité d\'environ 1025 kg/m³ contre 1000 kg/m³ pour l\'eau douce. À profondeur égale, la colonne d\'eau salée est plus lourde et exerce donc plus de pression.',
        },
        {
          q: 'Comment convertir des bar en psi ?',
          a: 'Multipliez la valeur en bar par 14,5038. Exemple : 200 bar × 14,5038 = 2 900,8 psi. Règle rapide : psi ÷ 15 ≈ bar.',
        },
        {
          q: 'Qu\'est-ce que la pression relative en plongée ?',
          a: 'La pression relative (ou pression manométrique) est la pression exercée uniquement par la colonne d\'eau, sans tenir compte de la pression atmosphérique. À 10 m, elle vaut environ 1 bar.',
        },
        {
          q: 'Le modèle simplifié est-il suffisant pour la plongée loisir ?',
          a: 'Oui. L\'écart entre le modèle simplifié (P_atm = 1 bar, diviseur 10) et le modèle réel eau de mer est inférieur à 1 % jusqu\'à 40 m. Les tables de plongée utilisent généralement cette approximation.',
        },
        {
          q: 'Comment estimer la température au fond ?',
          a: 'Au-dessus de la thermocline (~15 m), la température baisse lentement (≈ 0,1 °C/m). En-dessous, la chute s\'accélère (≈ 0,3 °C/m). Le minimum physiologique est d\'environ 4 °C en profondeur.',
        },
      ],
    },
    seo: [
      {
        title: 'Comment calculer la pression absolue en plongée ?',
        content:
          'La pression absolue en plongée se calcule en ajoutant la pression atmosphérique à la pression hydrostatique. En mode simplifié : P_abs = profondeur ÷ 10 + 1 bar. En eau de mer : P_abs = profondeur ÷ 10 + 1,013 bar. En eau douce : P_abs = profondeur ÷ 10,3 + 1,013 bar. À 30 m en eau de mer, on obtient 4,013 bar soit environ 58,2 psi.',
      },
      {
        title: 'Quelle est la différence entre pression absolue et pression relative ?',
        content:
          'La pression absolue inclut la pression atmosphérique (≈ 1,013 bar au niveau de la mer) plus la pression de la colonne d\'eau. La pression relative ne mesure que la pression exercée par l\'eau. Pour un plongeur à 20 m en eau de mer : P_abs ≈ 3,013 bar, P_rel ≈ 2,000 bar.',
      },
      {
        title: 'Pourquoi la pression varie-t-elle entre eau douce et eau salée ?',
        content:
          'La densité de l\'eau salée (≈ 1025 kg/m³) est supérieure à celle de l\'eau douce (1000 kg/m³). Cette différence fait qu\'à même profondeur, la pression est légèrement plus élevée en mer. À 10 m : eau salée ≈ 2,019 bar, eau douce ≈ 1,984 bar.',
      },
      {
        title: 'Comment convertir bar en psi et inversement ?',
        content:
          'La conversion exacte est 1 bar = 14,5038 psi. Pour convertir des bar en psi, multipliez par 14,5038. Pour l\'inverse, divisez par 14,5038 (ou multipliez par 0,0689476). Astuce mnémotechnique : psi ÷ 15 ≈ bar, pratique sur le bateau.',
      },
    ],
    jsonLd: {
      appName: 'Convertisseur Pression & Profondeur',
      appDescription:
        'Convertisseur pression-profondeur gratuit : bar ↔ psi, mètres ↔ pieds, pression absolue ↔ profondeur, eau douce vs eau salée.',
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
      { label: 'Convertisseur', live: true },
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
