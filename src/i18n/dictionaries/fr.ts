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
    consumption: {
      title: 'Calcul consommation air plongée : conso surface et autonomie',
      description:
        "Calcule ta consommation d'air en plongée (conso surface en L/min), vois pourquoi elle double dès 10 m et l'autonomie de ton bloc. Gratuit, sans inscription.",
      keywords: [
        'calcul consommation air plongée',
        'calculer sa conso plongée',
        "consommation d'air plongée",
        'consommation surface plongée',
        'conso surface SAC',
        'calculateur SAC plongée',
        'consommation litres par minute plongée',
        'autonomie bloc plongée',
        'calcul autonomie bouteille plongée',
        'consommation air profondeur Mariotte',
        'combien de temps dure une bouteille de plongée',
        'calcul conso plongée niveau 2',
      ],
      ogTitle: "Calcul de consommation d'air en plongée",
      ogDescription:
        "Calcule ta conso surface en L/min, vois pourquoi elle double dès 10 m et combien de minutes dure ton bloc selon la profondeur. Gratuit.",
    },
    gasBlender: {
      title: 'Calcul gonflage nitrox : gas blender pressions partielles',
      description:
        'Calcule ton gonflage nitrox par pressions partielles : O2 pur, tampons en cascade, compresseur. Étapes au manomètre, prof. max. Gratuit, sans inscription.',
      keywords: [
        'calcul gonflage nitrox',
        'gas blender nitrox',
        'calculateur mélange nitrox',
        'gonflage nitrox pression partielle',
        'pression partielle gonflage',
        'gonflage nitrox O2 pur',
        'calcul gonflage nitrox O2 pur air',
        'gonfler un bloc nitrox',
        'gonflage nitrox tampon cascade',
        'fabriquer du nitrox 32',
        'calculateur gonflage plongée',
        'analyse nitrox après gonflage',
      ],
      ogTitle: 'Calcul de gonflage nitrox — Gas blender',
      ogDescription:
        "Bloc, mélange voulu, gaz disponibles : obtiens les étapes de gonflage par pressions partielles, à lire au manomètre à 10 bar près. Gratuit.",
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
        id: 'nitrox',
        tag: 'Nitrox',
        title: 'Calculateur Nitrox',
        description:
          "MOD, EAD, meilleur mélange et toxicité CNS. Tout ce qu'il faut pour planifier une plongée enrichie.",
        keywords: ['MOD', 'EAD', 'PPO\u2082', 'CNS', 'EANx'],
      },
      {
        id: 'decompression',
        tag: 'Décompression',
        title: 'Planner de décompression',
        description: 'Paliers, temps de remontée, profil de plongée optimisé.',
        keywords: ['paliers déco', 'GF', 'Bühlmann'],
      },
      {
        id: 'flottabilite',
        tag: 'Flottabilité',
        title: 'Calculateur de flottabilité',
        description:
          'Lestage optimal selon ta combinaison, bouteille et équipement.',
        keywords: ['lest', 'flottabilité', 'combinaison'],
      },
      {
        id: 'convertisseur',
        tag: 'Pression & Profondeur',
        title: 'Convertisseur Pression & Profondeur',
        description:
          'Conversions instantanées : bar ↔ psi, mètres ↔ pieds, pression absolue ↔ profondeur, eau douce vs salée.',
        keywords: ['bar', 'psi', 'profondeur', 'pression'],
      },
      {
        id: 'consommation',
        tag: 'Consommation',
        title: "Calculateur de consommation d'air",
        description:
          "Calcule ta conso surface (SAC), visualise l'effet de la profondeur et compare l'autonomie de ton bloc.",
        keywords: ['SAC', 'L/min', 'autonomie', 'bloc'],
      },
      {
        id: 'gonflage-nitrox',
        tag: 'Gonflage',
        title: 'Calculateur de gonflage nitrox',
        description:
          "Bloc, mélange voulu et gaz disponibles : les étapes de gonflage par pressions partielles, à lire au manomètre.",
        keywords: ['pressions partielles', 'O2 pur', 'tampons', 'cascade'],
      },
      {
        id: 'volumes',
        tag: 'Volumes & Pression',
        title: 'Convertisseur volumes & pressions',
        description:
          'Bar, PSI, litres, cu.ft — toutes les conversions plongée.',
        keywords: ['bar', 'psi', 'volume bouteille'],
      },
      {
        id: 'devis',
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
  consumption: {
    breadcrumbHome: 'Outils',
    breadcrumbCurrent: 'Consommation',
    title: "Calcul de consommation d'air",
    subtitle:
      "Calcule ta conso surface, vois l'effet de la profondeur et l'autonomie de ton bloc. Outil pédagogique : suis toujours ton manomètre.",
    // Conventions : {nom} = valeur interpolée, **texte** = gras, {link} = bouton vers l'onglet Ma conso.
    /** Locale Intl pour formater les nombres */
    numberLocale: 'fr-FR',
    tablistAria: "Volets de l'outil",
    tabs: { pression: 'Pression', conso: 'Ma conso', auto: 'Autonomie', comp: 'Comparer' },
    units: { lpm: 'L/min', l: 'L', bar: 'bar', min: 'min', m: 'm', s: 's', barPerMin: 'bar/min' },
    /** biTotal : unité sous le volume d'un bi, {total} = volume total */
    stepper: { decrease: 'Diminuer', increase: 'Augmenter', biTotal: 'L × 2 = {total} L' },
    tank: { label: 'Bloc', myTank: 'Mon bloc', mono: 'Mono', bi: 'Bi', biPrefix: '2×', type: 'Type', volume: 'Volume', presets: 'Volumes courants' },
    pressure: {
      sacTitle: 'Ta conso en surface',
      /** {link} = lien vers l'onglet Ma conso (texte : hintLink) */
      hint: "Pas d'idée ? Calcule‑la dans {link}. Valeur moyenne : 15 à 20 L/min.",
      hintLink: 'Ma conso',
      columnAria: 'Profondeur : glisse pour descendre',
      kicker: 'À {depth} m, chaque inspiration coûte',
      multiplierNote: "plus d'air qu'en surface",
      statPressure: 'Pression',
      statConso: 'Ta conso',
      statTank: 'Bloc 12 L · 200 bar vidé en',
      surface: 'Surface',
      trapTitle: 'Le piège des premiers mètres',
      trapNote: 'Entre 0 et 10 m, la pression passe de 1 à 2 bar : ta conso **double**. Entre 30 et 40 m, elle passe de 4 à 5 bar : **+25 %** seulement. Touche une barre.',
      /** Rappel de la règle de pression, sous le piège des premiers mètres */
      pressureRule: '**1 bar** en surface (le poids de l\'air), puis **+1 bar tous les 10 m** d\'eau. À 10 m : 2 bar, à 20 m : 3 bar, à 40 m : 5 bar.',
      /** {depth} {p} : loi de Boyle-Mariotte sous le multiplicateur */
      law: 'pression × volume = constante. À {depth} m tu es à **{p} bar** : l\'air est {p} fois plus comprimé, donc chaque inspiration (même volume de poumons) contient **{p} fois plus d\'air** qu\'en surface.',
    },
    conso: {
      title: 'Ma dernière plongée',
      startPressure: 'Pression départ',
      endPressure: 'Pression sortie',
      duration: 'Durée',
      avgDepth: 'Profondeur moyenne',
      resultKicker: 'Ta conso ramenée en surface',
      levels: { veryCalm: 'Très zen', calm: 'Calme', average: 'Dans la moyenne', high: 'Soutenue', veryHigh: 'Élevée' },
      statUsed: 'Gaz respiré',
      statAvgPressure: 'Pression moy.',
      statBottom: 'Conso au fond',
      errorEndPressure: 'La pression de sortie doit être inférieure à la pression de départ.',
      /** {pressure} */
      reserveWarning: 'Sortie à {pressure} bar : réserve entamée.',
      useButton: 'Utiliser cette conso partout →',
      law: 'au fond, chaque inspiration contient plus d\'air, donc ton bloc se vide plus vite. Pour comparer tes plongées entre elles, on ramène ta conso à la surface : **conso surface = conso au fond ÷ pression**.',
    },
    autonomy: {
      infoTitle: 'Simulation pédagogique, pas un planificateur',
      infoText:
        "Le calcul vide le bloc jusqu'à **0 bar**, sans réserve, sans remontée ni palier : ce n'est pas la réalité d'une plongée. Le but est de voir comment l'autonomie évolue selon la profondeur, le bloc et ta conso.",
      depthTitle: 'Profondeur',
      startPressure: 'Pression départ',
      sac: 'Ma conso surface',
      /** {depth} */
      gaugeTitle: 'Ton autonomie à {depth} m',
      gaugeCaption: "jusqu'à 0 bar",
      /** {depth} {p} */
      law: 'à {depth} m (**{p} bar**), tu respires {p} fois plus d\'air qu\'en surface : ton bloc dure **{p} fois moins longtemps**.',
      statBottom: 'Conso au fond',
      statBar: '1 bar dure',
      statRate: 'Le mano baisse de',
      barsTitle: "Le même bloc à d'autres profondeurs",
      barsNote: "Minutes jusqu'à 0 bar. Touche une barre.",
      /** Symbole des minutes sur les barres */
      minuteMark: '′',
      /** Note discrète sous l'autonomie (limite du modèle gaz parfait) */
      idealGasNote: 'Comme en formation, on considère l\'air comme un gaz parfait : en réalité, un bloc à 200-300 bar contient un peu moins d\'air.',
    },
    compare: {
      settingsTitle: 'Mes réglages',
      sac: 'Ma conso surface',
      startPressure: 'Pression départ',
      abTitle: 'Deux profondeurs, même bloc',
      depthA: 'Profondeur A',
      depthB: 'Profondeur B',
      sameDepth: 'Choisis deux profondeurs différentes.',
      /** {lo} = profondeur la plus pénalisante, {hi} = l'autre, {diff} = minutes, {ratio} */
      diff: "À {lo} m : **{diff} min** de moins qu'à {hi} m, soit **{ratio}× moins**",
      /** {tank} {pressure} {sac} */
      diffSub: 'avec {tank} à {pressure} bar et {sac} L/min',
      otherTanksTitle: 'Et avec un autre bloc ?',
      tableTitle: "Tableau minutes jusqu'à 0 bar",
      law: 'l\'autonomie est divisée par la pression. À 10 m (2 bar), ton bloc dure **2 fois moins** qu\'en surface ; à 30 m (4 bar), **4 fois moins**.',
    },
    footnote:
      'Les règles utilisées sont celles des cours de plongée. Pression : 1 bar en surface, +1 bar tous les 10 m. Loi de Boyle-Mariotte : pression × volume = constante, donc ta conso au fond = conso surface × pression. Air contenu dans le bloc = volume × pression (12 L à 200 bar = 2 400 L). Autonomie simulée = air du bloc ÷ conso au fond, jusqu\'à 0 bar, sans réserve ni remontée. Valeurs indicatives : le froid, l\'effort et le stress augmentent la conso.',
    faq: {
      title: 'Questions fréquentes',
      items: [
        {
          q: "Comment calculer sa consommation d'air en plongée ?",
          a: "Multiplie le volume du bloc par les bars consommés pour obtenir les litres respirés, puis divise par la durée et par la pression absolue moyenne (1 + profondeur moyenne ÷ 10). Exemple : bloc 12 L de 200 à 50 bar = 1 800 L, en 40 min à 15 m de moyenne (2,5 bar) : 1 800 ÷ (40 × 2,5) = 18 L/min en surface.",
        },
        {
          q: "Quelle est une consommation d'air normale en plongée ?",
          a: "La plupart des plongeurs loisir ont une conso surface de 15 à 20 L/min. Sous 12 L/min, c'est très calme ; au-delà de 25 L/min, c'est élevé, souvent à cause du froid, de l'effort, du stress ou d'un lestage mal réglé. Elle varie d'une plongée à l'autre : mesure-la sur plusieurs plongées.",
        },
        {
          q: "Pourquoi consomme-t-on deux fois plus d'air à 10 m ?",
          a: "À 10 m, la pression absolue vaut 2 bar : chaque inspiration, de même volume pour tes poumons, contient deux fois plus d'air (loi de Mariotte). Ta conso au fond est donc ta conso surface × 2. De 0 à 10 m la conso double, alors que de 30 à 40 m (4 à 5 bar) elle n'augmente que de 25 %.",
        },
        {
          q: 'Combien de temps dure un bloc de 12 litres en plongée ?',
          a: "Un bloc de 12 L à 200 bar contient environ 2 400 L d'air. Avec une conso surface de 20 L/min et en le vidant jusqu'à 0 bar : 120 min en surface, 40 min à 20 m, 24 min à 40 m. En plongée réelle, tu gardes une réserve (souvent 50 bar) et du gaz pour remonter : à 20 m, 150 bar utilisables ne font plus que 30 min.",
        },
        {
          q: 'Quelle différence entre conso surface (SAC) et conso au fond ?',
          a: "La conso surface est ramenée à 1 bar : elle te caractérise et se compare d'une plongée à l'autre. La conso au fond est ce que tu respires réellement à la profondeur, soit conso surface × pression absolue : avec 18 L/min en surface, tu respires 45 L/min à 15 m. En anglais, on parle de SAC rate ou de RMV.",
        },
      ],
    },
    /** Texte du lien vers le convertisseur, inséré à la place de {converter} dans seo */
    /** Titres des rappels de loi (affichés en gras devant le texte) */
    law: { title: 'Loi de Boyle-Mariotte :', pressureTitle: 'La pression en plongée :' },
    learnMore: 'Comprendre ma consommation',
    seoConverterLink: 'convertisseur pression/profondeur',
    seo: [
      {
        title: "Comment mesurer sa consommation d'air",
        content:
          "Note la pression au départ et à la sortie, la durée et la profondeur moyenne (ton ordinateur l'affiche). L'onglet Ma conso calcule le gaz respiré (volume × bars consommés) puis le divise par la durée et la pression moyenne. Choisis une plongée au profil régulier et refais la mesure sur plusieurs plongées : un manomètre se lit à quelques bars près, et la conso change avec le froid, l'effort ou le stress.",
      },
      {
        title: 'Pourquoi ta conso double dès 10 m',
        content:
          'En surface, tu supportes déjà 1 bar : le poids de l\'air. Sous l\'eau, chaque tranche de 10 m ajoute 1 bar : 2 bar à 10 m, 3 bar à 20 m, 5 bar à 40 m. C\'est la loi de Boyle-Mariotte : pression × volume = constante. Quand la pression double, l\'air est deux fois plus comprimé. Tes poumons, eux, gardent le même volume : à chaque inspiration, ils se remplissent donc de deux fois plus d\'air. Entre 0 et 10 m, la pression passe de 1 à 2 bar et ta conso double ; entre 30 et 40 m, elle passe de 4 à 5 bar et ta conso n\'augmente que de 25 %. Pour passer de la profondeur à la pression en eau douce ou salée, utilise le {converter}.',
      },
      {
        title: "Lire l'autonomie et le manomètre",
        content:
          'Ton bloc contient son volume multiplié par sa pression : un 12 L gonflé à 200 bar renferme 2 400 L d\'air détendu. À 20 m (3 bar), tu respires 3 fois plus qu\'en surface : avec 20 L/min en surface, tu consommes 60 L/min. Le bloc tiendrait donc 2 400 ÷ 60 = 40 min jusqu\'à 0 bar. Sur ton manomètre, cela fait 5 bar par minute, soit 1 bar toutes les 12 secondes. Ce chiffre sert à comparer profondeurs et blocs, pas à fixer la durée de ta plongée.',
      },
      {
        title: "Limites : ce n'est pas un planificateur",
        content:
          "Le calcul vide le bloc jusqu'à 0 bar, sans réserve, sans remontée ni palier. Il traite l'air comme un gaz parfait : à haute pression, un bloc contient un peu moins d'air que volume × pression (environ 4 % de moins à 200 bar, près de 10 % à 300 bar), donc l'autonomie affichée est légèrement optimiste. Prépare tes plongées avec ton ordinateur, ta palanquée et les règles de ta formation, et suis ton manomètre.",
      },
    ],
    jsonLd: {
      appName: "Calculateur de consommation d'air",
      appDescription:
        "Calculateur gratuit de consommation d'air en plongée : conso surface (SAC) en L/min à partir d'une plongée, effet de la profondeur et autonomie simulée du bloc.",
      breadcrumbHome: 'Orque Tools',
    },
  },
  gasBlender: {
    breadcrumbHome: 'Outils',
    breadcrumbCurrent: 'Gonflage nitrox',
    title: 'Calcul de gonflage nitrox',
    subtitle:
      "Indique ton bloc, le mélange voulu et les gaz que tu as : l'outil te donne les étapes de gonflage, lecture manomètre à 10 bar près.",
    learnMore: 'Comprendre le gonflage nitrox',
    /** Texte du lien vers le calculateur nitrox, inséré à la place de {nitrox} dans seo */
    seoNitroxLink: 'calculateur nitrox',
    seo: [
      {
        title: 'Le principe : des pressions partielles qui s\'additionnent',
        content:
          "Dans un bloc, chaque gaz exerce sa part de la pression totale : c'est la loi de Dalton. Un bloc d'air à 200 bar contient 21 % d'oxygène, soit 42 bar d'O2 et 158 bar d'azote. Gonfler un nitrox par pressions partielles, c'est ajouter les gaz l'un après l'autre en surveillant le manomètre : on met juste ce qu'il faut d'oxygène, puis on complète avec de l'air pour arriver au bon pourcentage. Exemple : un 12 L contenant encore 50 bar d'air, + 30 bar d'O2 pur (jusqu'à 80 bar), puis de l'air jusqu'à 200 bar, donne environ 32,9 % d'O2. L'outil essaie toutes les combinaisons de tes gaz et te propose le plan recommandé, avec le moins d'O2 pur possible.",
      },
      {
        title: "Pourquoi l'O2 pur passe en premier, et lentement",
        content:
          "L'oxygène pur sous pression est un comburant puissant : une trace de graisse ou une montée en pression trop rapide peut suffire à provoquer un feu. On le met donc en premier, quand le bloc est encore à basse pression, puis on complète à l'air, ce qui aide aussi le mélange à s'homogénéiser. Un bloc qui reçoit de l'O2 pur doit être dégraissé et compatible O2, robinet compris, même si le mélange final n'est qu'un Nx32 ; au-delà de 40 % d'O2, le détendeur aussi. Ouvre doucement : le gaz chauffe en se comprimant, et la pression baisse quand le bloc refroidit. Laisse-le reposer, puis complète si besoin.",
      },
      {
        title: 'Tampons, cascade et compresseur',
        content:
          "Un tampon (une grosse bouteille de nitrox, d'air ou d'O2) ne pousse pas le gaz : il s'équilibre avec ton bloc jusqu'à ce que les deux aient la même pression. Plus le tampon est gros et plein, plus il peut faire monter ton bloc. Avec plusieurs tampons du même gaz, on les ouvre en cascade, du moins rempli au plus rempli : chacun s'équilibre à son tour et l'on tire bien plus de gaz qu'en les ouvrant tous ensemble. Le compresseur, lui, peut monter jusqu'à sa pression maximale. L'outil vérifie que chaque tampon a assez de pression et de volume, et te dit combien de blocs identiques tu pourras encore gonfler.",
      },
      {
        title: 'Lecture à 10 bar, analyse et profondeur max',
        content:
          "Un manomètre de plongée ne se lit pas plus finement qu'à 10 bar près : l'outil arrondit chaque étape à 10 bar et recalcule le mélange réellement obtenu, avec une tolérance de 2 points de % O2. Le calcul suppose des gaz parfaits et une température constante : il ne remplace pas l'analyse. Une fois le bloc refroidi, analyse-le toujours à l'analyseur d'oxygène et note sur l'étiquette le % mesuré et la profondeur max. Celle-ci découle de la ppO2 : 1,4 bar en plongée, 1,6 bar au maximum. Avec un Nx32, ppO2 1,4 donne 33 m. Pour la MOD, l'EAD et la toxicité CNS de ton mélange, utilise le {nitrox}.",
      },
    ],
    faq: {
      title: 'Questions fréquentes',
      items: [
        {
          q: 'Comment calculer un gonflage nitrox par pressions partielles ?',
          a: "Calcule la pression à ajouter (pression finale − pression restante) et l'oxygène que doit contenir ce gaz ajouté (% voulu × pression finale − % restant × pression restante). Avec deux gaz, par exemple O2 pur et air, on en déduit combien de bar de chacun mettre. L'outil fait ce calcul pour toutes tes combinaisons de gaz, arrondit à 10 bar pour le manomètre et vérifie le mélange obtenu.",
        },
        {
          q: "Combien d'O2 pur faut-il pour faire un Nx32 ?",
          a: "Cela dépend de ce qui reste dans le bloc. Pour un 12 L contenant 50 bar d'air, gonflé à 200 bar en Nx32 : environ 30 bar d'O2 pur (jusqu'à 80 bar), puis de l'air jusqu'à 200 bar, soit environ 32,9 % d'O2. Pour un bloc vide, il faut environ 28 bar d'O2 pur, arrondis à 30 bar au manomètre, puis de l'air jusqu'à 200 bar.",
        },
        {
          q: "Pourquoi met-on l'oxygène pur avant l'air ?",
          a: "Par sécurité : l'O2 pur est injecté à basse pression, ce qui limite l'échauffement et le risque de feu dans le robinet et le bloc. Compléter ensuite à l'air brasse le gaz et aide le mélange à s'homogénéiser. Le bloc doit malgré tout être dégraissé et compatible O2, et le remplissage doit rester lent.",
        },
        {
          q: "Qu'est-ce qu'un gonflage en cascade ?",
          a: "Quand tu as plusieurs tampons du même gaz, tu les ouvres l'un après l'autre, du moins rempli au plus rempli. Chacun s'équilibre avec ton bloc et le fait monter un peu plus. Tu récupères ainsi plus de gaz qu'en ouvrant tous les tampons ensemble, et tu gardes un tampon bien plein pour la fin.",
        },
        {
          q: 'Faut-il analyser un bloc nitrox après le gonflage ?',
          a: "Oui, toujours. Le calcul suppose des gaz parfaits et une lecture du manomètre à 10 bar près : le mélange réel peut s'écarter d'un ou deux points. Laisse refroidir le bloc, analyse-le à l'analyseur d'oxygène et note sur l'étiquette le % mesuré et la profondeur max à ppO2 1,4. Si l'écart est trop grand, l'outil propose une correction : vider jusqu'à une pression donnée puis recompléter.",
        },
        {
          q: 'Quelle profondeur maximale pour mon nitrox ?',
          a: "Divise la ppO2 maximale par la fraction d'O2 pour obtenir la pression absolue limite, puis enlève 1 bar et compte 10 m par bar. Avec un Nx32 à ppO2 1,4 : 1,4 ÷ 0,32 = 4,375 bar, soit 33 m en arrondissant vers le bas ; à ppO2 1,6 : 40 m. L'outil l'affiche pour le mélange réellement attendu, puis pour le % analysé.",
        },
      ],
    },
    jsonLd: {
      appName: 'Calculateur de gonflage nitrox',
      appDescription:
        "Calculateur gratuit de gonflage air et nitrox par pressions partielles : étapes à lire au manomètre avec O2 pur, tampons en cascade ou compresseur, vérification des stocks, profondeur max et analyse finale.",
      breadcrumbHome: 'Orque Tools',
    },
    // Conventions : {nom} = valeur interpolée, **texte** = gras, `texte` = formule.
    /** Locale Intl pour formater les nombres */
    numberLocale: 'fr-FR',
    tablistAria: 'Étapes',
    tabs: { melange: 'Mélange', stocks: 'Stocks', plan: 'Plan' },
    units: { bar: 'bar', l: 'L', litres: 'litres', m: 'm', pctO2: '% O2', pct: '%', blocks: 'bloc(s)' },
    stepper: { decrease: 'Moins', increase: 'Plus' },
    tank: {
      title: 'Tes blocs',
      help: 'Un bloc seul ou une rampe de blocs identiques gonflés ensemble. Pression restante : celle de chaque bloc, rampe ouverte. Bloc vide : mets 0 bar.',
      volume: "Volume d'un bloc",
      count: 'Nombre de blocs',
      countAria: 'Nombre de blocs sur la rampe',
      pressure: 'Pression restante',
      o2: '% O2 restant',
      quickEmpty: 'Bloc vide',
      quickAir: "Reste d'air",
      quickSame: 'Reste du même mélange',
      quickTitle: 'Raccourcis',
    },
    mix: {
      title: 'Mélange voulu',
      help: 'Choisis un nitrox courant ou règle le % à la main. Sous chaque mélange : sa profondeur max à ppO2 1,4.',
      presetsTitle: 'Nitrox courants · prof. max à ppO2 1,4',
      /** {m} = % O2 du raccourci */
      shortcut: 'Nx{m}',
      shortcutMod: '{mod} m',
      o2: '% O2 voulu',
      pressure: 'Pression finale',
    },
    /** Rappels physiques discrets (LawNote), formulés comme en cours de plongée. */
    laws: {
      modTitle: 'Profondeur max :',
      /** {m} = % O2 voulu, {p} = pression absolue où la ppO2 atteint 1,4, {mod} = profondeur max */
      mod: "1 bar en surface, puis +1 bar tous les 10 m. La ppO2, c'est la pression absolue × le % d'O2 : avec **{m} %** d'O2, elle atteint 1,4 à **{p} bar**, soit **{mod} m**.",
      daltonTitle: 'Loi de Dalton :',
      dalton: "la pression d'un mélange est la somme des pressions de ses gaz. Chaque couche ajoutée fait monter le manomètre de sa part, et le % final dépend de l'O2 de toutes les couches.",
      equalTitle: 'Équilibrage :',
      equal: "un tampon ouvert sur ton bloc s'y vide jusqu'à ce que les deux aient la même pression, comme des vases communicants. Il ne peut donc pas monter ton bloc plus haut que sa propre pression.",
      analysisTitle: 'Pourquoi analyser :',
      analysis: "le gaz chauffe en se comprimant et la pression retombe en refroidissant : le mélange réel s'écarte toujours un peu du calcul. Seul le % mesuré fixe la profondeur max de l'étiquette.",
    },
    gases: {
      title: 'Gaz disponibles',
      help: "Tes tampons et ton compresseur. Nombre : bouteilles identiques (ex. 3 B50 de Nx36). Le volume sert à vérifier qu'il reste assez de gaz ; laisse-le vide pour un compresseur.",
      nameAria: 'Nom du gaz',
      o2: 'Oxygène',
      pressure: 'Pression',
      pressureMax: 'Pression max',
      volume: 'Volume',
      count: 'Nombre',
      /** Unité sous le champ Nombre */
      bottles: 'unité(s)',
      addTitle: 'Ajouter un gaz',
      countAria: 'Nombre de tampons identiques',
      kindContinuous: 'source continue',
      kindBuffer: 'tampon',
      kindCascade: '{n} tampons en cascade',
      kindTogether: '{n} tampons ensemble',
      opening: 'Ouverture',
      cascade: 'En cascade',
      together: 'Tous ensemble',
      remove: 'Retirer',
      add: 'Ajouter :',
      addO2: '+ O2 pur',
      addNx: '+ Tampon nitrox',
      addAir: '+ Tampon air',
      addComp: '+ Compresseur',
      reset: 'Remettre les valeurs par défaut',
      /** Noms donnés aux gaz ajoutés (modifiables ensuite) */
      defaults: { o2: 'O2 pur', nx: 'Tampon nitrox', airb: 'Tampon air', comp: 'Compresseur' },
      /** Nom d'un gaz laissé sans nom, {f} = % O2 */
      unnamed: 'Gaz {f} %',
      /** Bouteilles de même nom dans une cascade */
      numbered: '{name} n°{n}',
      /** Nom suivi de son % O2 (étapes) */
      withPct: '{name} {f} %',
    },
    cta: {
      button: 'Voir le plan',
      defaultSub: 'Plan de gonflage',
      result: '{p} bar à {mix}',
      sub: 'Plan · {steps}',
      subBleed: 'Plan · vidange + {steps}',
      steps1: '{n} étape',
      stepsN: '{n} étapes',
      reduced: ' · cible non atteinte',
      incomplete: 'Données incomplètes',
      nothing: 'Rien à ajouter',
      none: 'Aucune solution avec ces stocks',
    },
    errors: {
      incomplete: 'Renseigne le bloc et le mélange voulu.',
      range: 'Les % O2 doivent être entre 0 et 100.',
      noGas: 'Ajoute au moins un gaz disponible (étape 3).',
    },
    plan: {
      title: 'Plan de gonflage',
      help: "Suis les étapes dans l'ordre en lisant le manomètre du bloc, puis analyse le mélange.",
      nothing: 'Rien à ajouter : le bloc est déjà au mélange et à la pression voulus.',
      impossible: "Impossible d'atteindre {p} bar à {mix} avec ces stocks.",
      bestHint: 'Au mieux : **{p} bar** à {mix}, plan ci-dessous.',
      noneHint: "Il manque un gaz assez riche, ou les tampons n'ont pas assez de pression ou de volume.",
      kickerGood: 'Plan recommandé',
      kickerOff: 'Meilleur plan possible',
      titleBleed: 'Vidange + {title}',
      titleBleedOnly: 'Vidange seule',
      join: ' + ',
      target: '{p} bar · cible {target}',
      modLine: 'Prof. max **{mod} m** à ppO2 1,4',
      resultLabel: 'Mélange obtenu',
      statPressure: 'Pression',
      statTarget: 'Cible',
      statTargetOk: 'Cible ✓',
      statMod: 'Prof. max ppO2 1,4',
      compO2: 'O2 {v} %',
      compN2: 'N2 {v} %',
      compCaption: 'Composition finale du bloc',
      compCaptionRamp: 'Composition finale de chaque bloc',
      tankAria: 'Remplissage du bloc',
      legendRamp: 'Rampe ×{n}',
      legendResidual: 'Déjà dans le bloc',
      bleedBlock: 'Vidanger le bloc',
      bleedRamp: 'Vidanger la rampe',
      bleedMeta: 'Purger doucement',
      upTo: "jusqu'à",
      fillUpTo: "remplir jusqu'à",
      stepMeta: '+{bar} bar · bloc à {mix}',
      stepRest: ' · tampon : reste {rest} bar',
      cascade: 'Cascade : {list}',
      cascadeSep: ' puis ',
      cascadeItem: '{name} ({p} bar)',
      tight: "Limite d'équilibrage : transfert lent, peut ne pas atteindre {p} bar.",
      noteDev: 'Écart de plus de 2 points de % O2 avec la cible (lecture à 10 bar).',
      noteO2: 'O2 pur : matériel dégraissé, compatible O2.',
      noteSlow: 'Remplis lentement : le bloc chauffe et sa pression baisse en refroidissant. Laisse refroidir, complète si besoin, puis analyse.',
    },
    stocks: {
      title: 'Tes stocks',
      help: 'Chaque gaz a-t-il assez de pression et de volume pour ce gonflage ?',
      ignored1: '{n} gaz ignoré : complète son % O2 et sa pression (champ en rouge).',
      ignoredN: '{n} gaz ignorés : complète son % O2 et sa pression (champ en rouge).',
      status: {
        unlimited: 'Illimité',
        enough: 'Assez',
        tight: 'Juste',
        last: 'Dernier gonflage',
        low: 'Assez, stock bas',
        enoughAfterBleed: 'Assez après vidange',
        enoughFor: 'Assez pour {p} bar',
        notEnough: 'Pas assez',
        unused: 'Non utilisé',
      },
      /** Pastille d'un tampon dans « Autres options » */
      pillOk: 'OK',
      toBlock: 'au bloc',
      toEach: 'à chaque bloc',
      givesContinuous: 'Donne **+{bar} bar** {to} · max {max} bar',
      givesBuffer: "Donne **+{bar} bar** {to} (jusqu'à {gauge} bar)",
      memberLine: '{who} **{before} → {after} bar**',
      memberEnsemble: '{k} tampons ensemble',
      memberSingle: 'Tampon',
      cascade: 'Cascade : {list}',
      again0Block: 'Pas assez pour un autre bloc identique',
      again0Ramp: 'Pas assez pour une autre rampe identique',
      againBlock1: 'Encore {n} bloc identique',
      againBlockN: 'Encore {n} blocs identiques',
      againRamp1: 'Encore {n} rampe de {nb} blocs',
      againRampN: 'Encore {n} rampes de {nb} blocs',
      missingReduced: 'Pour {p} bar il faudrait {req} bar',
      missingBleed: 'Sans vidange il faudrait {req} bar',
      shortageMulti: '{name} : il en a **{has} bar**, il en faudrait **{req} bar**',
      shortageSingle: 'Il en a **{has} bar**, il en faudrait **{req} bar**',
      shortageLimit: 'Le bloc monterait au mieux à {limit} bar au lieu de {need}',
      unusedMulti: '{name} : {p} bar · {vol} L',
      unusedEnsemble: '{k} tampons ensemble à {p} bar · {k} × {unit} L',
      unusedSingle: 'Tampon à {p} bar · {vol} L',
      unusedComp: 'Compresseur · max {p} bar',
      altTitle: 'Stock des tampons',
      altLine: '{before} → {after} bar · {again}',
    },
    summary: {
      title: 'En bref',
      help: "Le gaz à mettre dans le bloc, dont l'O2 pur, et la profondeur max du mélange obtenu.",
      bleed: "Vider jusqu'à",
      bleedValue: '{p} bar',
      bleedThen: '−{d} bar, puis ajouter le gaz',
      bleedOnly: "−{d} bar, rien d'autre à faire",
      add: 'À ajouter',
      addValue: '+{bar} bar',
      addPerBlock: 'par bloc, ',
      addWithO2: "dont +{o2} bar d'O2 pur",
      addNoO2: 'sans O2 pur',
      addTotal: 'tous gaz confondus',
      drain: 'À vider',
      drainValue: '{bar} bar',
      drainSub: 'le bloc est trop plein',
      litres: 'Pour les {n} blocs',
      litresValue: '≈ {l} L',
      litresItem: '{name} : {l} L',
      sep: ' · ',
      mod: 'Profondeur max',
      modValue: '{m} m',
      modSub: 'à ppO2 1,4 · {m16} m à ppO2 1,6',
      modExpected: ' · pour {mix} attendus',
      alert: 'Attention',
      alertValue: '> 40 % O2',
      alertSub: 'bloc et détendeur compatibles O2',
    },
    analysis: {
      title: 'Analyse finale',
      help: "Une fois le bloc refroidi, analyse-le et saisis le % mesuré : c'est lui qui compte pour la profondeur max.",
      field: '% O2 analysé',
      ramp: 'Rampe : analyse chaque bloc, ils doivent tous donner le même %.',
      invalid: "Valeur d'analyse invalide.",
      status: { ok: 'Conforme', richMid: 'Un peu riche', leanMid: 'Un peu pauvre', richLow: 'Trop riche', leanLow: 'Trop pauvre' },
      gap1: 'Écart {d} point de % O2 avec la cible {target}',
      gapN: 'Écart {d} points de % O2 avec la cible {target}',
      labelTitle: 'Étiquette',
      labelMod: 'prof. max {m14} m à ppO2 1,4 · {m16} m à ppO2 1,6',
      verdictTitle: 'Verdict',
      mod14: 'Prof. max ppO2 1,4',
      mod16: 'Prof. max ppO2 1,6',
      fixTitle: 'Pour revenir à {target}',
      fixBleedBlock: "Vider le bloc jusqu'à **{p} bar**",
      fixBleedRamp: "Vider la rampe jusqu'à **{p} bar**",
      fixStep: "{gas} jusqu'à **{p} bar**",
      fixResult: 'Résultat attendu ≈ {mix}, puis réanalyser. Ou garde le bloc tel quel et étiquette-le à {label}.',
      fixNone: 'Pas de correction possible avec ces gaz : étiquette le bloc à {label}.',
    },
    alts: {
      title: 'Autres options',
      help: "D'autres combinaisons possibles avec tes gaz, classées après le plan recommandé.",
      withO2: " · +{o2} bar d'O2 pur",
      noO2: ' · sans O2 pur',
    },
    rejected: {
      title: 'Combinaisons écartées',
      alreadyAbove: 'Bloc déjà au-dessus de la pression voulue',
      notRichEnough: 'Pas assez riche en O2',
      tooRich: 'Trop riche : il faudrait un gaz à {mix} ou moins',
      gapTooSmall: 'Écart trop faible pour le manomètre',
      bufferShort: '{name} insuffisant : il faudrait {req} bar dans {where} (il en a {has})',
      whereOne: 'le tampon',
      whereMany: 'les tampons',
      continuousShort: '{name} limité à {max} bar, il faut {need} bar',
    },
    /** Note « Comment c'est calculé » (partie pédagogique de la page, texte brut sans balisage). */
    howTitle: "Comment c'est calculé",
    how: [
      {
        title: 'Ce qu\'il faut ajouter',
        text: "On part de deux besoins : les bar à ajouter (pression finale − pression restante) et l'oxygène que doit contenir ce gaz ajouté (% voulu × pression finale − % restant × pression restante). Cet oxygène est celui de tout le gaz ajouté, air et nitrox compris : ce n'est pas la quantité d'O2 pur à mettre. Le volume du bloc ne change pas le mélange, seulement ce que les tampons peuvent fournir.",
      },
      {
        title: 'Deux gaz, deux inconnues',
        text: "Avec deux gaz (par exemple O2 pur et air), on cherche combien de bar de chacun donnent à la fois la bonne pression et la bonne quantité d'oxygène : c'est la méthode du tableur d'origine, généralisée. La solution n'est valable que si les deux quantités sont positives. L'outil essaie toutes les paires de tes gaz, et chaque gaz seul.",
      },
      {
        title: 'Arrondi au manomètre',
        text: "La pression intermédiaire est arrondie à 10 bar, vers le haut ou vers le bas selon ce qui donne le mélange le plus proche de la cible, puis le mélange final est recalculé. Le plan est retenu s'il reste à moins de 2 points de % O2 de la cible.",
      },
      {
        title: 'Tampons et équilibrage',
        text: "Un tampon s'équilibre avec le bloc : la pression finale commune est la moyenne des deux pressions, pondérée par les volumes. Le tampon perd autant de litres que le bloc en gagne, donc sa pression baisse d'autant moins qu'il est gros. Une étape est dite « juste » si l'équilibrage s'arrête à moins de 10 bar de la pression visée.",
      },
      {
        title: 'Cascade ou tous ensemble',
        text: "Plusieurs bouteilles identiques ouvertes en cascade, l'une après l'autre du moins rempli au plus rempli, s'équilibrent chacune à leur tour avec le bloc : c'est ce qui tire le plus de gaz. Ouvertes tous ensemble, elles se comportent comme un seul gros tampon.",
      },
      {
        title: 'Rampe de blocs',
        text: "Plusieurs blocs identiques reliés se calculent comme un seul bloc de volume total : les pressions au manomètre ne changent pas, seul ce que les tampons doivent fournir est multiplié par le nombre de blocs.",
      },
      {
        title: 'Choix du plan recommandé',
        text: "D'abord dans la tolérance, puis sans O2 pur, puis avec le moins d'O2 pur, puis le plus proche de la cible. Si rien ne marche, l'outil propose de vider le bloc par pas de 10 bar, sinon la pression maximale atteignable au bon mélange.",
      },
      {
        title: 'Limites',
        text: "Gaz parfaits, sans correction de température : le mélange réel peut s'écarter du calcul. Analyse toujours le bloc refroidi avant de plonger.",
      },
    ],
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
      { id: 'nitrox', label: 'Nitrox', live: true },
      { id: 'convertisseur', label: 'Convertisseur', live: true },
      { id: 'consommation', label: 'Consommation', live: true },
      { id: 'gonflage-nitrox', label: 'Gonflage', live: true },
      { id: 'decompression', label: 'Décompression', live: false },
      { id: 'flottabilite', label: 'Flottabilité', live: false },
      { id: 'devis', label: 'Devis', live: false },
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
