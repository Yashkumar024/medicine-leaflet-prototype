/*
 * DEMO DATA — FICTIONAL.
 * Every medicine, active substance, code (PZN), company and leaflet text in this file
 * was written for this prototype. None of it is a real approved leaflet and none of it
 * is medical guidance. In a real service this file is replaced by the official,
 * approved leaflet catalogue; the app only displays what is stored here, word for word.
 */
(function () {
  'use strict';

  const MAH = [
    'Demopharm GmbH (fictional company)',
    'Musterstraße 1',
    '12345 Musterstadt',
  ];

  // Block notation: ['h', text] sub-heading · ['p', text] paragraph · ['ul', [items]] list · ['box', text] boxed statement
  function leaflet(o) {
    const B = o.brand;
    return [
      {
        id: 's1',
        num: 1,
        title: `What ${B} is and what it is used for`,
        blocks: [
          ['p', `${o.fullName} contains the active substance ${o.substance}. ${capital(o.substance)} belongs to a group of medicines called ${o.group}.`],
          ['p', `${B} is used ${o.use}`],
          ...(o.useExtra || []),
        ],
      },
      {
        id: 's2',
        num: 2,
        title: `What you need to know before you ${o.verb} ${B}`,
        blocks: [
          ['h', `Do not ${o.verb} ${B}`],
          ['ul', [
            `if you are allergic to ${o.substance} or any of the other ingredients of this medicine (listed in section 6).`,
            ...o.contra,
          ]],
          ['h', 'Warnings and precautions'],
          ['p', `Talk to your doctor or pharmacist before you ${o.verb} ${B} if you:`],
          ['ul', o.warnings],
          ['h', `Other medicines and ${B}`],
          ['p', 'Tell your doctor or pharmacist if you are taking, have recently taken or might take any other medicines.'],
          ...(o.interactionsExtra || []),
          ['h', 'Pregnancy and breast-feeding'],
          ['p', 'If you are pregnant or breast-feeding, think you may be pregnant or are planning to have a baby, ask your doctor or pharmacist for advice before taking this medicine.'],
          ['h', 'Driving and using machines'],
          ['p', o.driving],
        ],
      },
      {
        id: 's3',
        num: 3,
        howTo: true,
        title: `How to ${o.verb} ${B}`,
        blocks: [
          ['box', `Always ${o.verb} this medicine exactly as described in this leaflet or as your doctor or pharmacist has told you. Check with your doctor or pharmacist if you are not sure.`],
          ['h', 'The recommended dose is'],
          ['ul', o.dose],
          ['h', 'Method of administration'],
          ['p', o.method],
          ['h', 'Duration of use'],
          ['p', o.duration],
          ['h', `If you ${o.verb} more ${B} than you should`],
          ['p', 'Contact a doctor or the nearest hospital emergency department immediately. Take this leaflet and the remaining medicine with you.'],
          ['h', `If you forget to ${o.verb} ${B}`],
          ['p', o.forget],
          ...(o.stopping ? [['h', `If you stop taking ${B}`], ['p', o.stopping]] : []),
          ['p', 'If you have any further questions on the use of this medicine, ask your doctor or pharmacist.'],
        ],
      },
      {
        id: 's4',
        num: 4,
        title: 'Possible side effects',
        blocks: [
          ['p', 'Like all medicines, this medicine can cause side effects, although not everybody gets them.'],
          ['h', `Stop taking ${B} and contact a doctor immediately if you notice any of the following:`],
          ['ul', o.serious],
          ['h', 'Common (may affect up to 1 in 10 people)'],
          ['ul', o.common],
          ['h', 'Uncommon (may affect up to 1 in 100 people)'],
          ['ul', o.uncommon],
          ...(o.rare ? [['h', 'Rare (may affect up to 1 in 1,000 people)'], ['ul', o.rare]] : []),
          ['h', 'Reporting of side effects'],
          ['p', 'If you get any side effects, talk to your doctor or pharmacist. This includes any possible side effects not listed in this leaflet. You can also report side effects directly via the national reporting system. By reporting side effects you can help provide more information on the safety of this medicine.'],
        ],
      },
      {
        id: 's5',
        num: 5,
        title: `How to store ${B}`,
        blocks: [
          ['p', 'Keep this medicine out of the sight and reach of children.'],
          ['p', `Do not use this medicine after the expiry date which is stated on the carton and the ${o.container} after “EXP”. The expiry date refers to the last day of that month.`],
          ['p', o.storage],
          ['p', 'Do not throw away any medicines via wastewater or household waste. Ask your pharmacist how to throw away medicines you no longer use. These measures will help protect the environment.'],
        ],
      },
      {
        id: 's6',
        num: 6,
        title: 'Contents of the pack and other information',
        blocks: [
          ['h', `What ${B} contains`],
          ['ul', [
            `The active substance is ${o.substance}. ${o.perUnit}`,
            `The other ingredients are: ${o.ingredients}`,
          ]],
          ['h', `What ${B} looks like and contents of the pack`],
          ['p', o.appearance],
          ['p', o.packs],
          ['h', 'Marketing authorisation holder and manufacturer'],
          ['p', MAH.join(', ')],
          ['p', `This leaflet was last revised in ${o.revised}.`],
        ],
      },
    ];
  }

  function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ------------------------------------------------------------------ */
  /* Novadol — UC1 (patient with a new medicine)                         */
  /* ------------------------------------------------------------------ */
  const novadolBase = {
    brand: 'Novadol',
    substance: 'novadolin',
    group: 'demonstration analgesics (fictional)',
    verb: 'take',
    use: 'in adults and adolescents from 12 years of age weighing more than 40 kg for the short-term treatment of mild to moderate pain, such as headache, toothache and period pain, and of fever.',
    useExtra: [['p', 'You must talk to a doctor if you do not feel better or if you feel worse after 3 days.']],
    contra: [
      'if you have ever had a stomach ulcer or bleeding in the stomach or gut.',
      'if you are in the last three months of pregnancy.',
      'in children under 12 years of age.',
    ],
    warnings: [
      'have asthma or have ever had an allergic reaction after taking a pain medicine.',
      'have kidney, liver or heart problems.',
      'are taking any other pain medicines.',
      'are elderly.',
    ],
    driving: 'Novadol has no or negligible influence on the ability to drive and use machines. If you feel dizzy or tired, do not drive or use machines.',
    method: 'For oral use. Swallow the tablet whole with a glass of water, preferably with or after a meal. Do not chew, break or crush the tablets.',
    duration: 'Do not take Novadol for more than 3 days for fever or more than 4 days for pain without talking to your doctor.',
    forget: 'Do not take a double dose to make up for a forgotten tablet.',
    serious: [
      'signs of a severe allergic reaction, such as swelling of the face, tongue or throat, difficulty breathing or swallowing.',
      'black, tarry stools or vomiting blood.',
      'a severe skin rash with blistering.',
    ],
    common: ['heartburn, stomach pain, nausea', 'headache'],
    uncommon: ['skin rash, itching', 'dizziness, tiredness'],
    rare: ['ringing in the ears'],
    container: 'blister',
    storage: 'Do not store above 25 °C. Store in the original package in order to protect from moisture.',
    ingredients: 'microcrystalline cellulose, maize starch, croscarmellose sodium, magnesium stearate, hypromellose, macrogol 400, titanium dioxide (E171).',
  };

  const novadol400 = Object.assign({}, novadolBase, {
    fullName: 'Novadol 400 mg film-coated tablets',
    dose: [
      'Adults and adolescents from 12 years of age (over 40 kg): 1 tablet (400 mg novadolin) as a single dose.',
      'If needed, a further dose can be taken. Leave at least 6 to 8 hours between doses.',
      'Do not take more than 3 tablets (1,200 mg novadolin) in 24 hours.',
    ],
    perUnit: 'Each film-coated tablet contains 400 mg novadolin.',
    appearance: 'Novadol 400 mg film-coated tablets are white, oval, film-coated tablets marked “N4” on one side.',
    packs: 'Packs of 10, 20 and 50 film-coated tablets. Not all pack sizes may be marketed.',
  });

  const novadol200 = Object.assign({}, novadolBase, {
    fullName: 'Novadol 200 mg film-coated tablets',
    dose: [
      'Adults and adolescents from 12 years of age (over 40 kg): 1 to 2 tablets (200 to 400 mg novadolin) as a single dose.',
      'If needed, a further dose can be taken. Leave at least 6 hours between doses.',
      'Do not take more than 6 tablets (1,200 mg novadolin) in 24 hours.',
    ],
    perUnit: 'Each film-coated tablet contains 200 mg novadolin.',
    appearance: 'Novadol 200 mg film-coated tablets are white, round, film-coated tablets marked “N2” on one side.',
    packs: 'Packs of 20 film-coated tablets.',
  });

  const novadolEff = Object.assign({}, novadolBase, {
    fullName: 'Novadol 400 mg effervescent tablets',
    method: 'For oral use. Dissolve the effervescent tablet completely in a glass of water (about 200 ml) and drink the whole solution straight away. Do not swallow the tablet whole.',
    dose: [
      'Adults and adolescents from 12 years of age (over 40 kg): 1 effervescent tablet (400 mg novadolin) as a single dose.',
      'If needed, a further dose can be taken. Leave at least 6 to 8 hours between doses.',
      'Do not take more than 3 effervescent tablets (1,200 mg novadolin) in 24 hours.',
    ],
    forget: 'Do not take a double dose to make up for a forgotten effervescent tablet.',
    container: 'tube',
    storage: 'Do not store above 25 °C. Keep the tube tightly closed in order to protect from moisture.',
    perUnit: 'Each effervescent tablet contains 400 mg novadolin.',
    ingredients: 'citric acid, sodium hydrogen carbonate, sodium carbonate, sorbitol (E420), lemon flavour, sucralose. This medicine contains 410 mg sodium per tablet.',
    appearance: 'Novadol 400 mg effervescent tablets are white, round, flat tablets with a lemon odour.',
    packs: 'Tubes of 10 and 20 effervescent tablets.',
  });

  const novadolJunior = Object.assign({}, novadolBase, {
    brand: 'Novadol Junior',
    fullName: 'Novadol Junior 20 mg/ml oral suspension',
    use: 'in children from 6 months of age weighing more than 7 kg for the short-term treatment of mild to moderate pain and of fever.',
    useExtra: [['p', 'You must talk to a doctor if your child does not feel better or feels worse after 3 days.']],
    contra: [
      'if your child has ever had a stomach ulcer or bleeding in the stomach or gut.',
      'in babies under 6 months of age or weighing less than 7 kg.',
    ],
    method: 'For oral use. Shake the bottle well before use. Use the oral syringe provided in the pack to measure the dose.',
    dose: [
      'The dose depends on the body weight of the child. Use the table printed on the carton.',
      '7 to 9 kg (6 to 12 months): 2.5 ml up to 3 times in 24 hours.',
      '10 to 15 kg (1 to 3 years): 5 ml up to 3 times in 24 hours.',
      '16 to 20 kg (4 to 6 years): 7.5 ml up to 3 times in 24 hours.',
      'Leave at least 6 to 8 hours between doses.',
    ],
    forget: 'Do not give a double dose to make up for a forgotten dose.',
    container: 'bottle',
    storage: 'Do not store above 25 °C. After first opening, use within 6 months.',
    perUnit: 'Each ml of oral suspension contains 20 mg novadolin.',
    ingredients: 'maltitol liquid (E965), glycerol, xanthan gum, citric acid, sodium benzoate (E211), strawberry flavour, purified water.',
    appearance: 'Novadol Junior is a white to off-white, viscous suspension with a strawberry odour.',
    packs: 'Bottle of 100 ml with an oral syringe (5 ml).',
  });

  /* ------------------------------------------------------------------ */
  /* Cardiovex — UC2 (caregiver helping a parent)                        */
  /* ------------------------------------------------------------------ */
  const cardiovexBase = {
    brand: 'Cardiovex',
    fullName: 'Cardiovex 5 mg tablets',
    substance: 'cardiovexil',
    group: 'demonstration vessel relaxants (fictional)',
    verb: 'take',
    use: 'to treat high blood pressure (hypertension) in adults.',
    contra: [
      'if you have very low blood pressure.',
      'if you have severe narrowing of the aortic heart valve.',
      'if you are more than 3 months pregnant.',
    ],
    warnings: [
      'have liver problems.',
      'have heart failure.',
      'are elderly and your dose needs to be increased.',
    ],
    driving: 'Cardiovex may affect your ability to drive or use machines. If the tablets make you feel sick, dizzy or tired, do not drive or use machines.',
    dose: [
      'The usual starting dose is 1 tablet (5 mg cardiovexil) once a day.',
      'Your doctor may increase the dose to 2 tablets (10 mg cardiovexil) once a day.',
      'Take your tablet at the same time each day.',
    ],
    method: 'For oral use. Swallow the tablet with a glass of water. The tablet can be taken with or without food. The tablet can be divided into equal doses.',
    duration: 'This medicine is usually taken for a long time. Your doctor will tell you how long to take it.',
    forget: 'If you forget to take a tablet, leave out that dose completely. Take your next dose at the right time. Do not take a double dose to make up for a forgotten tablet.',
    stopping: 'Your doctor will advise you how long to take your medicine. Talk to your doctor before you stop taking Cardiovex.',
    container: 'blister',
    storage: 'This medicine does not require any special storage conditions.',
    perUnit: 'Each tablet contains 5 mg cardiovexil.',
    ingredients: 'microcrystalline cellulose, calcium hydrogen phosphate, sodium starch glycolate, magnesium stearate.',
    appearance: 'Cardiovex 5 mg tablets are white, round tablets with a score line on one side and “CV5” on the other side.',
    packs: 'Packs of 30, 50 and 100 tablets.',
  };

  const cardiovexCurrent = Object.assign({}, cardiovexBase, {
    revised: 'June 2026',
    serious: [
      'sudden wheeziness, chest pain, shortness of breath or difficulty in breathing.',
      'swelling of the eyelids, face or lips.',
      'severe skin reactions including intense skin rash, hives or reddening of the skin.',
    ],
    common: ['headache, dizziness, sleepiness', 'palpitations (awareness of your heartbeat), flushing', 'swelling of the ankles', 'tiredness'],
    uncommon: ['mood changes, difficulty sleeping', 'ringing in the ears', 'changed bowel habits', 'muscle cramps'],
  });

  const cardiovexPrevious = Object.assign({}, cardiovexBase, {
    revised: 'February 2024',
    serious: [
      'sudden wheeziness, chest pain, shortness of breath or difficulty in breathing.',
      'swelling of the eyelids, face or lips.',
    ],
    common: ['headache, dizziness, sleepiness', 'palpitations (awareness of your heartbeat), flushing', 'swelling of the ankles'],
    uncommon: ['mood changes, difficulty sleeping', 'changed bowel habits', 'muscle cramps', 'tiredness'],
  });

  /* ------------------------------------------------------------------ */
  /* Gastrozol — UC3 (checking a change: capsule colour)                 */
  /* ------------------------------------------------------------------ */
  const gastrozolBase = {
    brand: 'Gastrozol',
    fullName: 'Gastrozol 20 mg gastro-resistant capsules',
    substance: 'gastrozolin',
    group: 'demonstration acid reducers (fictional)',
    verb: 'take',
    use: 'in adults to treat reflux of stomach acid into the food pipe (heartburn) and to help heal stomach ulcers.',
    contra: ['if you are taking a medicine called demovirin (fictional).'],
    warnings: [
      'have ever had a skin reaction after treatment with a medicine similar to Gastrozol.',
      'have severe liver problems.',
      'are due to have a specific blood test.',
    ],
    driving: 'Gastrozol is not likely to affect your ability to drive or use any tools or machines. Side effects such as dizziness and disturbed vision may occur. If affected, you should not drive or operate machinery.',
    dose: [
      'The usual dose is 1 capsule (20 mg gastrozolin) once a day.',
      'Your doctor may tell you to take 2 capsules (40 mg) once a day for a limited time.',
    ],
    method: 'For oral use. Take your capsule in the morning before breakfast. Swallow the capsule whole with half a glass of water. Do not chew or crush the capsule.',
    duration: 'Your doctor will tell you how long to take your capsules.',
    forget: 'If you forget to take a dose, take it as soon as you remember. If it is almost time for your next dose, skip the missed dose. Do not take a double dose to make up for a forgotten capsule.',
    serious: [
      'sudden wheezing, swelling of your lips, tongue and throat or body, rash, fainting or difficulties in swallowing.',
      'reddening of the skin with blisters or peeling.',
      'yellow skin, dark urine and tiredness.',
    ],
    common: ['headache', 'effects on your stomach or gut: diarrhoea, stomach pain, constipation, wind', 'feeling sick or being sick'],
    uncommon: ['swelling of the feet and ankles', 'disturbed sleep', 'dizziness, tingling feelings'],
    container: 'bottle',
    storage: 'Do not store above 30 °C. Keep the bottle tightly closed in order to protect from moisture.',
    perUnit: 'Each gastro-resistant capsule contains 20 mg gastrozolin.',
  };

  const gastrozolCurrent = Object.assign({}, gastrozolBase, {
    revised: 'September 2026',
    interactionsExtra: [['p', 'This includes medicines obtained without a prescription. In particular, tell your doctor or pharmacist if you are taking demovirin or examplomycin (fictional medicines).']],
    ingredients: 'Capsule content: sugar spheres, hypromellose, talc, methacrylic acid copolymer, triethyl citrate. Capsule shell: gelatin, titanium dioxide (E171), indigo carmine (E132), yellow iron oxide (E172).',
    appearance: 'Gastrozol 20 mg gastro-resistant capsules have an opaque green cap and an opaque white body, marked “GZ 20” in black ink.',
    packs: 'Bottles of 14, 28 and 56 gastro-resistant capsules. Not all pack sizes may be marketed.',
  });

  const gastrozolPrevious = Object.assign({}, gastrozolBase, {
    revised: 'March 2025',
    ingredients: 'Capsule content: sugar spheres, hypromellose, talc, methacrylic acid copolymer, triethyl citrate. Capsule shell: gelatin, titanium dioxide (E171), red iron oxide (E172).',
    appearance: 'Gastrozol 20 mg gastro-resistant capsules have an opaque red cap and an opaque white body, marked “GZ 20” in black ink.',
    packs: 'Bottles of 14, 28 and 56 gastro-resistant capsules. Not all pack sizes may be marketed.',
  });

  const gastrozolOlder = Object.assign({}, gastrozolPrevious, {
    revised: 'November 2023',
    packs: 'Bottles of 14 and 28 gastro-resistant capsules.',
    uncommon: ['swelling of the feet and ankles', 'disturbed sleep'],
  });

  const gastrozol40 = Object.assign({}, gastrozolCurrent, {
    fullName: 'Gastrozol 40 mg gastro-resistant capsules',
    revised: 'September 2026',
    dose: ['The usual dose is 1 capsule (40 mg gastrozolin) once a day.'],
    perUnit: 'Each gastro-resistant capsule contains 40 mg gastrozolin.',
    appearance: 'Gastrozol 40 mg gastro-resistant capsules have an opaque green cap and an opaque green body, marked “GZ 40” in black ink.',
    packs: 'Bottles of 28 gastro-resistant capsules.',
  });

  /* ------------------------------------------------------------------ */
  /* Restalin — recovery case: current leaflet unavailable               */
  /* ------------------------------------------------------------------ */
  const restalinOld = {
    brand: 'Restalin',
    fullName: 'Restalin 10 mg tablets',
    substance: 'restalinate',
    group: 'demonstration antihistamines (fictional)',
    verb: 'take',
    use: 'in adults and children from 6 years of age to relieve the symptoms of hay fever and hives.',
    contra: ['if you have severe kidney disease.'],
    warnings: ['have kidney problems.', 'have epilepsy.', 'are due to have a skin allergy test.'],
    driving: 'Restalin can make some people feel sleepy. If this happens to you, do not drive or use machines.',
    dose: [
      'Adults and children from 12 years: 1 tablet (10 mg restalinate) once a day.',
      'Children from 6 to 12 years: half a tablet twice a day.',
    ],
    method: 'For oral use. Swallow the tablet with a glass of water, with or without food.',
    duration: 'Your doctor or pharmacist will tell you how long to take Restalin.',
    forget: 'Do not take a double dose to make up for a forgotten tablet.',
    serious: ['swelling of the face, lips or throat, or difficulty breathing.'],
    common: ['sleepiness', 'dizziness, headache', 'dry mouth'],
    uncommon: ['stomach pain', 'weakness'],
    container: 'blister',
    storage: 'This medicine does not require any special storage conditions.',
    perUnit: 'Each tablet contains 10 mg restalinate.',
    ingredients: 'lactose monohydrate, microcrystalline cellulose, magnesium stearate, hypromellose, titanium dioxide (E171).',
    appearance: 'Restalin 10 mg tablets are white, oblong tablets with a score line on one side.',
    packs: 'Packs of 20 and 50 tablets.',
    revised: 'May 2024',
  };

  /* ------------------------------------------------------------------ */
  /* Lumetra — recovery case: scanned code matches two products          */
  /* ------------------------------------------------------------------ */
  const lumetraBase = {
    brand: 'Lumetra',
    substance: 'lumetrine',
    group: 'demonstration sleep-rhythm regulators (fictional)',
    verb: 'take',
    use: 'in adults for the short-term treatment of difficulty falling asleep.',
    contra: ['if you have severe liver problems.'],
    warnings: ['have liver or kidney problems.', 'drink alcohol.'],
    driving: 'Lumetra may cause drowsiness. Do not drive or use machines until you know how this medicine affects you.',
    method: 'For oral use. Take the tablet 1 to 2 hours before bedtime, after food. Swallow the tablet whole with a glass of water.',
    duration: 'Do not take Lumetra for longer than your doctor has told you.',
    forget: 'If you forget to take your tablet, take it before going to sleep that night. Do not take a double dose.',
    serious: ['swelling of the face, lips or throat, or difficulty breathing.'],
    common: ['headache', 'drowsiness'],
    uncommon: ['restlessness', 'dry mouth'],
    container: 'blister',
    storage: 'Do not store above 25 °C.',
    ingredients: 'lactose monohydrate, maize starch, magnesium stearate.',
    revised: 'January 2026',
  };
  const lumetraIR = Object.assign({}, lumetraBase, {
    fullName: 'Lumetra 50 mg tablets',
    dose: ['Adults: 1 tablet (50 mg lumetrine) once a day.'],
    perUnit: 'Each tablet contains 50 mg lumetrine.',
    appearance: 'Lumetra 50 mg tablets are white, round tablets marked “L50”.',
    packs: 'Packs of 10 and 20 tablets.',
  });
  const lumetraPR = Object.assign({}, lumetraBase, {
    fullName: 'Lumetra 50 mg prolonged-release tablets',
    dose: ['Adults: 1 prolonged-release tablet (50 mg lumetrine) once a day.'],
    method: 'For oral use. Take the tablet 1 to 2 hours before bedtime, after food. Swallow the tablet whole with a glass of water. Do not crush, chew or break the tablet.',
    perUnit: 'Each prolonged-release tablet contains 50 mg lumetrine.',
    appearance: 'Lumetra 50 mg prolonged-release tablets are pale blue, round tablets marked “L50R”.',
    packs: 'Packs of 20 prolonged-release tablets.',
  });

  /* ------------------------------------------------------------------ */
  /* Catalogue                                                           */
  /* ------------------------------------------------------------------ */
  function v(id, revised, published, status, src) {
    return { id, revised, published, status, sections: leaflet(Object.assign({}, src, { revised })) };
  }

  const products = [
    {
      id: 'novadol-400-ft',
      name: 'Novadol',
      strength: '400 mg',
      form: 'Film-coated tablets',
      pack: '20 tablets',
      substance: 'novadolin',
      pzn: '99000141',
      color: '#C8102E',
      versions: [v('2026-04', 'April 2026', '2026-04-22', 'current', novadol400)],
    },
    {
      id: 'novadol-200-ft',
      name: 'Novadol',
      strength: '200 mg',
      form: 'Film-coated tablets',
      pack: '20 tablets',
      substance: 'novadolin',
      pzn: '99000135',
      color: '#E86A1C',
      versions: [v('2026-04', 'April 2026', '2026-04-22', 'current', novadol200)],
    },
    {
      id: 'novadol-400-eff',
      name: 'Novadol',
      strength: '400 mg',
      form: 'Effervescent tablets',
      pack: '20 tablets (tube)',
      substance: 'novadolin',
      pzn: '99000158',
      color: '#2D6FB7',
      versions: [v('2025-11', 'November 2025', '2025-11-30', 'current', novadolEff)],
    },
    {
      id: 'novadol-junior',
      name: 'Novadol Junior',
      strength: '20 mg/ml',
      form: 'Oral suspension',
      pack: '100 ml bottle',
      substance: 'novadolin',
      pzn: '99000164',
      color: '#7A3E9D',
      versions: [v('2026-02', 'February 2026', '2026-02-10', 'current', novadolJunior)],
    },
    {
      id: 'cardiovex-5',
      name: 'Cardiovex',
      strength: '5 mg',
      form: 'Tablets',
      pack: '50 tablets',
      substance: 'cardiovexil',
      pzn: '99000210',
      color: '#0E6E62',
      versions: [
        v('2026-06', 'June 2026', '2026-06-18', 'current', cardiovexCurrent),
        v('2024-02', 'February 2024', '2024-03-04', 'previous', cardiovexPrevious),
      ],
    },
    {
      id: 'gastrozol-20',
      name: 'Gastrozol',
      strength: '20 mg',
      form: 'Gastro-resistant capsules',
      pack: '28 capsules',
      substance: 'gastrozolin',
      pzn: '99000327',
      color: '#3F7D3A',
      versions: [
        v('2026-09', 'September 2026', '2026-09-14', 'current', gastrozolCurrent),
        v('2025-03', 'March 2025', '2025-03-27', 'previous', gastrozolPrevious),
        v('2023-11', 'November 2023', '2023-12-05', 'previous', gastrozolOlder),
      ],
    },
    {
      id: 'gastrozol-40',
      name: 'Gastrozol',
      strength: '40 mg',
      form: 'Gastro-resistant capsules',
      pack: '28 capsules',
      substance: 'gastrozolin',
      pzn: '99000333',
      color: '#245A26',
      versions: [v('2026-09', 'September 2026', '2026-09-14', 'current', gastrozol40)],
    },
    {
      id: 'restalin-10',
      name: 'Restalin',
      strength: '10 mg',
      form: 'Tablets',
      pack: '20 tablets',
      substance: 'restalinate',
      pzn: '99000416',
      color: '#8A6D1F',
      // Recovery case: the current approved leaflet could not be retrieved or verified.
      currentUnavailable: true,
      versions: [v('2024-05', 'May 2024', '2024-06-02', 'previous', restalinOld)],
    },
    {
      id: 'lumetra-50',
      name: 'Lumetra',
      strength: '50 mg',
      form: 'Tablets',
      pack: '20 tablets',
      substance: 'lumetrine',
      pzn: '99000522',
      color: '#4B5A9C',
      versions: [v('2026-01', 'January 2026', '2026-01-19', 'current', lumetraIR)],
    },
    {
      id: 'lumetra-50-pr',
      name: 'Lumetra',
      strength: '50 mg',
      form: 'Prolonged-release tablets',
      pack: '20 tablets',
      substance: 'lumetrine',
      pzn: '99000539',
      color: '#6C8BD0',
      versions: [v('2026-01', 'January 2026', '2026-01-19', 'current', lumetraPR)],
    },
  ];

  // Simulated pack codes for the clearly labelled scan simulation.
  const scanSamples = [
    { id: 'pack-novadol', label: 'Novadol 400 mg pack', hint: 'UC1 · pack from the pharmacy', result: ['novadol-400-ft'] },
    { id: 'pack-gastrozol', label: 'Gastrozol 20 mg bottle', hint: 'UC3 · usual medicine', result: ['gastrozol-20'] },
    { id: 'pack-lumetra', label: 'Lumetra pack, label partly torn', hint: 'Recovery · code matches 2 products', result: ['lumetra-50', 'lumetra-50-pr'] },
    { id: 'pack-damaged', label: 'Creased pack, code unreadable', hint: 'Recovery · scan fails', result: [] },
  ];

  window.LEAFLET_DATA = { products, scanSamples };
})();
