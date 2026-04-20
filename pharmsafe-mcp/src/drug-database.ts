import { DrugInteraction, SeverityLevel, InteractionMechanism } from './types.js';

interface TherapeuticClass {
  name: string;
  drugs: string[];
  duplicateRisk: string;
}

export const THERAPEUTIC_CLASSES: TherapeuticClass[] = [
  {
    name: 'ACE Inhibitors',
    drugs: ['lisinopril', 'enalapril', 'ramipril', 'benazepril', 'captopril', 'fosinopril', 'quinapril', 'perindopril'],
    duplicateRisk: 'Additive hypotension and hyperkalemia risk without additional benefit'
  },
  {
    name: 'ARBs',
    drugs: ['losartan', 'valsartan', 'irbesartan', 'olmesartan', 'candesartan', 'telmisartan', 'azilsartan'],
    duplicateRisk: 'Dual RAAS blockade increases renal failure and hyperkalemia risk'
  },
  {
    name: 'Statins',
    drugs: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'pravastatin', 'lovastatin', 'fluvastatin', 'pitavastatin'],
    duplicateRisk: 'Increased myopathy and rhabdomyolysis risk without additional lipid benefit'
  },
  {
    name: 'PPIs',
    drugs: ['omeprazole', 'esomeprazole', 'pantoprazole', 'lansoprazole', 'rabeprazole', 'dexlansoprazole'],
    duplicateRisk: 'No benefit from dual PPI; increased fracture, C. diff, and hypomagnesemia risk'
  },
  {
    name: 'SSRIs',
    drugs: ['sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'escitalopram', 'fluvoxamine'],
    duplicateRisk: 'Serotonin syndrome risk; no evidence of enhanced efficacy'
  },
  {
    name: 'SNRIs',
    drugs: ['venlafaxine', 'duloxetine', 'desvenlafaxine', 'levomilnacipran', 'milnacipran'],
    duplicateRisk: 'Serotonin syndrome risk; additive norepinephrine effects'
  },
  {
    name: 'Benzodiazepines',
    drugs: ['alprazolam', 'lorazepam', 'diazepam', 'clonazepam', 'midazolam', 'temazepam', 'triazolam', 'oxazepam'],
    duplicateRisk: 'Excessive sedation, respiratory depression, falls risk in elderly'
  },
  {
    name: 'Opioids',
    drugs: ['oxycodone', 'hydrocodone', 'morphine', 'fentanyl', 'tramadol', 'codeine', 'hydromorphone', 'methadone', 'buprenorphine', 'tapentadol'],
    duplicateRisk: 'Respiratory depression, excessive sedation, overdose risk'
  },
  {
    name: 'NSAIDs',
    drugs: ['ibuprofen', 'naproxen', 'diclofenac', 'meloxicam', 'celecoxib', 'indomethacin', 'ketorolac', 'piroxicam'],
    duplicateRisk: 'Additive GI bleeding, renal impairment, and cardiovascular risk'
  },
  {
    name: 'Thiazide Diuretics',
    drugs: ['hydrochlorothiazide', 'chlorthalidone', 'indapamide', 'metolazone'],
    duplicateRisk: 'Severe hyponatremia, hypokalemia, volume depletion'
  },
  {
    name: 'Loop Diuretics',
    drugs: ['furosemide', 'bumetanide', 'torsemide', 'ethacrynic acid'],
    duplicateRisk: 'Profound volume depletion, electrolyte wasting, ototoxicity'
  },
  {
    name: 'Beta-Blockers',
    drugs: ['metoprolol', 'atenolol', 'propranolol', 'carvedilol', 'bisoprolol', 'nebivolol', 'labetalol', 'sotalol'],
    duplicateRisk: 'Severe bradycardia, heart block, hypotension'
  },
  {
    name: 'Calcium Channel Blockers (DHP)',
    drugs: ['amlodipine', 'nifedipine', 'felodipine', 'nicardipine', 'isradipine', 'clevidipine'],
    duplicateRisk: 'Additive vasodilation, severe hypotension, peripheral edema'
  },
  {
    name: 'Calcium Channel Blockers (Non-DHP)',
    drugs: ['diltiazem', 'verapamil'],
    duplicateRisk: 'Severe bradycardia, AV block, heart failure exacerbation'
  },
  {
    name: 'Sulfonylureas',
    drugs: ['glipizide', 'glyburide', 'glimepiride'],
    duplicateRisk: 'Severe hypoglycemia without additional A1c benefit'
  },
  {
    name: 'Anticholinergics',
    drugs: ['oxybutynin', 'tolterodine', 'solifenacin', 'darifenacin', 'fesoterodine', 'trospium'],
    duplicateRisk: 'Additive anticholinergic burden: cognitive impairment, urinary retention, constipation, falls'
  },
  {
    name: 'Anticoagulants',
    drugs: ['warfarin', 'apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban', 'enoxaparin', 'heparin'],
    duplicateRisk: 'Major bleeding risk; dual anticoagulation rarely indicated'
  },
  {
    name: 'Antiplatelets',
    drugs: ['aspirin', 'clopidogrel', 'prasugrel', 'ticagrelor', 'dipyridamole'],
    duplicateRisk: 'Increased bleeding risk (note: dual antiplatelet may be intentional post-ACS/PCI)'
  }
];

export const DRUG_INTERACTIONS: DrugInteraction[] = [
  // QT Prolongation combinations
  {
    drug1: 'citalopram', drug2: 'azithromycin',
    severity: 'major', mechanism: 'qt-prolongation-additive',
    clinicalEffect: 'Additive QT prolongation increasing risk of Torsades de Pointes',
    recommendation: 'Monitor ECG. Consider alternative antibiotic (amoxicillin) or alternative SSRI (sertraline).',
    evidenceLevel: 'established', references: ['FDA Drug Safety Communication 2011', 'CredibleMeds QTDrugs List']
  },
  {
    drug1: 'methadone', drug2: 'ondansetron',
    severity: 'major', mechanism: 'qt-prolongation-additive',
    clinicalEffect: 'Synergistic QT prolongation; both are independent QT-prolonging agents',
    recommendation: 'Use alternative antiemetic (granisetron has less QT risk). If unavoidable, obtain baseline ECG and monitor.',
    evidenceLevel: 'established', references: ['CredibleMeds', 'Lexicomp']
  },
  // Serotonin Syndrome combinations
  {
    drug1: 'sertraline', drug2: 'tramadol',
    severity: 'major', mechanism: 'serotonergic-additive',
    clinicalEffect: 'Serotonin syndrome risk: agitation, hyperthermia, clonus, diaphoresis',
    recommendation: 'Avoid combination. Use non-serotonergic analgesic (acetaminophen, NSAIDs, or non-tramadol opioid).',
    evidenceLevel: 'established', references: ['FDA MedWatch', 'Boyer & Shannon, NEJM 2005']
  },
  {
    drug1: 'fluoxetine', drug2: 'sumatriptan',
    severity: 'moderate', mechanism: 'serotonergic-additive',
    clinicalEffect: 'Theoretical serotonin syndrome risk with triptans + SSRIs',
    recommendation: 'FDA warning issued but clinical risk appears low. Monitor for serotonin syndrome symptoms. Generally acceptable with monitoring.',
    evidenceLevel: 'suspected', references: ['FDA Alert 2006', 'Evans RW, Neurology 2010']
  },
  {
    drug1: 'linezolid', drug2: 'sertraline',
    severity: 'contraindicated', mechanism: 'serotonergic-additive',
    clinicalEffect: 'Linezolid is a non-selective MAO inhibitor. High risk of serotonin syndrome.',
    recommendation: 'CONTRAINDICATED. Discontinue SSRI ≥2 weeks before linezolid (5 weeks for fluoxetine). Use alternative antibiotic if possible.',
    evidenceLevel: 'established', references: ['FDA Black Box Warning', 'Lexicomp']
  },
  // CYP Interactions
  {
    drug1: 'simvastatin', drug2: 'clarithromycin',
    severity: 'contraindicated', mechanism: 'pharmacokinetic-cyp-inhibition',
    clinicalEffect: 'Clarithromycin strongly inhibits CYP3A4, increasing simvastatin levels 10-fold. Rhabdomyolysis risk.',
    recommendation: 'CONTRAINDICATED. Suspend simvastatin during clarithromycin course or use azithromycin instead.',
    evidenceLevel: 'established', references: ['FDA Label', 'ACC/AHA Statin Safety Statement']
  },
  {
    drug1: 'atorvastatin', drug2: 'itraconazole',
    severity: 'contraindicated', mechanism: 'pharmacokinetic-cyp-inhibition',
    clinicalEffect: 'Strong CYP3A4 inhibition by itraconazole increases atorvastatin AUC 3-fold. Myopathy/rhabdomyolysis risk.',
    recommendation: 'Suspend atorvastatin during azole therapy. Pravastatin or rosuvastatin are safer alternatives (not CYP3A4 metabolized).',
    evidenceLevel: 'established', references: ['FDA Label', 'Lexicomp']
  },
  {
    drug1: 'warfarin', drug2: 'fluconazole',
    severity: 'major', mechanism: 'pharmacokinetic-cyp-inhibition',
    clinicalEffect: 'Fluconazole inhibits CYP2C9, increasing S-warfarin levels. Significantly elevated INR and bleeding risk.',
    recommendation: 'Reduce warfarin dose by 25-50% when starting fluconazole. Check INR within 3-5 days. Consider alternative antifungal.',
    evidenceLevel: 'established', references: ['Lexicomp', 'Clinical Pharmacokinetics 2005']
  },
  {
    drug1: 'clopidogrel', drug2: 'omeprazole',
    severity: 'major', mechanism: 'pharmacokinetic-cyp-inhibition',
    clinicalEffect: 'Omeprazole inhibits CYP2C19, reducing conversion of clopidogrel to active metabolite. Diminished antiplatelet effect.',
    recommendation: 'Switch PPI to pantoprazole (minimal CYP2C19 inhibition) or use H2 blocker. FDA boxed warning.',
    evidenceLevel: 'established', references: ['FDA Boxed Warning 2009', 'COGENT Trial']
  },
  // Bleeding risk
  {
    drug1: 'warfarin', drug2: 'aspirin',
    severity: 'major', mechanism: 'bleeding-risk-additive',
    clinicalEffect: 'Additive bleeding risk through different mechanisms (anticoagulant + antiplatelet)',
    recommendation: 'If combination required (e.g., mechanical valve + CAD), use lowest effective aspirin dose (81mg). Monitor INR closely. Assess bleeding risk with HAS-BLED.',
    evidenceLevel: 'established', references: ['CHEST Guidelines', 'AHA/ACC']
  },
  {
    drug1: 'apixaban', drug2: 'naproxen',
    severity: 'major', mechanism: 'bleeding-risk-additive',
    clinicalEffect: 'NSAIDs increase GI bleeding risk 2-4x with DOACs. Also impair platelet function.',
    recommendation: 'Avoid chronic NSAID use with DOACs. If needed short-term, add PPI gastroprotection. Consider acetaminophen or topical NSAIDs.',
    evidenceLevel: 'established', references: ['RE-LY subanalysis', 'European Heart Journal 2015']
  },
  // CNS Depression
  {
    drug1: 'oxycodone', drug2: 'alprazolam',
    severity: 'major', mechanism: 'cns-depression-additive',
    clinicalEffect: 'Combined opioid + benzodiazepine: respiratory depression, profound sedation, death. FDA Black Box Warning.',
    recommendation: 'AVOID combination. If medically necessary, use lowest doses and shortest duration. Prescribe naloxone rescue kit.',
    evidenceLevel: 'established', references: ['FDA Black Box Warning 2016', 'CDC Opioid Guidelines']
  },
  {
    drug1: 'gabapentin', drug2: 'hydrocodone',
    severity: 'major', mechanism: 'cns-depression-additive',
    clinicalEffect: 'Gabapentinoids + opioids: increased risk of respiratory depression and opioid-related death (49% higher).',
    recommendation: 'Avoid if possible. If combined, use lowest effective doses. FDA warning issued 2019.',
    evidenceLevel: 'established', references: ['FDA Drug Safety Communication 2019', 'BMJ 2017']
  },
  // Nephrotoxicity
  {
    drug1: 'lisinopril', drug2: 'ibuprofen',
    severity: 'moderate', mechanism: 'nephrotoxicity-additive',
    clinicalEffect: 'Triple whammy (ACEI/ARB + NSAID + diuretic): acute kidney injury risk. Even dual combination raises creatinine.',
    recommendation: 'Avoid chronic NSAID use with ACE inhibitors. Short-term use: monitor creatinine and potassium. Use acetaminophen for pain.',
    evidenceLevel: 'established', references: ['BMJ 2013 Triple Whammy Study', 'KDIGO Guidelines']
  },
  {
    drug1: 'metformin', drug2: 'iodinated contrast',
    severity: 'major', mechanism: 'nephrotoxicity-additive',
    clinicalEffect: 'Contrast-induced nephropathy can impair metformin clearance, leading to lactic acidosis',
    recommendation: 'Hold metformin day of and 48h after contrast. Check creatinine before resuming. eGFR >30 required.',
    evidenceLevel: 'established', references: ['ACR Manual on Contrast Media', 'FDA Label']
  },
  // Electrolyte interactions
  {
    drug1: 'furosemide', drug2: 'digoxin',
    severity: 'major', mechanism: 'electrolyte-depletion',
    clinicalEffect: 'Loop diuretic-induced hypokalemia sensitizes myocardium to digoxin toxicity (arrhythmias, heart block)',
    recommendation: 'Monitor potassium closely (target K >4.0). Add potassium supplementation or potassium-sparing diuretic. Monitor digoxin levels.',
    evidenceLevel: 'established', references: ['Lexicomp', 'Heart Failure Guidelines']
  },
  {
    drug1: 'hydrochlorothiazide', drug2: 'lithium',
    severity: 'major', mechanism: 'renal-competition',
    clinicalEffect: 'Thiazides reduce lithium clearance by 25-40%, causing lithium toxicity (tremor, confusion, seizures)',
    recommendation: 'If unavoidable, reduce lithium dose by 25-50% and monitor levels within 5 days. Loop diuretics are somewhat safer alternative.',
    evidenceLevel: 'established', references: ['Finley et al. JAMA 1995', 'Lexicomp']
  },
  // Pharmacodynamic antagonism
  {
    drug1: 'metoprolol', drug2: 'albuterol',
    severity: 'moderate', mechanism: 'pharmacodynamic-antagonistic',
    clinicalEffect: 'Non-selective beta-blockers antagonize bronchodilator effect of beta-agonists. Cardioselective (metoprolol) is lower risk.',
    recommendation: 'Metoprolol (beta-1 selective) generally acceptable with inhaled beta-agonists. Avoid propranolol in asthma/COPD patients.',
    evidenceLevel: 'established', references: ['GINA Guidelines', 'Lexicomp']
  },
  {
    drug1: 'donepezil', drug2: 'oxybutynin',
    severity: 'major', mechanism: 'pharmacodynamic-antagonistic',
    clinicalEffect: 'Anticholinergic (oxybutynin) directly opposes cholinesterase inhibitor (donepezil), negating dementia treatment.',
    recommendation: 'Discontinue anticholinergic. For OAB in dementia patients, consider mirabegron (beta-3 agonist) or behavioral interventions.',
    evidenceLevel: 'established', references: ['Beers Criteria 2023', 'Lexicomp']
  },
  // Absorption interactions
  {
    drug1: 'levothyroxine', drug2: 'calcium carbonate',
    severity: 'moderate', mechanism: 'absorption-alteration',
    clinicalEffect: 'Calcium binds levothyroxine in GI tract, reducing absorption by 20-25%. Subtherapeutic thyroid levels.',
    recommendation: 'Separate administration by ≥4 hours. Take levothyroxine on empty stomach, 30-60 min before calcium.',
    evidenceLevel: 'established', references: ['Thyroid 2008 Singh et al.', 'Lexicomp']
  },
  {
    drug1: 'ciprofloxacin', drug2: 'calcium carbonate',
    severity: 'major', mechanism: 'absorption-alteration',
    clinicalEffect: 'Divalent cations (Ca, Mg, Fe, Al) chelate fluoroquinolones, reducing absorption by 50-90%. Treatment failure.',
    recommendation: 'Administer ciprofloxacin 2h before or 6h after calcium/antacid products.',
    evidenceLevel: 'established', references: ['FDA Label', 'Antimicrobial Agents Chemother']
  },
  // Hyperkalemia
  {
    drug1: 'spironolactone', drug2: 'lisinopril',
    severity: 'major', mechanism: 'pharmacodynamic-additive',
    clinicalEffect: 'Dual RAAS blockade with potassium-sparing diuretic: hyperkalemia risk (potentially fatal arrhythmias)',
    recommendation: 'If indicated (heart failure), start spironolactone at low dose (12.5-25mg). Monitor potassium within 1 week, then monthly. Avoid if K >5.0 or CrCl <30.',
    evidenceLevel: 'established', references: ['RALES Trial', 'Heart Failure Guidelines']
  },
  {
    drug1: 'trimethoprim', drug2: 'spironolactone',
    severity: 'major', mechanism: 'pharmacodynamic-additive',
    clinicalEffect: 'Trimethoprim blocks ENaC (like amiloride). Combined with spironolactone: severe hyperkalemia.',
    recommendation: 'Monitor potassium within 2-3 days. Short courses (<5d) with close monitoring may be acceptable. Consider alternative antibiotic.',
    evidenceLevel: 'established', references: ['CMAJ 2011', 'Antoniou et al. Arch Intern Med 2010']
  },
  // Additional high-frequency clinical interactions
  {
    drug1: 'fluoxetine', drug2: 'tramadol',
    severity: 'major', mechanism: 'serotonergic-additive',
    clinicalEffect: 'Serotonin syndrome risk. Fluoxetine also inhibits CYP2D6, paradoxically reducing tramadol efficacy while increasing seizure/serotonin risk.',
    recommendation: 'Avoid combination. Use non-serotonergic analgesic.',
    evidenceLevel: 'established', references: ['FDA MedWatch', 'Lexicomp']
  },
  {
    drug1: 'methotrexate', drug2: 'trimethoprim',
    severity: 'contraindicated', mechanism: 'pharmacodynamic-additive',
    clinicalEffect: 'Both are folate antagonists. Combined use causes severe pancytopenia and potentially fatal bone marrow suppression.',
    recommendation: 'AVOID combination. Use alternative antibiotic. If unavoidable, increase leucovorin rescue and monitor CBC closely.',
    evidenceLevel: 'established', references: ['Multiple case reports of fatal pancytopenia', 'Lexicomp']
  },
  {
    drug1: 'carbamazepine', drug2: 'clarithromycin',
    severity: 'major', mechanism: 'pharmacokinetic-cyp-inhibition',
    clinicalEffect: 'Clarithromycin inhibits CYP3A4, causing carbamazepine toxicity (ataxia, diplopia, nystagmus, seizures paradoxically).',
    recommendation: 'Use azithromycin instead (no CYP3A4 inhibition). If must use clarithromycin, reduce carbamazepine dose and monitor levels.',
    evidenceLevel: 'established', references: ['FDA Label', 'Lexicomp']
  },
  {
    drug1: 'amlodipine', drug2: 'simvastatin',
    severity: 'moderate', mechanism: 'pharmacokinetic-cyp-inhibition',
    clinicalEffect: 'Amlodipine weakly inhibits CYP3A4, increasing simvastatin levels ~1.8x. Elevated myopathy risk.',
    recommendation: 'Limit simvastatin to 20mg/day when combined with amlodipine. Or switch to atorvastatin/rosuvastatin.',
    evidenceLevel: 'established', references: ['FDA Label — simvastatin dose limitations', 'ACC/AHA']
  },
  {
    drug1: 'warfarin', drug2: 'amiodarone',
    severity: 'major', mechanism: 'pharmacokinetic-cyp-inhibition',
    clinicalEffect: 'Amiodarone inhibits CYP2C9 and CYP3A4, increasing warfarin effect. INR may rise 40-50%. Interaction persists months after amiodarone discontinuation.',
    recommendation: 'Reduce warfarin dose by 30-50% when starting amiodarone. Monitor INR weekly for several weeks. Effect lingers for months after amiodarone stopped.',
    evidenceLevel: 'established', references: ['FDA Label', 'Lexicomp']
  },
  {
    drug1: 'metformin', drug2: 'alcohol',
    severity: 'major', mechanism: 'pharmacodynamic-additive',
    clinicalEffect: 'Alcohol potentiates metformin-associated lactic acidosis by impairing hepatic lactate clearance. Hypoglycemia risk also increased.',
    recommendation: 'Moderate alcohol use generally acceptable. Avoid binge drinking. Educate patient on lactic acidosis symptoms.',
    evidenceLevel: 'probable', references: ['FDA Label', 'DeFronzo et al. NEJM']
  },
  {
    drug1: 'potassium chloride', drug2: 'spironolactone',
    severity: 'major', mechanism: 'pharmacodynamic-additive',
    clinicalEffect: 'Potassium supplementation with potassium-sparing diuretic: life-threatening hyperkalemia.',
    recommendation: 'Generally avoid concurrent use. If needed, monitor potassium within 3 days and weekly thereafter. Discontinue K supplement if K >5.0.',
    evidenceLevel: 'established', references: ['Lexicomp', 'UpToDate']
  },
  {
    drug1: 'sildenafil', drug2: 'nitroglycerin',
    severity: 'contraindicated', mechanism: 'pharmacodynamic-synergistic',
    clinicalEffect: 'PDE5 inhibitors potentiate nitrate vasodilation causing severe, potentially fatal hypotension.',
    recommendation: 'CONTRAINDICATED. Do not administer nitrates within 24h of sildenafil (48h for tadalafil). Alternative: morphine for chest pain if needed.',
    evidenceLevel: 'established', references: ['ACC/AHA Guidelines', 'FDA Black Box']
  },
  {
    drug1: 'fluoxetine', drug2: 'tamoxifen',
    severity: 'major', mechanism: 'pharmacokinetic-cyp-inhibition',
    clinicalEffect: 'Fluoxetine is a strong CYP2D6 inhibitor. Blocks tamoxifen conversion to active metabolite endoxifen. May reduce breast cancer treatment efficacy.',
    recommendation: 'Switch to SSRI with minimal CYP2D6 inhibition: citalopram, escitalopram, sertraline, or venlafaxine.',
    evidenceLevel: 'established', references: ['NCCN Guidelines', 'Kelly et al. BMJ 2010']
  },
  {
    drug1: 'prednisone', drug2: 'ibuprofen',
    severity: 'moderate', mechanism: 'pharmacodynamic-additive',
    clinicalEffect: 'Corticosteroids + NSAIDs: 2-4x increased GI ulceration and bleeding risk compared to either alone.',
    recommendation: 'Add PPI gastroprotection if combination needed. Prefer shortest NSAID course. Monitor for GI symptoms.',
    evidenceLevel: 'established', references: ['Piper et al. Ann Intern Med', 'Lexicomp']
  }
];

export function findInteractions(medications: string[]): DrugInteraction[] {
  const normalizedMeds = medications.map(m => m.toLowerCase().trim());
  const results: DrugInteraction[] = [];

  for (let i = 0; i < normalizedMeds.length; i++) {
    for (let j = i + 1; j < normalizedMeds.length; j++) {
      const med1 = normalizedMeds[i];
      const med2 = normalizedMeds[j];

      for (const interaction of DRUG_INTERACTIONS) {
        const d1 = interaction.drug1.toLowerCase();
        const d2 = interaction.drug2.toLowerCase();
        if ((med1.includes(d1) || d1.includes(med1)) && (med2.includes(d2) || d2.includes(med2)) ||
            (med1.includes(d2) || d2.includes(med1)) && (med2.includes(d1) || d1.includes(med2))) {
          results.push(interaction);
        }
      }
    }
  }

  return results;
}

export function findDuplicateTherapies(medications: string[]): { drugs: string[]; therapeuticClass: TherapeuticClass }[] {
  const normalizedMeds = medications.map(m => m.toLowerCase().trim());
  const results: { drugs: string[]; therapeuticClass: TherapeuticClass }[] = [];

  for (const tc of THERAPEUTIC_CLASSES) {
    const matches = normalizedMeds.filter(med =>
      tc.drugs.some(d => med.includes(d) || d.includes(med))
    );
    if (matches.length >= 2) {
      results.push({ drugs: matches, therapeuticClass: tc });
    }
  }

  return results;
}

export function getDrugClasses(drugName: string): string[] {
  const normalized = drugName.toLowerCase().trim();
  return THERAPEUTIC_CLASSES
    .filter(tc => tc.drugs.some(d => normalized.includes(d) || d.includes(normalized)))
    .map(tc => tc.name);
}
