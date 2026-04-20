export interface BeersEntry {
  drug: string;
  category: string;
  rationale: string;
  recommendation: string;
  qualityOfEvidence: 'high' | 'moderate' | 'low';
  strengthOfRecommendation: 'strong' | 'weak' | 'conditional';
  alternatives: string[];
}

export interface BeersInteractionEntry {
  drug1Class: string;
  drug2Class: string;
  drugs1: string[];
  drugs2: string[];
  rationale: string;
  recommendation: string;
}

// AGS Beers Criteria 2023 — Medications to Avoid in Older Adults (≥65)
export const BEERS_AVOID: BeersEntry[] = [
  {
    drug: 'alprazolam', category: 'Benzodiazepines',
    rationale: 'Older adults have increased sensitivity to benzodiazepines and decreased metabolism. Increases risk of cognitive impairment, delirium, falls, fractures, and motor vehicle crashes.',
    recommendation: 'Avoid for insomnia, agitation, or delirium. May be appropriate for seizure disorders, severe GAD, periprocedural sedation, EtOH withdrawal.',
    qualityOfEvidence: 'moderate', strengthOfRecommendation: 'strong',
    alternatives: ['CBT-I for insomnia', 'SSRI/SNRI for anxiety', 'buspirone', 'hydroxyzine (low-dose)']
  },
  {
    drug: 'lorazepam', category: 'Benzodiazepines',
    rationale: 'Same as all benzodiazepines — falls, cognitive impairment, delirium risk in elderly.',
    recommendation: 'Avoid for insomnia or agitation. Acceptable for seizures, severe alcohol withdrawal, end-of-life comfort.',
    qualityOfEvidence: 'moderate', strengthOfRecommendation: 'strong',
    alternatives: ['CBT-I', 'melatonin 0.5-2mg', 'trazodone 25-50mg', 'buspirone']
  },
  {
    drug: 'diazepam', category: 'Benzodiazepines',
    rationale: 'Extremely long half-life (active metabolites 50-100h) in elderly. Accumulates causing prolonged sedation.',
    recommendation: 'Avoid. If benzodiazepine absolutely needed, prefer short-acting (lorazepam) at lowest dose for shortest duration.',
    qualityOfEvidence: 'moderate', strengthOfRecommendation: 'strong',
    alternatives: ['lorazepam (if BZD required)', 'SSRI for anxiety', 'CBT']
  },
  {
    drug: 'zolpidem', category: 'Nonbenzodiazepine hypnotics',
    rationale: 'Similar adverse effects as benzodiazepines: delirium, falls, fractures. Emergency visits for adverse effects common in elderly women.',
    recommendation: 'Avoid. Use non-pharmacologic approaches first.',
    qualityOfEvidence: 'moderate', strengthOfRecommendation: 'strong',
    alternatives: ['CBT-I (first line)', 'sleep hygiene', 'melatonin', 'suvorexant (if insomnia persists)']
  },
  {
    drug: 'diphenhydramine', category: 'First-generation antihistamines',
    rationale: 'Highly anticholinergic. Causes confusion, dry mouth, constipation, urinary retention. Clearance reduced with age. Tolerance develops quickly as sleep aid.',
    recommendation: 'Avoid as sleep aid or for allergies in elderly. All first-gen antihistamines inappropriate.',
    qualityOfEvidence: 'moderate', strengthOfRecommendation: 'strong',
    alternatives: ['cetirizine', 'loratadine', 'fexofenadine (for allergies)', 'melatonin (for sleep)']
  },
  {
    drug: 'hydroxyzine', category: 'First-generation antihistamines',
    rationale: 'Anticholinergic; cognitive impairment, sedation, falls risk in elderly.',
    recommendation: 'Avoid regular use. Occasional low-dose (10-25mg) may be acceptable for acute anxiety.',
    qualityOfEvidence: 'moderate', strengthOfRecommendation: 'strong',
    alternatives: ['buspirone', 'SSRI', 'CBT for anxiety']
  },
  {
    drug: 'amitriptyline', category: 'Tertiary TCAs',
    rationale: 'Highly anticholinergic, sedating, causes orthostatic hypotension. Causes falls and cardiac conduction abnormalities in elderly.',
    recommendation: 'Avoid as antidepressant and for pain. Nortriptyline or desipramine are safer TCAs if needed.',
    qualityOfEvidence: 'high', strengthOfRecommendation: 'strong',
    alternatives: ['SSRI/SNRI for depression', 'duloxetine or gabapentin for neuropathic pain', 'nortriptyline (if TCA needed)']
  },
  {
    drug: 'oxybutynin', category: 'Anticholinergic (bladder)',
    rationale: 'Strong anticholinergic effects — cognitive decline, confusion, blurred vision, constipation, falls. Crosses BBB.',
    recommendation: 'Avoid in elderly especially those with dementia or cognitive impairment.',
    qualityOfEvidence: 'moderate', strengthOfRecommendation: 'strong',
    alternatives: ['mirabegron (beta-3 agonist)', 'vibegron', 'behavioral therapy', 'pelvic floor exercises']
  },
  {
    drug: 'glyburide', category: 'Sulfonylureas (long-acting)',
    rationale: 'Higher risk of severe, prolonged hypoglycemia in older adults. Active metabolites accumulate in renal impairment.',
    recommendation: 'Avoid. Use shorter-acting sulfonylurea (glipizide) or alternative hypoglycemic.',
    qualityOfEvidence: 'high', strengthOfRecommendation: 'strong',
    alternatives: ['glipizide', 'metformin (if eGFR allows)', 'DPP-4 inhibitor', 'GLP-1 agonist']
  },
  {
    drug: 'meperidine', category: 'Opioid analgesics',
    rationale: 'Neurotoxic metabolite normeperidine accumulates, causing seizures, delirium. Not effective orally. No advantage over other opioids.',
    recommendation: 'Avoid in all older adults. Use alternative opioid if pain requires one.',
    qualityOfEvidence: 'high', strengthOfRecommendation: 'strong',
    alternatives: ['morphine', 'oxycodone (at reduced dose)', 'hydromorphone', 'non-opioid analgesics']
  },
  {
    drug: 'indomethacin', category: 'NSAIDs',
    rationale: 'Highest CNS adverse effect risk of all NSAIDs. Also GI bleeding, renal impairment, cardiovascular risk in elderly.',
    recommendation: 'Avoid. If NSAID needed, use short course of lower-risk NSAID with PPI.',
    qualityOfEvidence: 'moderate', strengthOfRecommendation: 'strong',
    alternatives: ['naproxen (shorter course)', 'topical NSAIDs', 'acetaminophen', 'duloxetine for chronic pain']
  },
  {
    drug: 'ketorolac', category: 'NSAIDs',
    rationale: 'High GI bleeding risk. Not recommended >5 days. Exacerbates renal impairment and hypertension in elderly.',
    recommendation: 'Avoid in older adults. If used postop, limit to ≤5 days with gastroprotection.',
    qualityOfEvidence: 'moderate', strengthOfRecommendation: 'strong',
    alternatives: ['acetaminophen', 'nerve block', 'reduced-dose opioid', 'topical ice/NSAID']
  },
  {
    drug: 'metoclopramide', category: 'Antiemetics',
    rationale: 'Can cause tardive dyskinesia (risk increases with duration and in elderly). Extrapyramidal effects.',
    recommendation: 'Avoid unless for gastroparesis with no alternative. Limit to ≤12 weeks.',
    qualityOfEvidence: 'moderate', strengthOfRecommendation: 'strong',
    alternatives: ['ondansetron', 'domperidone (where available)', 'erythromycin (prokinetic)']
  },
  {
    drug: 'nitrofurantoin', category: 'Antimicrobials',
    rationale: 'Potential for pulmonary toxicity, hepatotoxicity, and peripheral neuropathy with long-term use. Ineffective if CrCl <30.',
    recommendation: 'Avoid for long-term suppression. Avoid if CrCl <30 mL/min. Acceptable for short-course uncomplicated UTI if CrCl ≥30.',
    qualityOfEvidence: 'low', strengthOfRecommendation: 'strong',
    alternatives: ['trimethoprim-sulfamethoxazole (short course)', 'fosfomycin', 'other targeted antibiotic based on culture']
  },
  {
    drug: 'doxazosin', category: 'Alpha-1 blockers (for hypertension)',
    rationale: 'High risk of orthostatic hypotension in elderly. Not recommended as first-line antihypertensive. Associated with falls and syncope.',
    recommendation: 'Avoid as antihypertensive. May be acceptable for BPH (tamsulosin preferred).',
    qualityOfEvidence: 'moderate', strengthOfRecommendation: 'strong',
    alternatives: ['thiazide', 'ACE inhibitor', 'ARB', 'CCB (for HTN)', 'tamsulosin (for BPH)']
  },
  {
    drug: 'sliding scale insulin', category: 'Insulin regimens',
    rationale: 'Higher risk of hypoglycemia without improvement in glycemic management in older adults. Reactive rather than proactive.',
    recommendation: 'Avoid sole use of sliding scale in long-term care. Use basal insulin with correction doses.',
    qualityOfEvidence: 'moderate', strengthOfRecommendation: 'strong',
    alternatives: ['basal insulin (glargine, detemir)', 'basal-bolus regimen', 'GLP-1 agonist']
  },
  {
    drug: 'digoxin', category: 'Cardiac glycosides',
    rationale: 'Decreased renal clearance in elderly leads to accumulation. Narrow therapeutic index. Higher doses (>0.125mg/day) associated with toxicity.',
    recommendation: 'Avoid doses >0.125 mg/day. Monitor levels (target 0.5-0.9 ng/mL for HF). Avoid as first-line for AF rate control.',
    qualityOfEvidence: 'moderate', strengthOfRecommendation: 'strong',
    alternatives: ['beta-blocker for AF rate control', 'diltiazem', 'amiodarone for refractory AF']
  }
];

// Disease-drug interactions in elderly
export const BEERS_DISEASE_DRUG: { condition: string; drugs: string[]; rationale: string; recommendation: string }[] = [
  {
    condition: 'dementia/cognitive impairment',
    drugs: ['oxybutynin', 'tolterodine', 'diphenhydramine', 'amitriptyline', 'paroxetine', 'benztropine', 'trihexyphenidyl'],
    rationale: 'Anticholinergics worsen cognitive function. Avoid all strongly anticholinergic drugs in patients with dementia.',
    recommendation: 'Discontinue anticholinergics. Use non-anticholinergic alternatives.'
  },
  {
    condition: 'falls/fracture history',
    drugs: ['alprazolam', 'lorazepam', 'diazepam', 'zolpidem', 'oxycodone', 'tramadol', 'gabapentin', 'pregabalin', 'doxazosin'],
    rationale: 'CNS-active drugs increase fall risk. Avoid unless benefits clearly outweigh risks.',
    recommendation: 'Minimize CNS-active drugs. If needed, use lowest dose and reassess frequently.'
  },
  {
    condition: 'heart failure',
    drugs: ['ibuprofen', 'naproxen', 'celecoxib', 'diltiazem', 'verapamil', 'pioglitazone', 'cilostazol', 'dronedarone'],
    rationale: 'NSAIDs promote fluid retention and worsen HF. Non-DHP CCBs have negative inotropic effects.',
    recommendation: 'Avoid NSAIDs. Avoid non-DHP CCBs in HFrEF. Use alternatives.'
  },
  {
    condition: 'chronic kidney disease (CKD)',
    drugs: ['ibuprofen', 'naproxen', 'ketorolac', 'lithium', 'triamterene'],
    rationale: 'NSAIDs further reduce GFR. May cause acute-on-chronic kidney injury.',
    recommendation: 'Avoid NSAIDs in CKD stage 4-5. Use acetaminophen, topical agents.'
  },
  {
    condition: 'gastropathy/GI bleed history',
    drugs: ['aspirin', 'ibuprofen', 'naproxen', 'ketorolac', 'warfarin', 'dabigatran', 'clopidogrel'],
    rationale: 'NSAIDs and anticoagulants/antiplatelets increase GI bleed recurrence. High mortality in elderly.',
    recommendation: 'Avoid NSAIDs. If anticoagulation required, add PPI. Assess bleeding risk (HAS-BLED).'
  },
  {
    condition: 'parkinson disease',
    drugs: ['metoclopramide', 'haloperidol', 'risperidone', 'olanzapine', 'promethazine', 'prochlorperazine'],
    rationale: 'Dopamine antagonists worsen parkinsonian symptoms. May cause irreversible tardive dyskinesia.',
    recommendation: 'Avoid all dopamine-blocking antiemetics and antipsychotics except quetiapine and clozapine.'
  }
];

import { normalizeMedList, medMatches } from './normalizer.js';

export function checkBeersCriteria(
  medications: string[],
  age: number,
  conditions?: string[]
): { avoidList: BeersEntry[]; diseaseDrug: { condition: string; drug: string; rationale: string; recommendation: string }[] } {
  if (age < 65) return { avoidList: [], diseaseDrug: [] };

  const normalizedMeds = normalizeMedList(medications);
  const normalizedConditions = conditions?.map(c => c.toLowerCase().trim()) || [];

  const avoidList: BeersEntry[] = [];
  const seenAvoid = new Set<string>();
  for (const med of normalizedMeds) {
    for (const entry of BEERS_AVOID) {
      if (medMatches(med, entry.drug)) {
        if (seenAvoid.has(entry.drug)) continue;
        seenAvoid.add(entry.drug);
        avoidList.push(entry);
      }
    }
  }

  const diseaseDrug: { condition: string; drug: string; rationale: string; recommendation: string }[] = [];
  const seenDD = new Set<string>();
  for (const ddEntry of BEERS_DISEASE_DRUG) {
    const conditionMatch = normalizedConditions.some(c =>
      c.includes(ddEntry.condition.toLowerCase().split('/')[0]) ||
      ddEntry.condition.toLowerCase().includes(c)
    );
    if (!conditionMatch) continue;

    for (const med of normalizedMeds) {
      for (const dangerousDrug of ddEntry.drugs) {
        if (medMatches(med, dangerousDrug)) {
          const key = `${ddEntry.condition}|${dangerousDrug}`;
          if (seenDD.has(key)) continue;
          seenDD.add(key);
          diseaseDrug.push({
            condition: ddEntry.condition,
            drug: dangerousDrug,
            rationale: ddEntry.rationale,
            recommendation: ddEntry.recommendation
          });
        }
      }
    }
  }

  return { avoidList, diseaseDrug };
}
