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
    consumption: {
      title: 'SAC Rate Calculator — Scuba Air Consumption & Gas Time',
      description:
        'Work out your scuba SAC rate in L/min from your last dive, see why it doubles at 10 m and how long your cylinder lasts at depth. Free, no sign-up.',
      keywords: [
        'SAC rate calculator',
        'air consumption calculator scuba',
        'surface air consumption calculator',
        'how to calculate SAC rate',
        'RMV calculator diving',
        'scuba gas consumption litres per minute',
        'how long does a scuba tank last',
        'scuba tank air time calculator',
        'air consumption at depth',
        "Boyle's law air consumption diving",
        'cylinder gas time calculator',
        'SAC rate for beginner divers',
      ],
      ogTitle: 'SAC Rate Calculator — Scuba Air Consumption',
      ogDescription:
        'Work out your SAC rate in L/min, see why it doubles at 10 m and how many minutes your cylinder lasts at each depth. Free.',
    },
    gasBlender: {
      title: 'Nitrox Blending Calculator — Partial Pressure Gas Blender',
      description:
        'Plan your nitrox fill by partial pressure blending: pure O2, cascaded banks, compressor. Gauge steps to 10 bar, MOD at ppO2 1.4. Free, no sign-up.',
      keywords: [
        'nitrox blending calculator',
        'partial pressure blending',
        'gas blender calculator',
        'partial pressure blending calculator',
        'nitrox gas blending',
        'how to blend nitrox',
        'nitrox fill calculator',
        'pure oxygen top up air nitrox',
        'cascade blending nitrox',
        'EAN32 blending',
        'scuba gas blending calculator',
        'nitrox analysis after filling',
      ],
      ogTitle: 'Nitrox Blending Calculator — Gas Blender',
      ogDescription:
        'Cylinder, target mix, available gases: get partial pressure blending steps to read on the gauge to the nearest 10 bar. Free.',
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
        id: 'nitrox',
        tag: 'Nitrox',
        title: 'Nitrox Calculator',
        description:
          'MOD, EAD, best mix and CNS toxicity. Everything you need to plan an enriched air dive.',
        keywords: ['MOD', 'EAD', 'PPO\u2082', 'CNS', 'EANx'],
      },
      {
        id: 'decompression',
        tag: 'Decompression',
        title: 'Decompression Planner',
        description:
          'Deco stops, ascent time, optimised dive profile.',
        keywords: ['deco stops', 'GF', 'B\u00fchlmann'],
      },
      {
        id: 'flottabilite',
        tag: 'Buoyancy',
        title: 'Buoyancy Calculator',
        description:
          'Optimal weighting for your wetsuit, tank and gear.',
        keywords: ['weight', 'buoyancy', 'wetsuit'],
      },
      {
        id: 'convertisseur',
        tag: 'Pressure & Depth',
        title: 'Pressure & Depth Converter',
        description:
          'Instant conversions: bar ↔ psi, metres ↔ feet, absolute pressure ↔ depth, fresh vs salt water.',
        keywords: ['bar', 'psi', 'depth', 'pressure'],
      },
      {
        id: 'consommation',
        tag: 'Air consumption',
        title: 'Air Consumption Calculator',
        description:
          'Work out your SAC rate, see how depth affects your air consumption and compare how long your cylinder lasts.',
        keywords: ['SAC', 'L/min', 'gas time', 'cylinder'],
      },
      {
        id: 'gonflage-nitrox',
        tag: 'Gas blending',
        title: 'Nitrox Blending Calculator',
        description:
          'Cylinder, target mix and available gases: partial pressure blending steps to read on the gauge.',
        keywords: ['partial pressure', 'pure O2', 'banks', 'cascade'],
      },
      {
        id: 'volumes',
        tag: 'Volumes & Pressure',
        title: 'Volume & Pressure Converter',
        description:
          'Bar, PSI, litres, cu.ft \u2014 every dive conversion you need.',
        keywords: ['bar', 'psi', 'tank volume'],
      },
      {
        id: 'devis',
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
  consumption: {
    breadcrumbHome: 'Tools',
    breadcrumbCurrent: 'Air consumption',
    title: 'Air Consumption Calculator',
    subtitle:
      'Work out your SAC rate, see how depth affects it and how long your cylinder lasts. Teaching tool: always keep an eye on your pressure gauge.',
    // Conventions: {name} = interpolated value, **text** = bold, {link} = button to the My SAC tab.
    /** Intl locale used to format numbers */
    numberLocale: 'en-US',
    tablistAria: 'Tool panels',
    tabs: { pression: 'Pressure', conso: 'My SAC', auto: 'Gas time', comp: 'Compare' },
    units: { lpm: 'L/min', l: 'L', bar: 'bar', min: 'min', m: 'm', s: 's', barPerMin: 'bar/min' },
    /** biTotal: unit shown under a twinset volume, {total} = total volume */
    stepper: { decrease: 'Decrease', increase: 'Increase', biTotal: 'L × 2 = {total} L' },
    tank: { label: 'Cylinder', myTank: 'My cylinder', mono: 'Single', bi: 'Twinset', biPrefix: '2×', type: 'Type', volume: 'Volume', presets: 'Common sizes' },
    pressure: {
      sacTitle: 'Your surface air consumption',
      /** {link} = link to the My SAC tab (text: hintLink) */
      hint: 'No idea? Work it out in {link}. Typical SAC rate: 15 to 20 L/min.',
      hintLink: 'My SAC',
      columnAria: 'Depth: drag to descend',
      kicker: 'At {depth} m, every breath costs',
      multiplierNote: 'more air than at the surface',
      statPressure: 'Pressure',
      statConso: 'Your consumption',
      statTank: '12 L · 200 bar cylinder emptied in',
      surface: 'Surface',
      trapTitle: 'The shallow-water trap',
      trapNote: 'From 0 to 10 m, pressure goes from 1 to 2 bar: your consumption **doubles**. From 30 to 40 m, it goes from 4 to 5 bar: only **+25%**. Tap a bar.',
      pressureRule: '**1 bar** at the surface (the weight of the air), then **+1 bar every 10 m** of water. At 10 m: 2 bar, at 20 m: 3 bar, at 40 m: 5 bar.',
      law: 'pressure × volume = constant. At {depth} m you are at **{p} bar**: the air is {p} times more compressed, so each breath (same lung volume) holds **{p} times more air** than at the surface.',
    },
    conso: {
      title: 'My last dive',
      startPressure: 'Start pressure',
      endPressure: 'End pressure',
      duration: 'Duration',
      avgDepth: 'Average depth',
      resultKicker: 'Your surface air consumption (SAC rate)',
      levels: { veryCalm: 'Very relaxed', calm: 'Calm', average: 'Average', high: 'Above average', veryHigh: 'High' },
      statUsed: 'Gas used',
      statAvgPressure: 'Avg. pressure',
      statBottom: 'Bottom consumption',
      errorEndPressure: 'End pressure must be lower than start pressure.',
      /** {pressure} */
      reserveWarning: 'Surfaced with {pressure} bar: you dipped into your reserve.',
      useButton: 'Use this SAC rate everywhere →',
      law: 'at depth, each breath holds more air, so your cylinder empties faster. To compare dives, consumption is brought back to the surface: **SAC rate = bottom consumption ÷ pressure**.',
    },
    autonomy: {
      infoTitle: 'Teaching simulation, not a dive planner',
      infoText:
        'The calculation empties the cylinder down to **0 bar**, with no reserve, no ascent and no stops: that is not what a real dive looks like. The goal is to see how gas time changes with depth, cylinder and your SAC rate.',
      depthTitle: 'Depth',
      startPressure: 'Start pressure',
      sac: 'My SAC rate',
      gaugeTitle: 'Your gas time at {depth} m',
      gaugeCaption: 'down to 0 bar',
      law: 'at {depth} m (**{p} bar**), you breathe {p} times more air than at the surface, so your cylinder lasts **{p} times less**.',
      statBottom: 'Bottom consumption',
      statBar: '1 bar lasts',
      statRate: 'Gauge drops by',
      barsTitle: 'The same cylinder at other depths',
      barsNote: 'Minutes to 0 bar. Tap a bar.',
      /** Minute symbol on the bars */
      minuteMark: '′',
      /** Discreet note under gas time (ideal-gas model limit) */
      idealGasNote: 'As taught in dive training, air is treated as an ideal gas: in reality, a cylinder at 200–300 bar holds slightly less air.',
    },
    compare: {
      settingsTitle: 'My settings',
      sac: 'My SAC rate',
      startPressure: 'Start pressure',
      abTitle: 'Two depths, same cylinder',
      depthA: 'Depth A',
      depthB: 'Depth B',
      sameDepth: 'Pick two different depths.',
      /** {lo} = depth with less gas time, {hi} = the other one, {diff} = minutes, {ratio} */
      diff: "At {lo} m: **{diff} min** less than at {hi} m, that's **{ratio}× less**",
      /** {tank} {pressure} {sac} */
      diffSub: 'with {tank} at {pressure} bar and {sac} L/min',
      otherTanksTitle: 'What about another cylinder?',
      tableTitle: 'Minutes to 0 bar table',
      law: 'gas time is divided by the pressure. At 10 m (2 bar) your cylinder lasts **half as long** as at the surface; at 30 m (4 bar), **a quarter as long**.',
    },
    footnote:
      'These are the rules taught in dive training. Pressure: 1 bar at the surface, +1 bar every 10 m. Boyle\'s law: pressure × volume = constant, so your bottom consumption = SAC rate × pressure. Air in the cylinder = volume × pressure (12 L at 200 bar = 2,400 L). Simulated gas time = cylinder air ÷ bottom consumption, down to 0 bar, with no reserve or ascent. Indicative values: cold, exertion and stress increase consumption.',
    faq: {
      title: 'Frequently asked questions',
      items: [
        {
          q: 'How do you calculate your SAC rate in scuba diving?',
          a: 'Multiply the cylinder volume by the bar used to get the litres breathed, then divide by the dive time and by the average absolute pressure (1 + average depth ÷ 10). Example: a 12 L cylinder from 200 to 50 bar = 1,800 L, over 40 min at an average of 15 m (2.5 bar): 1,800 ÷ (40 × 2.5) = 18 L/min at the surface.',
        },
        {
          q: 'What is a normal air consumption rate for divers?',
          a: 'Most recreational divers have a SAC rate of 15 to 20 L/min. Below 12 L/min is very relaxed; above 25 L/min is high, often because of cold, exertion, stress or poor weighting. It varies from dive to dive, so measure it over several dives.',
        },
        {
          q: 'Why do you use twice as much air at 10 m?',
          a: 'At 10 m the absolute pressure is 2 bar: each breath fills your lungs with the same volume, but that volume holds twice as much air (Boyle’s law). Your consumption at depth is your SAC rate × 2. From 0 to 10 m it doubles, while from 30 to 40 m (4 to 5 bar) it only goes up by 25%.',
        },
        {
          q: 'How long does a 12 litre scuba tank last?',
          a: 'A 12 L cylinder at 200 bar holds about 2,400 L of air. With a SAC rate of 20 L/min and breathing it down to 0 bar: 120 min at the surface, 40 min at 20 m, 24 min at 40 m. On a real dive you keep a reserve (often 50 bar) and gas for the ascent: at 20 m, 150 usable bar only gives you 30 min.',
        },
        {
          q: 'What is the difference between SAC rate and RMV?',
          a: 'Both describe how much you breathe. In this tool, the SAC rate is your consumption in litres per minute converted to 1 bar, so it can be compared between dives; some divers call this RMV and keep “SAC” for bar or psi per minute. Your consumption at depth is SAC × absolute pressure: 18 L/min at the surface means 45 L/min at 15 m.',
        },
      ],
    },
    /** Link text for the converter, replacing {converter} in seo */
    law: { title: "Boyle's law:", pressureTitle: 'Pressure underwater:' },
    learnMore: 'Understand your air consumption',
    seoConverterLink: 'pressure & depth converter',
    seo: [
      {
        title: 'How to measure your air consumption',
        content:
          'Note your start and end pressure, the dive time and the average depth (your dive computer shows it). The My SAC tab works out the gas breathed (volume × bar used), then divides it by the dive time and the average pressure. Pick a dive with a steady profile and repeat over several dives: a pressure gauge is only accurate to a few bar, and your consumption changes with cold, exertion and stress.',
      },
      {
        title: 'Why your consumption doubles by 10 m',
        content:
          'At the surface you already carry 1 bar: the weight of the air. Underwater, every 10 m adds 1 bar: 2 bar at 10 m, 3 bar at 20 m, 5 bar at 40 m. This is Boyle\'s law: pressure × volume = constant. When pressure doubles, air is twice as compressed. Your lungs keep the same volume, so each breath fills them with twice as much air. From 0 to 10 m pressure goes from 1 to 2 bar and your consumption doubles; from 30 to 40 m it goes from 4 to 5 bar and consumption rises by only 25%. To convert between depth and pressure in fresh or salt water, use the {converter}.',
      },
      {
        title: 'Reading gas time and your gauge',
        content:
          'A cylinder holds its volume multiplied by its pressure: a 12 L filled to 200 bar contains 2,400 L of free air. At 20 m (3 bar) you breathe 3 times more than at the surface: with a 20 L/min SAC rate, you use 60 L/min. The cylinder would last 2,400 ÷ 60 = 40 min down to 0 bar. On your gauge, that is 5 bar per minute, or 1 bar every 12 seconds. Use this figure to compare depths and cylinders, not to set your dive time.',
      },
      {
        title: 'Limits: this is not a dive planner',
        content:
          'The calculation breathes the cylinder down to 0 bar, with no reserve, no ascent and no stops. It treats air as an ideal gas: at high pressure, a cylinder holds slightly less air than volume × pressure (about 4% less at 200 bar, nearly 10% at 300 bar), so the gas time shown is slightly optimistic. Plan your dives with your dive computer, your buddy and the rules of your training agency, and keep an eye on your gauge.',
      },
    ],
    jsonLd: {
      appName: 'Air Consumption Calculator',
      appDescription:
        'Free scuba air consumption calculator: SAC rate in L/min from a logged dive, effect of depth and simulated cylinder gas time.',
      breadcrumbHome: 'Orque Tools',
    },
  },
  gasBlender: {
    breadcrumbHome: 'Tools',
    breadcrumbCurrent: 'Nitrox blending',
    title: 'Nitrox Blending Calculator',
    subtitle:
      'Enter your cylinder, the mix you want and the gases you have: the tool gives you the partial pressure blending steps, read on the gauge to the nearest 10 bar.',
    learnMore: 'Understand nitrox blending',
    /** Link text to the nitrox calculator, inserted in place of {nitrox} in seo */
    seoNitroxLink: 'nitrox calculator',
    seo: [
      {
        title: 'The principle: partial pressures add up',
        content:
          "In a cylinder, each gas contributes its share of the total pressure: this is Dalton's law. A cylinder of air at 200 bar holds 21% oxygen, which is 42 bar of O2 and 158 bar of nitrogen. Partial pressure blending means adding gases one after the other while watching the gauge: you put in just enough oxygen, then top up with air to reach the right percentage. Example: a 12 L cylinder still holding 50 bar of air, + 30 bar of pure O2 (up to 80 bar), then air up to 200 bar, gives about 32.9% O2. The tool tries every combination of your gases and gives you the recommended plan, using as little pure O2 as possible.",
      },
      {
        title: 'Why pure O2 goes in first, and slowly',
        content:
          'Pure oxygen under pressure is a powerful oxidiser: a trace of grease or a pressure rise that is too fast can be enough to start a fire. So it goes in first, while the cylinder is still at low pressure, and you then top up with air, which also helps the mix even out. A cylinder that receives pure O2 must be oxygen clean and O2 compatible, valve included, even if the final mix is only EAN32; above 40% O2, the regulator too. Open the valves slowly: the gas heats up as it is compressed, and the pressure drops as the cylinder cools. Let it rest, then top up if needed.',
      },
      {
        title: 'Banks, cascade and compressor',
        content:
          "A storage bank (a large cylinder of nitrox, air or O2) doesn't push gas: it equalises with your cylinder until both are at the same pressure. The bigger and fuller the bank, the higher it can take your cylinder. With several banks of the same gas, you open them in cascade, from the lowest to the highest pressure: each one equalises in turn and you draw far more gas than by opening them all together. A compressor can go up to its maximum pressure. The tool checks that every bank has enough pressure and volume, and tells you how many more identical cylinders you can fill.",
      },
      {
        title: 'Reading to 10 bar, analysis and MOD',
        content:
          "A diving pressure gauge can't be read more precisely than the nearest 10 bar: the tool rounds every step to 10 bar and works out the mix you actually get, with a tolerance of 2 percentage points of O2. The calculation assumes ideal gases and a constant temperature: it does not replace analysis. Once the cylinder has cooled, always check it with an oxygen analyser and write the measured % and the maximum operating depth on the label. The MOD comes from the ppO2: 1.4 bar for the dive, 1.6 bar at most. With EAN32, ppO2 1.4 gives 33 m. For your mix's MOD, EAD and CNS toxicity, use the {nitrox}.",
      },
    ],
    faq: {
      title: 'Frequently asked questions',
      items: [
        {
          q: 'How do you calculate a partial pressure nitrox blend?',
          a: 'Work out the pressure to add (final pressure − remaining pressure) and the oxygen that added gas must contain (target % × final pressure − remaining % × remaining pressure). With two gases, for example pure O2 and air, you then get how many bar of each to put in. The tool does this for every combination of your gases, rounds to 10 bar for the gauge and checks the resulting mix.',
        },
        {
          q: 'How much pure O2 do you need to blend EAN32?',
          a: 'It depends on what is left in the cylinder. For a 12 L cylinder holding 50 bar of air, filled to 200 bar of EAN32: about 30 bar of pure O2 (up to 80 bar), then air up to 200 bar, giving about 32.9% O2. From an empty cylinder, you need about 28 bar of pure O2, rounded to 30 bar on the gauge, then air up to 200 bar.',
        },
        {
          q: 'Why add pure oxygen before air?',
          a: 'For safety: pure O2 goes in at low pressure, which limits heating and the risk of fire in the valve and cylinder. Topping up with air afterwards stirs the gas and helps the mix even out. The cylinder must still be oxygen clean and O2 compatible, and the fill must stay slow.',
        },
        {
          q: 'What is cascade filling?',
          a: 'When you have several banks of the same gas, you open them one after the other, from the lowest to the highest pressure. Each one equalises with your cylinder and takes it a little higher. You recover more gas than by opening all the banks together, and keep a full bank for the end.',
        },
        {
          q: 'Do you need to analyse a nitrox cylinder after filling?',
          a: 'Yes, always. The calculation assumes ideal gases and a gauge read to the nearest 10 bar: the real mix can be one or two points off. Let the cylinder cool, check it with an oxygen analyser and write the measured % and the MOD at ppO2 1.4 on the label. If the gap is too large, the tool suggests a correction: bleed down to a given pressure, then top up again.',
        },
        {
          q: 'What is the maximum depth for my nitrox?',
          a: 'Divide the maximum ppO2 by the oxygen fraction to get the limiting absolute pressure, then subtract 1 bar and count 10 m per bar. For EAN32 at ppO2 1.4: 1.4 ÷ 0.32 = 4.375 bar, so 33 m rounding down; at ppO2 1.6: 40 m. The tool shows it for the mix you will actually get, then for the analysed %.',
        },
      ],
    },
    jsonLd: {
      appName: 'Nitrox Blending Calculator',
      appDescription:
        'Free air and nitrox partial pressure blending calculator: gauge steps with pure O2, cascaded banks or a compressor, stock check, MOD and final analysis.',
      breadcrumbHome: 'Orque Tools',
    },
    // Conventions: {name} = interpolated value, **text** = bold, `text` = formula.
    /** Intl locale used to format numbers */
    numberLocale: 'en-GB',
    tablistAria: 'Steps',
    tabs: { melange: 'Mix', stocks: 'Stock', plan: 'Plan' },
    units: { bar: 'bar', l: 'L', litres: 'litres', m: 'm', pctO2: '% O2', pct: '%', blocks: 'cyl.' },
    stepper: { decrease: 'Decrease', increase: 'Increase' },
    tank: {
      title: 'Your cylinders',
      help: 'A single cylinder or a manifold of identical cylinders filled together. Remaining pressure: that of each cylinder, manifold open. Empty cylinder: enter 0 bar.',
      volume: 'Cylinder volume',
      count: 'Number of cylinders',
      countAria: 'Number of cylinders on the manifold',
      pressure: 'Remaining pressure',
      o2: 'Remaining % O2',
      quickEmpty: 'Empty cylinder',
      quickAir: 'Air left',
      quickSame: 'Same mix left',
      quickTitle: 'Shortcuts',
    },
    mix: {
      title: 'Target mix',
      help: 'Pick a common nitrox or set the % by hand. Under each mix: its MOD at ppO2 1.4.',
      presetsTitle: 'Common nitrox · MOD at ppO2 1.4',
      shortcut: 'Nx{m}',
      shortcutMod: '{mod} m',
      o2: 'Target % O2',
      pressure: 'Final pressure',
    },
    /** Short physics reminders (LawNote), worded like a dive course. */
    laws: {
      modTitle: 'Maximum depth:',
      /** {m} = target % O2, {p} = absolute pressure where ppO2 reaches 1.4, {mod} = MOD */
      mod: '1 bar at the surface, then +1 bar every 10 m. ppO2 is the absolute pressure × the % of O2: with **{m}%** O2, it reaches 1.4 at **{p} bar**, which is **{mod} m**.',
      daltonTitle: "Dalton's law:",
      dalton: 'the pressure of a mix is the sum of the pressures of its gases. Each layer you add raises the gauge by its share, and the final % depends on the O2 in all the layers.',
      equalTitle: 'Equalisation:',
      equal: 'a bank opened onto your cylinder flows into it until both are at the same pressure, like communicating vessels. So it can never take your cylinder higher than its own pressure.',
      analysisTitle: 'Why analyse:',
      analysis: 'gas heats up as it is compressed and the pressure drops as it cools: the real mix is always slightly off the calculation. Only the measured % sets the MOD on the label.',
    },
    gases: {
      title: 'Available gases',
      help: 'Your storage cylinders and your compressor. Number: identical cylinders (e.g. 3 × 50 L of EAN36). The volume is used to check there is enough gas left; leave it empty for a compressor.',
      nameAria: 'Gas name',
      o2: 'Oxygen',
      pressure: 'Pressure',
      pressureMax: 'Max pressure',
      volume: 'Volume',
      count: 'Number',
      /** Unit under the Number field */
      bottles: 'cyl.',
      addTitle: 'Add a gas',
      countAria: 'Number of identical storage cylinders',
      kindContinuous: 'continuous source',
      kindBuffer: 'storage cylinder',
      kindCascade: '{n} cylinders in cascade',
      kindTogether: '{n} cylinders together',
      opening: 'Opening',
      cascade: 'Cascade',
      together: 'All together',
      remove: 'Remove',
      add: 'Add:',
      addO2: '+ Pure O2',
      addNx: '+ Nitrox bank',
      addAir: '+ Air bank',
      addComp: '+ Compressor',
      reset: 'Reset to default values',
      defaults: { o2: 'Pure O2', nx: 'Nitrox bank', airb: 'Air bank', comp: 'Compressor' },
      unnamed: 'Gas {f} %',
      numbered: '{name} #{n}',
      withPct: '{name} {f} %',
    },
    cta: {
      button: 'See the plan',
      defaultSub: 'Blending plan',
      result: '{p} bar at {mix}',
      sub: 'Plan · {steps}',
      subBleed: 'Plan · bleed down + {steps}',
      steps1: '{n} step',
      stepsN: '{n} steps',
      reduced: ' · target not reached',
      incomplete: 'Incomplete data',
      nothing: 'Nothing to add',
      none: 'No solution with this stock',
    },
    errors: {
      incomplete: 'Enter the cylinder and the target mix.',
      range: 'O2 percentages must be between 0 and 100.',
      noGas: 'Add at least one available gas (step 3).',
    },
    plan: {
      title: 'Blending plan',
      help: "Follow the steps in order while reading the cylinder's gauge, then analyse the mix.",
      nothing: 'Nothing to add: the cylinder already holds the target mix and pressure.',
      impossible: 'Cannot reach {p} bar at {mix} with this stock.',
      bestHint: 'Best possible: **{p} bar** at {mix}, plan below.',
      noneHint: 'A rich enough gas is missing, or the storage cylinders lack pressure or volume.',
      kickerGood: 'Recommended plan',
      kickerOff: 'Best possible plan',
      titleBleed: 'Bleed down + {title}',
      titleBleedOnly: 'Bleed down only',
      join: ' + ',
      target: '{p} bar · target {target}',
      modLine: 'MOD **{mod} m** at ppO2 1.4',
      resultLabel: 'Resulting mix',
      statPressure: 'Pressure',
      statTarget: 'Target',
      statTargetOk: 'Target ✓',
      statMod: 'MOD ppO2 1.4',
      compO2: 'O2 {v} %',
      compN2: 'N2 {v} %',
      compCaption: 'Final composition of the cylinder',
      compCaptionRamp: 'Final composition of each cylinder',
      tankAria: 'Cylinder fill',
      legendRamp: 'Manifold ×{n}',
      legendResidual: 'Already in the cylinder',
      bleedBlock: 'Bleed down the cylinder',
      bleedRamp: 'Bleed down the manifold',
      bleedMeta: 'Vent slowly',
      upTo: 'down to',
      fillUpTo: 'fill up to',
      stepMeta: '+{bar} bar · cylinder at {mix}',
      stepRest: ' · storage left: {rest} bar',
      cascade: 'Cascade: {list}',
      cascadeSep: ' then ',
      cascadeItem: '{name} ({p} bar)',
      tight: 'Equalisation limit: slow transfer, may not reach {p} bar.',
      noteDev: 'More than 2 points of % O2 away from the target (10 bar gauge reading).',
      noteO2: 'Pure O2: oxygen-clean, O2-compatible equipment.',
      noteSlow: 'Fill slowly: the cylinder heats up and its pressure drops as it cools. Let it cool, top up if needed, then analyse.',
    },
    stocks: {
      title: 'Your stock',
      help: 'Does each gas have enough pressure and volume for this fill?',
      ignored1: '{n} gas ignored: fill in its % O2 and pressure (field in red).',
      ignoredN: '{n} gases ignored: fill in their % O2 and pressure (field in red).',
      status: {
        unlimited: 'Unlimited',
        enough: 'Enough',
        tight: 'Tight',
        last: 'Last fill',
        low: 'Enough, stock low',
        enoughAfterBleed: 'Enough after bleed down',
        enoughFor: 'Enough for {p} bar',
        notEnough: 'Not enough',
        unused: 'Not used',
      },
      pillOk: 'OK',
      toBlock: 'to the cylinder',
      toEach: 'to each cylinder',
      givesContinuous: 'Gives **+{bar} bar** {to} · max {max} bar',
      givesBuffer: 'Gives **+{bar} bar** {to} (up to {gauge} bar)',
      memberLine: '{who} **{before} → {after} bar**',
      memberEnsemble: '{k} cylinders together',
      memberSingle: 'Storage',
      cascade: 'Cascade: {list}',
      again0Block: 'Not enough for another identical cylinder',
      again0Ramp: 'Not enough for another identical manifold',
      againBlock1: '{n} more identical cylinder',
      againBlockN: '{n} more identical cylinders',
      againRamp1: '{n} more manifold of {nb} cylinders',
      againRampN: '{n} more manifolds of {nb} cylinders',
      missingReduced: 'For {p} bar you would need {req} bar',
      missingBleed: 'Without bleeding down you would need {req} bar',
      shortageMulti: '{name}: has **{has} bar**, would need **{req} bar**',
      shortageSingle: 'Has **{has} bar**, would need **{req} bar**',
      shortageLimit: 'The cylinder would reach at best {limit} bar instead of {need}',
      unusedMulti: '{name}: {p} bar · {vol} L',
      unusedEnsemble: '{k} cylinders together at {p} bar · {k} × {unit} L',
      unusedSingle: 'Storage at {p} bar · {vol} L',
      unusedComp: 'Compressor · max {p} bar',
      altTitle: 'Storage stock',
      altLine: '{before} → {after} bar · {again}',
    },
    summary: {
      title: 'At a glance',
      help: 'The gas to put in the cylinder, including pure O2, and the MOD of the resulting mix.',
      bleed: 'Bleed down to',
      bleedValue: '{p} bar',
      bleedThen: '−{d} bar, then add the gas',
      bleedOnly: '−{d} bar, nothing else to do',
      add: 'To add',
      addValue: '+{bar} bar',
      addPerBlock: 'per cylinder, ',
      addWithO2: 'incl. +{o2} bar of pure O2',
      addNoO2: 'no pure O2',
      addTotal: 'all gases combined',
      drain: 'To bleed',
      drainValue: '{bar} bar',
      drainSub: 'the cylinder is overfilled',
      litres: 'For the {n} cylinders',
      litresValue: '≈ {l} L',
      litresItem: '{name}: {l} L',
      sep: ' · ',
      mod: 'MOD',
      modValue: '{m} m',
      modSub: 'at ppO2 1.4 · {m16} m at ppO2 1.6',
      modExpected: ' · for the expected {mix}',
      alert: 'Warning',
      alertValue: '> 40 % O2',
      alertSub: 'O2-compatible cylinder and regulator',
    },
    analysis: {
      title: 'Final analysis',
      help: 'Once the cylinder has cooled, analyse it and enter the measured %: that is the value that counts for the MOD.',
      field: 'Analysed % O2',
      ramp: 'Manifold: analyse each cylinder, they must all give the same %.',
      invalid: 'Invalid analysis value.',
      status: { ok: 'Within spec', richMid: 'Slightly rich', leanMid: 'Slightly lean', richLow: 'Too rich', leanLow: 'Too lean' },
      gap1: 'Off by {d} point of % O2 from the target {target}',
      gapN: 'Off by {d} points of % O2 from the target {target}',
      labelTitle: 'Label',
      labelMod: 'MOD {m14} m at ppO2 1.4 · {m16} m at ppO2 1.6',
      verdictTitle: 'Verdict',
      mod14: 'MOD ppO2 1.4',
      mod16: 'MOD ppO2 1.6',
      fixTitle: 'To get back to {target}',
      fixBleedBlock: 'Bleed the cylinder down to **{p} bar**',
      fixBleedRamp: 'Bleed the manifold down to **{p} bar**',
      fixStep: '{gas} up to **{p} bar**',
      fixResult: 'Expected result ≈ {mix}, then analyse again. Or keep the cylinder as is and label it {label}.',
      fixNone: 'No correction possible with these gases: label the cylinder {label}.',
    },
    alts: {
      title: 'Other options',
      help: 'Other possible combinations with your gases, ranked after the recommended plan.',
      withO2: ' · +{o2} bar of pure O2',
      noO2: ' · no pure O2',
    },
    rejected: {
      title: 'Rejected combinations',
      alreadyAbove: 'Cylinder already above the target pressure',
      notRichEnough: 'Not rich enough in O2',
      tooRich: 'Too rich: you would need a gas at {mix} or less',
      gapTooSmall: 'Difference too small for the gauge',
      bufferShort: '{name} insufficient: you would need {req} bar in {where} (it has {has})',
      whereOne: 'the storage cylinder',
      whereMany: 'the storage cylinders',
      continuousShort: '{name} limited to {max} bar, {need} bar needed',
    },
    /** "How it is calculated" note (educational part of the page, plain text, no markup). */
    howTitle: 'How it is calculated',
    how: [
      {
        title: 'What needs to be added',
        text: 'It starts from two needs: the bar to add (final pressure − remaining pressure) and the oxygen that added gas must contain (target % × final pressure − remaining % × remaining pressure). That oxygen is in all the added gas, air and nitrox included: it is not the amount of pure O2 to put in. The cylinder volume does not change the mix, only what the banks can supply.',
      },
      {
        title: 'Two gases, two unknowns',
        text: 'With two gases (for example pure O2 and air), the tool looks for how many bar of each give both the right pressure and the right amount of oxygen: the original spreadsheet method, generalised. The answer is only valid if both amounts are positive. The tool tries every pair of your gases, and each gas on its own.',
      },
      {
        title: 'Rounding to the gauge',
        text: 'The intermediate pressure is rounded to 10 bar, up or down depending on which gives the mix closest to the target, then the final mix is recalculated. The plan is kept if it stays within 2 percentage points of O2 of the target.',
      },
      {
        title: 'Banks and equalisation',
        text: 'A bank equalises with the cylinder: the common final pressure is the average of the two pressures, weighted by their volumes. The bank loses as many litres as the cylinder gains, so the bigger it is, the less its pressure drops. A step is marked "tight" if equalisation stops less than 10 bar from the target pressure.',
      },
      {
        title: 'Cascade or all together',
        text: 'Several identical cylinders opened in cascade, one after the other from the lowest to the highest pressure, each equalise in turn with the cylinder: this draws the most gas. Opened all together, they behave like a single large bank.',
      },
      {
        title: 'Manifold of cylinders',
        text: 'Several identical connected cylinders are calculated as a single cylinder of the total volume: gauge pressures do not change, only what the banks must supply is multiplied by the number of cylinders.',
      },
      {
        title: 'Choosing the recommended plan',
        text: 'First within tolerance, then without pure O2, then with the least pure O2, then closest to the target. If nothing works, the tool suggests bleeding the cylinder down in 10 bar steps, otherwise the maximum pressure reachable at the right mix.',
      },
      {
        title: 'Limits',
        text: 'Ideal gases, no temperature correction: the real mix can differ from the calculation. Always analyse the cooled cylinder before diving.',
      },
    ],
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
      { id: 'nitrox', label: 'Nitrox', live: true },
      { id: 'convertisseur', label: 'Converter', live: true },
      { id: 'consommation', label: 'Air consumption', live: true },
      { id: 'gonflage-nitrox', label: 'Gas blending', live: true },
      { id: 'decompression', label: 'Decompression', live: false },
      { id: 'flottabilite', label: 'Buoyancy', live: false },
      { id: 'devis', label: 'Quotes', live: false },
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
