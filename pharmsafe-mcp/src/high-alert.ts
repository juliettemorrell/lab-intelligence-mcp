// ISMP High-Alert Medications — require extra safeguards to reduce harm
export interface HighAlertMedication {
  drug: string;
  category: string;
  risks: string[];
  safeguards: string[];
  monitoringRequired: string[];
}

export const ISMP_HIGH_ALERT: HighAlertMedication[] = [
  {
    drug: 'warfarin', category: 'Anticoagulants',
    risks: ['Major/fatal bleeding', 'Narrow therapeutic index', 'Numerous drug-food interactions', 'Genetic variability in metabolism'],
    safeguards: ['INR monitoring (weekly during initiation, then monthly when stable)', 'Patient education on bleeding signs', 'Drug interaction review at every new prescription', 'Consistent vitamin K dietary intake counseling'],
    monitoringRequired: ['INR', 'hemoglobin', 'signs of bleeding', 'concurrent medication changes']
  },
  {
    drug: 'heparin', category: 'Anticoagulants',
    risks: ['Heparin-induced thrombocytopenia (HIT)', 'Major bleeding', 'Dosing errors (units vs mL confusion)'],
    safeguards: ['Weight-based dosing protocol', 'aPTT monitoring q6h until stable', 'Platelet count monitoring for HIT', 'Independent double-check of dose calculations'],
    monitoringRequired: ['aPTT', 'platelet count', 'hemoglobin', 'signs of bleeding/thrombosis']
  },
  {
    drug: 'enoxaparin', category: 'Anticoagulants (LMWH)',
    risks: ['Spinal/epidural hematoma with neuraxial anesthesia', 'Accumulation in renal impairment', 'Bleeding'],
    safeguards: ['Renal function check before starting', 'Anti-Xa monitoring in obesity/renal impairment', 'Hold 12-24h before neuraxial procedures'],
    monitoringRequired: ['renal function', 'anti-Xa (special populations)', 'platelet count', 'hemoglobin']
  },
  {
    drug: 'insulin', category: 'Insulins',
    risks: ['Hypoglycemia (potentially fatal)', 'Mix-ups between insulin types', 'Dosing errors (units)'],
    safeguards: ['Independent double-check of dose', 'Glucose monitoring before and after administration', '"Units" written out (never "U" abbreviation)', 'Clear labeling of insulin type', 'Hypoglycemia protocol in place'],
    monitoringRequired: ['blood glucose (pre-meal and bedtime minimum)', 'HbA1c q3mo', 'hypoglycemia episodes', 'injection site rotation']
  },
  {
    drug: 'methotrexate', category: 'Antineoplastics/Immunosuppressants',
    risks: ['Fatal if given daily instead of weekly for non-oncologic use', 'Bone marrow suppression', 'Hepatotoxicity', 'Pulmonary toxicity', 'Teratogenic'],
    safeguards: ['WEEKLY dosing clearly specified for RA/psoriasis', 'Folic acid supplementation (1mg daily or 5mg weekly)', 'Pregnancy testing before and contraception during', 'Dose limits verified against indication'],
    monitoringRequired: ['CBC with differential q2-4 weeks initially then q1-3 months', 'LFTs monthly x3mo then q3mo', 'renal function', 'pulmonary symptoms']
  },
  {
    drug: 'digoxin', category: 'Cardiac glycosides',
    risks: ['Narrow therapeutic index', 'Toxicity potentiated by hypokalemia', 'Accumulates in renal impairment', 'Lethal arrhythmias in toxicity'],
    safeguards: ['Serum level monitoring (target 0.5-0.9 for HF)', 'Potassium maintained >4.0 mEq/L', 'Renal function check before dosing', 'EKG if toxicity suspected'],
    monitoringRequired: ['digoxin level', 'potassium', 'magnesium', 'renal function', 'heart rate']
  },
  {
    drug: 'oxycodone', category: 'Opioids',
    risks: ['Respiratory depression', 'Overdose death (especially with benzodiazepines/gabapentinoids)', 'Dependence/addiction', 'Constipation leading to obstruction'],
    safeguards: ['Start low dose in opioid-naive', 'PDMP check before prescribing', 'Naloxone co-prescribed', 'Bowel regimen initiated concurrently', 'Avoid concurrent benzodiazepines'],
    monitoringRequired: ['pain scores', 'respiratory rate', 'sedation level', 'bowel function', 'signs of misuse (PDMP)']
  },
  {
    drug: 'morphine', category: 'Opioids',
    risks: ['Respiratory depression', 'Active metabolite (M6G) accumulates in renal failure', 'Overdose', 'Dependence'],
    safeguards: ['Avoid in renal impairment (use hydromorphone)', 'Start at lowest effective dose', 'Naloxone available', 'Respiratory monitoring for first 24-48h of initiation'],
    monitoringRequired: ['respiratory rate', 'pain scores', 'sedation scale', 'renal function', 'bowel function']
  },
  {
    drug: 'fentanyl', category: 'Opioids',
    risks: ['Extremely potent (100x morphine)', 'Transdermal patch: fatal if applied to non-intact skin or heated', 'Respiratory depression', 'CYP3A4 interaction risk'],
    safeguards: ['Patch: only for opioid-tolerant patients', 'Never cut patches', 'Avoid heat exposure to patch area', 'CYP3A4 inhibitor check (macrolides, azoles, grapefruit)'],
    monitoringRequired: ['respiratory rate', 'patch application site', 'adequate pain relief', 'signs of toxicity during CYP3A4 inhibitor co-use']
  },
  {
    drug: 'metformin', category: 'Hypoglycemics',
    risks: ['Lactic acidosis in renal impairment/hypoxia', 'Hold for contrast procedures', 'B12 deficiency with long-term use'],
    safeguards: ['Check eGFR before starting and annually', 'Hold 48h peri-contrast', 'Monitor B12 annually if on >4 years', 'Hold during acute illness with dehydration risk'],
    monitoringRequired: ['eGFR', 'B12 annually', 'lactate if symptomatic', 'HbA1c']
  },
  {
    drug: 'lithium', category: 'Mood stabilizers',
    risks: ['Narrow therapeutic index (0.6-1.2 mEq/L)', 'Toxicity: seizures, coma, death', 'Nephrogenic DI', 'Hypothyroidism', 'Teratogenic'],
    safeguards: ['Level monitoring (q1-2 weeks initially, then q3-6mo)', 'Maintain hydration', 'Avoid NSAIDs, thiazides, ACE inhibitors (raise lithium)', 'TSH and renal function monitoring', 'Pregnancy planning'],
    monitoringRequired: ['lithium level', 'renal function q6mo', 'TSH q6mo', 'calcium', 'ECG if indicated']
  },
  {
    drug: 'potassium chloride', category: 'Electrolytes (concentrated)',
    risks: ['Fatal cardiac arrest if given IV too rapidly or in excessive dose', 'Cardiac arrhythmias from hyperkalemia', 'GI ulceration with oral tablets'],
    safeguards: ['IV: max 10 mEq/hr peripheral, 20 mEq/hr central (with cardiac monitoring)', 'Never give IV push', 'Check potassium before supplementation', 'Oral: take with full glass of water, upright position'],
    monitoringRequired: ['serum potassium', 'ECG if IV administration', 'renal function', 'magnesium (if hypokalemia refractory)']
  },
  {
    drug: 'amiodarone', category: 'Antiarrhythmics',
    risks: ['Pulmonary toxicity (potentially fatal)', 'Thyroid dysfunction (hypo and hyper)', 'Hepatotoxicity', 'QT prolongation', 'Corneal microdeposits', 'Extremely long half-life (40-55 days)'],
    safeguards: ['Baseline PFTs, TFTs, LFTs, eye exam', 'Drug interaction review (inhibits multiple CYPs)', 'Warfarin dose reduction 30-50% when added', 'Patient education: sun sensitivity, vision changes, dyspnea'],
    monitoringRequired: ['TFTs q6mo', 'LFTs q6mo', 'PFTs annually', 'eye exam annually', 'chest X-ray if respiratory symptoms', 'ECG']
  },
  {
    drug: 'vancomycin', category: 'Antimicrobials',
    risks: ['Nephrotoxicity', 'Ototoxicity', 'Red Man Syndrome if infused too fast', 'Subtherapeutic levels promote resistance'],
    safeguards: ['AUC-guided dosing (target AUC/MIC 400-600)', 'Infuse over ≥60min per gram', 'Renal function check before each dose adjustment', 'Trough or AUC monitoring'],
    monitoringRequired: ['vancomycin AUC or trough', 'serum creatinine daily during treatment', 'audiometry if prolonged course', 'WBC/clinical response']
  }
];

export function checkHighAlertMedications(medications: string[]): HighAlertMedication[] {
  const normalizedMeds = medications.map(m => m.toLowerCase().trim());
  const results: HighAlertMedication[] = [];

  for (const med of normalizedMeds) {
    for (const entry of ISMP_HIGH_ALERT) {
      if (med.includes(entry.drug.toLowerCase()) || entry.drug.toLowerCase().includes(med)) {
        results.push(entry);
      }
    }
  }

  // Check for "insulin" generically
  const hasInsulin = normalizedMeds.some(m =>
    m.includes('insulin') || m.includes('glargine') || m.includes('lispro') ||
    m.includes('aspart') || m.includes('detemir') || m.includes('degludec') ||
    m.includes('novolog') || m.includes('humalog') || m.includes('lantus') ||
    m.includes('levemir') || m.includes('tresiba')
  );
  if (hasInsulin && !results.some(r => r.drug === 'insulin')) {
    results.push(ISMP_HIGH_ALERT.find(e => e.drug === 'insulin')!);
  }

  return results;
}

export interface AnticholinergicBurden {
  drug: string;
  score: 1 | 2 | 3;
}

// Anticholinergic Cognitive Burden Scale (ACB)
const ACB_SCORES: Record<string, 1 | 2 | 3> = {
  // Score 3 — Definite anticholinergic effects
  'amitriptyline': 3, 'atropine': 3, 'benztropine': 3, 'chlorpromazine': 3,
  'clomipramine': 3, 'clozapine': 3, 'desipramine': 3, 'dicyclomine': 3,
  'diphenhydramine': 3, 'doxepin': 3, 'hydroxyzine': 3, 'hyoscyamine': 3,
  'imipramine': 3, 'meclizine': 3, 'nortriptyline': 3, 'olanzapine': 3,
  'orphenadrine': 3, 'oxybutynin': 3, 'paroxetine': 3, 'perphenazine': 3,
  'promethazine': 3, 'quetiapine': 3, 'scopolamine': 3, 'thioridazine': 3,
  'tolterodine': 3, 'trifluoperazine': 3, 'trihexyphenidyl': 3, 'trimipramine': 3,
  // Score 2 — Probable anticholinergic effects
  'amantadine': 2, 'baclofen': 2, 'carbamazepine': 2, 'cetirizine': 2,
  'cimetidine': 2, 'cyclobenzaprine': 2, 'loperamide': 2, 'loratadine': 2,
  'nifedipine': 2, 'pimozide': 2, 'ranitidine': 2,
  // Score 1 — Possible anticholinergic effects
  'alprazolam': 1, 'atenolol': 1, 'bupropion': 1, 'captopril': 1,
  'chlorthalidone': 1, 'citalopram': 1, 'codeine': 1, 'colchicine': 1,
  'diazepam': 1, 'digoxin': 1, 'dipyridamole': 1, 'duloxetine': 1,
  'fentanyl': 1, 'fluoxetine': 1, 'fluvoxamine': 1, 'furosemide': 1,
  'haloperidol': 1, 'hydralazine': 1, 'hydrocortisone': 1, 'isosorbide': 1,
  'levofloxacin': 1, 'lithium': 1, 'metformin': 1, 'metoprolol': 1,
  'morphine': 1, 'prednisone': 1, 'risperidone': 1, 'sertraline': 1,
  'theophylline': 1, 'trazodone': 1, 'venlafaxine': 1, 'warfarin': 1
};

export function calculateAnticholinergicBurden(medications: string[]): {
  totalScore: number;
  riskLevel: 'low' | 'moderate' | 'high';
  breakdown: AnticholinergicBurden[];
  interpretation: string;
} {
  const normalizedMeds = medications.map(m => m.toLowerCase().trim());
  const breakdown: AnticholinergicBurden[] = [];

  for (const med of normalizedMeds) {
    for (const [drug, score] of Object.entries(ACB_SCORES)) {
      if (med.includes(drug) || drug.includes(med)) {
        breakdown.push({ drug, score });
        break;
      }
    }
  }

  const totalScore = breakdown.reduce((sum, b) => sum + b.score, 0);

  let riskLevel: 'low' | 'moderate' | 'high';
  let interpretation: string;

  if (totalScore >= 6) {
    riskLevel = 'high';
    interpretation = 'High anticholinergic burden (ACB ≥6). Associated with significant cognitive decline, delirium risk, increased mortality in elderly. Urgent review recommended to reduce burden.';
  } else if (totalScore >= 3) {
    riskLevel = 'moderate';
    interpretation = 'Moderate anticholinergic burden (ACB 3-5). Associated with cognitive impairment and increased fall risk. Consider reducing or substituting high-scoring agents.';
  } else {
    riskLevel = 'low';
    interpretation = 'Low anticholinergic burden (ACB <3). Minimal cognitive risk from current medications.';
  }

  return { totalScore, riskLevel, breakdown, interpretation };
}
