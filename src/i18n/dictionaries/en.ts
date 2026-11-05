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
    tank: { label: 'Cylinder', myTank: 'My cylinder', mono: 'Single', bi: 'Twinset', biPrefix: '2×' },
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
      trapNote: 'From 0 to 10 m your consumption **doubles**. From 30 to 40 m: only **+25%**. Tap a bar.',
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
    },
    autonomy: {
      infoTitle: 'Teaching simulation, not a dive planner',
      infoText:
        'The calculation empties the cylinder down to **0 bar**, with no reserve, no ascent and no stops: that is not what a real dive looks like. The goal is to see how gas time changes with depth, cylinder and your SAC rate.',
      depthTitle: 'Depth',
      startPressure: 'Start pressure',
      sac: 'My SAC rate',
      gaugeCaption: 'min at {depth} m → 0 bar',
      statBottom: 'Bottom consumption',
      statBar: '1 bar lasts',
      statRate: 'Gauge drops by',
      barsTitle: 'The same cylinder at other depths',
      barsNote: 'Minutes to 0 bar. Tap a bar.',
      /** Minute symbol on the bars */
      minuteMark: '′',
      /** Discreet note under gas time (ideal-gas model limit) */
      idealGasNote: 'Air is treated as an ideal gas: at 200–300 bar, a cylinder actually holds slightly less air.',
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
    },
    footnote:
      'Ideal-gas calculations: absolute pressure = 1 + depth / 10. SAC rate = gas breathed ÷ (duration × average pressure). Simulated gas time = start pressure × volume ÷ (SAC rate × pressure), down to 0 bar, with no reserve or ascent. Indicative values, not accounting for exertion, cold or stress.',
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
          'Absolute pressure is 1 + depth ÷ 10: 2 bar at 10 m, 3 bar at 20 m, 5 bar at 40 m. Your lungs keep the same volume, but each breath holds as many times more air as there are bar. From 0 to 10 m your consumption doubles, from 10 to 20 m it rises by 50%, and from 30 to 40 m by only 25%. To convert between depth and pressure in fresh or salt water, use the {converter}.',
      },
      {
        title: 'Reading gas time and your gauge',
        content:
          'The Gas time tab divides the air in the cylinder (volume × pressure) by your consumption at depth. Example: a 12 L cylinder at 200 bar, 20 L/min at the surface, at 20 m: you breathe 60 L/min, the gauge drops 5 bar per minute, 1 bar lasts 12 s and the cylinder would be empty in 40 min. Use this figure to compare depths and cylinders, not to set your dive time.',
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
