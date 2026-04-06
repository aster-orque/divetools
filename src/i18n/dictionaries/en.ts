const dict = {
  metadata: {
    home: {
      title: 'Orque Tools — Free Calculators for Divers',
      description:
        'Free calculators for scuba divers: Nitrox (MOD, EAD, CNS), decompression, buoyancy. Accurate, free, no sign-up required.',
      ogTitle: 'Orque Tools — Free Calculators for Divers',
      ogDescription:
        'Free calculators for scuba divers: Nitrox, decompression, buoyancy and more.',
    },
    convertisseur: {
      title: 'Pressure & Depth Converter — Bar, PSI, Metres, Feet',
      description:
        'Free pressure-depth converter for divers: bar ↔ psi, metres ↔ feet, absolute pressure ↔ depth, fresh vs salt water. Instant calculations, no sign-up.',
      keywords: [
        'pressure depth converter diving',
        'bar psi conversion',
        'depth absolute pressure',
        'salt water pressure diving',
        'metres feet converter diving',
        'hydrostatic pressure diving',
        'depth bar calculator',
        'gauge pressure diving',
        'dive unit conversion',
        'pressure depth table',
      ],
      ogTitle: 'Pressure & Depth Converter — Diving',
      ogDescription:
        'Instant pressure ↔ depth conversions: bar, psi, metres, feet. Fresh vs salt water, absolute and gauge pressure.',
    },
    nitrox: {
      title: 'Nitrox Calculator — MOD, EAD, Best Mix & CNS',
      description:
        'Free nitrox calculator: compute Maximum Operating Depth (MOD), Equivalent Air Depth (EAD), best mix for your dive and CNS oxygen toxicity from the NOAA table. Online tool, no sign-up required.',
      keywords: [
        'nitrox calculator',
        'MOD nitrox calculator',
        'maximum operating depth nitrox',
        'EAD dive calculator',
        'best nitrox mix',
        'CNS oxygen toxicity diving',
        'NOAA dive table',
        'enriched air nitrox diving',
        'EANx calculator',
        'ppO2 nitrox diving',
        'free nitrox dive calculator',
      ],
      ogTitle: 'Nitrox Calculator — MOD, EAD & O\u2082 Toxicity',
      ogDescription:
        'Calculate Maximum Operating Depth (MOD), EAD, best mix and CNS toxicity for your nitrox dives.',
    },
  },
  home: {
    badge: 'Free \u00b7 No sign-up',
    heroTitle: 'The diver\u2019s toolkit',
    heroSubtitle:
      'Nitrox calculations, deco planning, buoyancy \u2014 everything you need on the boat or at the fill station.',
    heroCta: 'Try the Nitrox calculator',
    allTools: 'All tools',
    available: 'available',
    coming: 'coming soon',
    openTool: 'Open tool',
    soon: 'Coming soon',
    tools: [
      {
        tag: 'Nitrox',
        title: 'Nitrox Calculator',
        description:
          'MOD, EAD, best mix and CNS toxicity. Everything you need to plan an enriched air dive.',
        keywords: ['MOD', 'EAD', 'PPO\u2082', 'CNS', 'EANx'],
      },
      {
        tag: 'Decompression',
        title: 'Decompression Planner',
        description:
          'Deco stops, ascent time, optimised dive profile.',
        keywords: ['deco stops', 'GF', 'B\u00fchlmann'],
      },
      {
        tag: 'Buoyancy',
        title: 'Buoyancy Calculator',
        description:
          'Optimal weighting for your wetsuit, tank and gear.',
        keywords: ['weight', 'buoyancy', 'wetsuit'],
      },
      {
        tag: 'Pressure & Depth',
        title: 'Pressure & Depth Converter',
        description:
          'Instant conversions: bar ↔ psi, metres ↔ feet, absolute pressure ↔ depth, fresh vs salt water.',
        keywords: ['bar', 'psi', 'depth', 'pressure'],
      },
      {
        tag: 'Volumes & Pressure',
        title: 'Volume & Pressure Converter',
        description:
          'Bar, PSI, litres, cu.ft \u2014 every dive conversion you need.',
        keywords: ['bar', 'psi', 'tank volume'],
      },
      {
        tag: 'Quotes',
        title: 'Quote Generator',
        description:
          'Create and send professional quotes in seconds. Perfect at dive shows or in the shop to build a live quote with your centre\u2019s details.',
        keywords: ['quote', 'dive show', 'centre', 'invoicing'],
      },
    ],
    asterSubtitle: 'Book your dives on',
    asterDescription:
      'The marketplace for dive experiences. Find and book the best outings with certified centres worldwide.',
    asterCta: 'Discover Aster',
  },
  nitrox: {
    breadcrumbHome: 'Tools',
    breadcrumbCurrent: 'Nitrox',
    title: 'Nitrox Calculator',
    subtitle:
      'MOD, EAD, best mix and O\u2082 toxicity \u2014 real-time calculations to plan your nitrox dives safely.',
    tabs: {
      calc: 'Calculator',
      bestmix: 'Best Mix',
      cns: 'CNS Toxicity',
    },
    calc: {
      mixSection: 'Mix (FO\u2082)',
      fractionLabel: 'O\u2082 Fraction',
      ppo2Section: 'Maximum PPO\u2082',
      ppo2Hints: {
        1.2: 'Very conservative \u2014 long profiles or technical diving',
        1.4: 'Recommended for recreational diving',
        1.5: 'PADI / SSI recommended limit',
        1.6: 'NOAA absolute maximum \u2014 do not sustain',
      } as Record<number, string>,
      modSection: 'Maximum Operating Depth',
      modLabel: 'MOD',
      po2AtModLabel: 'PO\u2082 at MOD',
      modVerification: 'Verification: FO\u2082 \u00d7 (MOD/10 + 1)',
      depthSection: 'Planned depth',
      depthLabel: 'Depth',
      resultsAtDepth: 'Results at {depth} m',
      eadLabel: 'EAD (Equivalent Air Depth)',
      eadSub: '\u2212{saving} m vs air',
      eadSubAir: 'Equivalent to air',
      po2AtDepthLabel: 'PO\u2082 at this depth',
      dangerLabel: 'DANGER \u2014 exceeds 1.6 bar',
      warningLabel: 'Caution \u2014 beyond target PPO\u2082',
      safeLabel: 'Within limits',
      dangerMsg:
        'Depth {depth} m exceeds the MOD of {mod} m. PPO\u2082 = {po2} bar \u2014 DANGEROUS.',
      warningMsg:
        'Close to MOD \u2014 {margin} m of margin remaining. Stay alert.',
      safeMsg:
        'Safe depth \u2014 {margin} m of margin to the MOD.',
    },
    bestmix: {
      paramsSection: 'Parameters',
      depthLabel: 'Target depth',
      ppo2Label: 'Target PPO\u2082',
      resultSection: 'Result',
      bestMixLabel: 'Best mix (FO\u2082)',
      bestMixCapped: 'Capped at EANx40',
      bestMixMin: 'Minimum: air (21%)',
      bestMixOptimal: 'EANx{mix} \u2014 optimal for {depth} m',
      modLabel: 'MOD for this mix',
      modSub: 'At PPO\u2082 max {ppo2} bar',
      adviceHigh:
        'EANx{mix} is a highly enriched mix. Optimal decompression benefits for {depth} m. Check the O\u2082 compatibility of your equipment.',
      adviceMid:
        'EANx{mix} \u2014 good balance between enrichment and availability. Standard for tropical diving between 25 and 35 m.',
      adviceLow:
        'EANx{mix} \u2014 moderate enrichment. To get the full benefits of nitrox, consider a richer mix if the depth allows.',
      tableSection: 'Reference table \u2014 MOD by mix',
      tableMix: 'Mix',
      tableMod14: 'MOD 1.4 bar',
      tableMod16: 'MOD 1.6 bar',
      recommended: 'recommended',
    },
    cns: {
      paramsSection: 'Dive parameters',
      fo2Label: 'Mix FO\u2082',
      depthLabel: 'Depth',
      durationLabel: 'Dive duration',
      initialLabel: 'Initial CNS %',
      resultSection: 'Results',
      ppo2Label: 'Calculated PPO\u2082',
      noaaLimitLabel: 'NOAA limit at this PPO\u2082',
      noaaOutOfRange: 'Outside NOAA table',
      noaaForPpo2: 'For PPO\u2082 = {ppo2} bar',
      cnsTotalLabel: 'Total CNS after this dive',
      cnsRecommended: '80% recommended / day',
      dangerPpo2Msg:
        'PPO\u2082 exceeds 1.6 bar \u2014 outside NOAA limits. This depth is not diveable on nitrox with this mix.',
      dangerCnsMsg:
        'Total CNS of {cns}% \u2014 exceeds 100%. Risk of O\u2082 convulsions. Reduce duration or depth.',
      warningCnsMsg:
        'CNS of {cns}% \u2014 close to the recommended daily limit (80%). Avoid an additional dive without recovery.',
      safeCnsMsg:
        'CNS of {cns}% \u2014 within acceptable limits. Remaining margin: {margin}% before the 80% threshold.',
      noaaTableTitle: 'NOAA table \u2014 exposure limits',
      noaaTablePpo2: 'PPO\u2082',
      noaaTableLimit: 'Single limit',
      noaaTableRate: '% CNS / min',
    },
    seo: [
      {
        title: 'How to calculate MOD (Maximum Operating Depth) on nitrox?',
        content:
          'The MOD (Maximum Operating Depth) is the deepest you can go with a given nitrox mix at a defined maximum PPO\u2082. It is calculated using the formula: MOD = ((PPO\u2082 / FO\u2082) \u2212 1) \u00d7 10. For example, for an EANx32 with a max PPO\u2082 of 1.4 bar, the MOD is ((1.4 / 0.32) \u2212 1) \u00d7 10 = 33.75 m.',
      },
      {
        title: 'What is EAD (Equivalent Air Depth)?',
        content:
          'EAD (Equivalent Air Depth) is the depth on air that would produce the same narcosis and nitrogen loading as a nitrox dive at a given depth. The higher your FO\u2082, the lower the EAD \u2014 which extends no-decompression limits. Formula: EAD = ((FO\u2082 / 0.21) \u00d7 (P + 10)) \u2212 10.',
      },
      {
        title: 'O\u2082 toxicity and the NOAA table: understanding CNS %',
        content:
          'Prolonged exposure to high PPO\u2082 can cause central nervous system (CNS) toxicity, manifesting as convulsions. The NOAA table defines maximum exposure durations for each PPO\u2082 level. Cumulative CNS % lets you track exposure over a day of diving. It is recommended not to exceed 80% CNS per day and 100% cumulatively.',
      },
      {
        title: 'Which nitrox mix should I choose for my dive?',
        content:
          'The best mix is the one whose MOD exactly matches your target depth at a chosen max PPO\u2082. This is known as the "optimal mix". In practice, divers choose between EANx32 (nitrox 32%) and EANx36 for most reef dives between 20 and 35 m. Beyond 40% FO\u2082, oxygen toxicity risks increase significantly.',
      },
    ],
    experiences: {
      title: 'Nitrox experiences to book',
      subtitle:
        'Nitrox dives and courses available on Aster by Orque.',
      viewOnAster: 'View on Aster',
      viewAll: 'See all nitrox experiences',
      dives: 'dives',
    },
    jsonLd: {
      appName: 'Nitrox Calculator',
      appDescription:
        'Free nitrox calculator: MOD, EAD, best mix and CNS toxicity from the NOAA table.',
      breadcrumbHome: 'Orque Tools',
    },
  },
  converter: {
    breadcrumbHome: 'Tools',
    breadcrumbCurrent: 'Converter',
    title: 'Pressure & Depth Converter',
    subtitle:
      'Instant conversions: bar \u2194 psi, metres \u2194 feet, absolute pressure \u2194 depth, fresh vs salt water.',
    tabs: {
      converter: 'Converter',
      comparison: 'Comparison',
      table: 'Table',
    },
    prefs: {
      depth: 'Depth',
      pressure: 'Pressure',
      temperature: 'Temperature',
      both: 'Both',
    },
    model: {
      label: 'Calculation model',
      theory: 'Simplified',
      salt: 'Sea water',
      fresh: 'Fresh water',
      theoryNote:
        'Simplified mode: P_atm rounded to 1 bar and simplified sea water density. Sufficient for recreational diving (error < 1% at 30 m).',
    },
    conv: {
      depthToPressure: 'Depth \u2192 Pressure',
      depthLabel: 'Depth',
      pressureAbs: 'Absolute pressure',
      pressureRel: 'Gauge pressure',
      formulaLabel: 'Formula used',
      formulaTheory: 'P_abs = depth \u00f7 10 + 1',
      formulaSalt: 'P_abs = depth \u00f7 10 + 1.013',
      formulaFresh: 'P_abs = depth \u00f7 10.3 + 1.013',
      pressureToDepth: 'Pressure \u2192 Depth',
      pressureLabel: 'Absolute pressure',
      depthResult: 'Equivalent depth',
      quickRule: 'Quick rule: psi \u00f7 15 \u2248 bar',
      swap: '\u21c4',
    },
    comparison: {
      sliderLabel: 'Comparison depth',
      theoryCard: 'Simplified',
      saltCard: 'Sea water',
      freshCard: 'Fresh water',
      synthesis:
        'At {depth} m, the difference between simplified and sea water is {deltaSalt} bar \u2014 {verdict}.',
      negligible: 'negligible for recreational diving',
      notable: 'notable for technical dive planning',
      tableTitle: 'Comparison by depth',
      colDepth: 'Depth',
      colTheory: 'Simplified',
      colSalt: 'Sea water',
      colFresh: 'Fresh water',
    },
    table: {
      title: 'Reference table',
      colM: 'm',
      colFt: 'ft',
      colTheory: 'Simplified (bar)',
      colSalt: 'Salt water (bar)',
      colFresh: 'Fresh water (bar)',
      colPsi: 'psi',
    },
    glossary: {
      title: 'Glossary',
      terms: [
        {
          term: 'Simplified mode',
          definition:
            'Educational model where atmospheric pressure is rounded to 1 bar and sea water density is simplified. Error < 1% at 30 m compared to the real model.',
        },
        {
          term: 'Absolute pressure',
          definition:
            'Total pressure experienced by the diver: atmospheric pressure + water column pressure. This is the value used in Boyle\u2019s law.',
        },
        {
          term: 'Gauge pressure',
          definition:
            'Pressure from the water column only, excluding atmospheric pressure. P_gauge = P_abs \u2212 P_atm.',
        },
        {
          term: 'Bar',
          definition:
            'Metric pressure unit. 1 bar \u2248 atmospheric pressure at sea level. 1 bar = 14.5038 psi.',
        },
        {
          term: 'PSI (pound per square inch)',
          definition:
            'Imperial pressure unit. 1 psi = 0.0689 bar. Primarily used in North America and on imperial gauges.',
        },
        {
          term: 'Salt water vs fresh water',
          definition:
            'Salt water (density \u2248 1025 kg/m\u00b3) exerts more pressure than fresh water (1000 kg/m\u00b3) at the same depth. 10 m salt water \u2248 1.006 bar; 10 m fresh water \u2248 0.981 bar.',
        },
        {
          term: 'Boyle\u2019s law',
          definition:
            'At constant temperature, the volume of a gas is inversely proportional to its pressure: P \u00d7 V = constant. Fundamental for understanding volume changes while diving.',
        },
      ],
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        {
          q: 'What pressure do you experience at 30 metres depth?',
          a: 'At 30 m in sea water, absolute pressure is approximately 4.013 bar (\u2248 58.2 psi). In simplified mode, you get 4.000 bar \u2014 the difference is less than 1%.',
        },
        {
          q: 'Why does pressure differ between fresh and salt water?',
          a: 'Salt water has a density of approximately 1025 kg/m\u00b3 versus 1000 kg/m\u00b3 for fresh water. At the same depth, the salt water column is heavier and therefore exerts more pressure.',
        },
        {
          q: 'How do you convert bar to psi?',
          a: 'Multiply the bar value by 14.5038. Example: 200 bar \u00d7 14.5038 = 2,900.8 psi. Quick rule: psi \u00f7 15 \u2248 bar.',
        },
        {
          q: 'What is gauge pressure in diving?',
          a: 'Gauge (or relative) pressure is the pressure exerted by the water column alone, without accounting for atmospheric pressure. At 10 m, it is approximately 1 bar.',
        },
        {
          q: 'Is the simplified model accurate enough for recreational diving?',
          a: 'Yes. The difference between the simplified model (P_atm = 1 bar, divisor 10) and the real sea water model is less than 1% down to 40 m. Most dive tables use this approximation.',
        },
        {
          q: 'How can you estimate the temperature at depth?',
          a: 'Above the thermocline (\u223c15 m), temperature drops slowly (\u2248 0.1 \u00b0C/m). Below, the drop accelerates (\u2248 0.3 \u00b0C/m). The physiological minimum is around 4 \u00b0C at depth.',
        },
      ],
    },
    seo: [
      {
        title: 'How to calculate absolute pressure when diving?',
        content:
          'Absolute pressure in diving is calculated by adding atmospheric pressure to hydrostatic pressure. Simplified: P_abs = depth \u00f7 10 + 1 bar. Sea water: P_abs = depth \u00f7 10 + 1.013 bar. Fresh water: P_abs = depth \u00f7 10.3 + 1.013 bar. At 30 m in sea water, you get 4.013 bar or approximately 58.2 psi.',
      },
      {
        title: 'What is the difference between absolute and gauge pressure?',
        content:
          'Absolute pressure includes atmospheric pressure (\u2248 1.013 bar at sea level) plus the water column pressure. Gauge pressure only measures the pressure exerted by the water. For a diver at 20 m in sea water: P_abs \u2248 3.013 bar, P_gauge \u2248 2.000 bar.',
      },
      {
        title: 'Why does pressure vary between fresh and salt water?',
        content:
          'Salt water density (\u2248 1025 kg/m\u00b3) is higher than fresh water (1000 kg/m\u00b3). This means that at the same depth, pressure is slightly higher in salt water. At 10 m: salt water \u2248 2.019 bar, fresh water \u2248 1.984 bar.',
      },
      {
        title: 'How to convert bar to psi and back?',
        content:
          'The exact conversion is 1 bar = 14.5038 psi. To convert bar to psi, multiply by 14.5038. For the reverse, divide by 14.5038 (or multiply by 0.0689476). Mnemonic tip: psi \u00f7 15 \u2248 bar, handy on the boat.',
      },
    ],
    jsonLd: {
      appName: 'Pressure & Depth Converter',
      appDescription:
        'Free pressure-depth converter: bar \u2194 psi, metres \u2194 feet, absolute pressure \u2194 depth, fresh vs salt water.',
      breadcrumbHome: 'Orque Tools',
    },
  },
  disclaimer: {
    title: 'Educational tool',
    body1Bold: 'informational and educational purposes only',
    body1:
      'This calculator is provided for informational and educational purposes only. It is not a substitute for training from a certified instructor, a dive computer or official decompression tables.',
    body2:
      'Orque cannot be held responsible for any incident related to the use of these results. Always verify your parameters before each dive.',
    accept: 'I understand',
    sessionNote: 'This message is displayed once per session.',
  },
  nav: {
    links: [
      { label: 'Nitrox', live: true },
      { label: 'Converter', live: true },
      { label: 'Decompression', live: false },
      { label: 'Buoyancy', live: false },
      { label: 'Quotes', live: false },
    ],
    bookDive: 'Book a dive',
    soonBadge: 'Coming soon',
    onAster: 'on Aster by Orque',
  },
  footer: {
    tagline:
      'Free tools for scuba divers. Book your dives on Aster by Orque.',
    sections: {
      company: {
        title: 'Company',
        links: [
          { label: 'About' },
          { label: 'Contact' },
          { label: 'Media' },
          { label: 'Become a partner centre' },
          { label: 'Why Aster' },
        ],
      },
      support: {
        title: 'Support',
        links: [
          { label: 'Diver FAQ' },
          { label: 'Centre FAQ' },
          { label: 'Contact us' },
        ],
      },
      platform: {
        title: 'Platform',
        links: [
          { label: 'Experiences' },
          { label: 'Dive centres' },
          { label: 'Plan a trip' },
          { label: 'Blog' },
        ],
      },
    },
    copyright: '{year} Orque \u2014 Information provided is indicative only.',
    poweredBy: 'Powered by',
    socials: {
      facebook: 'Facebook',
      instagram: 'Instagram',
      podcast: 'Narcose Podcast',
    },
  },
}

export default dict
