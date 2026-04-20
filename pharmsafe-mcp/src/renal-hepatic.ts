import { RenalFunction, HepaticFunction, RenalDosingResult, HepaticDosingResult } from './types.js';
import { normalizeMedList, medMatches } from './normalizer.js';

interface RenalDosingEntry {
  drug: string;
  normalDose: string;
  adjustments: {
    gfrRange: [number, number];
    stage: string;
    adjustedDose: string;
    recommendation: string;
    monitoring: string[];
  }[];
  dialysisGuidance?: string;
}

interface HepaticDosingEntry {
  drug: string;
  normalDose: string;
  adjustments: {
    childPugh: ('A' | 'B' | 'C')[];
    adjustedDose: string;
    recommendation: string;
  }[];
}

const RENAL_DOSING: RenalDosingEntry[] = [
  {
    drug: 'metformin',
    normalDose: '500-2000mg daily',
    adjustments: [
      { gfrRange: [45, 60], stage: 'G3a', adjustedDose: 'Max 1000mg daily', recommendation: 'Reduce dose. Monitor eGFR every 3-6 months.', monitoring: ['eGFR', 'lactate if symptomatic'] },
      { gfrRange: [30, 44], stage: 'G3b', adjustedDose: 'Max 500mg daily', recommendation: 'Significant dose reduction. Some guidelines recommend discontinuation.', monitoring: ['eGFR monthly', 'lactate', 'B12 annually'] },
      { gfrRange: [0, 29], stage: 'G4-G5', adjustedDose: 'DISCONTINUE', recommendation: 'Contraindicated — lactic acidosis risk. Switch to alternative hypoglycemic.', monitoring: ['glucose', 'A1c'] }
    ],
    dialysisGuidance: 'Contraindicated in dialysis patients'
  },
  {
    drug: 'gabapentin',
    normalDose: '300-1200mg TID',
    adjustments: [
      { gfrRange: [50, 79], stage: 'G3a', adjustedDose: '200-700mg TID', recommendation: 'Mild reduction based on symptoms', monitoring: ['creatinine', 'sedation level'] },
      { gfrRange: [30, 49], stage: 'G3b', adjustedDose: '200-700mg BID', recommendation: 'Reduce dose and frequency', monitoring: ['creatinine', 'CNS effects'] },
      { gfrRange: [15, 29], stage: 'G4', adjustedDose: '100-300mg daily', recommendation: 'Significant reduction required. Once daily dosing.', monitoring: ['creatinine', 'toxicity signs'] },
      { gfrRange: [0, 14], stage: 'G5', adjustedDose: '100-300mg after each dialysis', recommendation: 'Post-dialysis dosing only', monitoring: ['levels post-dialysis', 'CNS effects'] }
    ],
    dialysisGuidance: 'Supplement 125-350mg after each 4-hour hemodialysis session'
  },
  {
    drug: 'lisinopril',
    normalDose: '5-40mg daily',
    adjustments: [
      { gfrRange: [30, 59], stage: 'G3', adjustedDose: '2.5-20mg daily', recommendation: 'Reduce starting dose. Monitor creatinine and potassium closely.', monitoring: ['creatinine', 'potassium', 'BP'] },
      { gfrRange: [10, 29], stage: 'G4', adjustedDose: '2.5-10mg daily', recommendation: 'Low dose with close renal monitoring. Accept up to 30% creatinine rise.', monitoring: ['creatinine 1-2x/week initially', 'potassium', 'BP'] },
      { gfrRange: [0, 9], stage: 'G5', adjustedDose: '2.5-5mg daily', recommendation: 'Use with extreme caution. Discontinue if hyperkalemia or >50% creatinine rise.', monitoring: ['daily creatinine initially', 'potassium', 'volume status'] }
    ]
  },
  {
    drug: 'digoxin',
    normalDose: '0.125-0.25mg daily',
    adjustments: [
      { gfrRange: [30, 59], stage: 'G3', adjustedDose: '0.125mg daily', recommendation: 'Reduce dose. Target trough 0.5-0.9 ng/mL (HF) or <2.0 (AF).', monitoring: ['digoxin level', 'creatinine', 'potassium', 'ECG'] },
      { gfrRange: [15, 29], stage: 'G4', adjustedDose: '0.0625-0.125mg daily or every other day', recommendation: 'Low dose with frequent monitoring. Long half-life in renal impairment.', monitoring: ['digoxin level weekly', 'potassium', 'creatinine'] },
      { gfrRange: [0, 14], stage: 'G5', adjustedDose: '0.0625mg every other day', recommendation: 'Minimal dosing. Consider alternative rate control agent.', monitoring: ['digoxin level', 'ECG monitoring'] }
    ],
    dialysisGuidance: 'Not removed by hemodialysis. No supplemental dose needed.'
  },
  {
    drug: 'enoxaparin',
    normalDose: '1mg/kg BID or 1.5mg/kg daily',
    adjustments: [
      { gfrRange: [20, 29], stage: 'G4', adjustedDose: '1mg/kg daily (treatment) or 30mg daily (prophylaxis)', recommendation: 'Reduce frequency for treatment doses. Monitor anti-Xa levels.', monitoring: ['anti-Xa level', 'CBC', 'creatinine'] },
      { gfrRange: [0, 19], stage: 'G5', adjustedDose: 'Consider unfractionated heparin', recommendation: 'LMWH accumulates in severe renal impairment. Switch to UFH for full anticoagulation.', monitoring: ['aPTT if UFH', 'anti-Xa if must use LMWH'] }
    ]
  },
  {
    drug: 'allopurinol',
    normalDose: '100-800mg daily',
    adjustments: [
      { gfrRange: [60, 89], stage: 'G2', adjustedDose: 'Max 200mg daily (start 100mg)', recommendation: 'Start low, titrate to uric acid goal <6. Slower titration.', monitoring: ['uric acid', 'creatinine', 'LFTs'] },
      { gfrRange: [30, 59], stage: 'G3', adjustedDose: 'Max 100-200mg daily', recommendation: 'Traditional guidance limits dose; newer evidence supports cautious uptitration with monitoring.', monitoring: ['uric acid', 'creatinine', 'CBC'] },
      { gfrRange: [0, 29], stage: 'G4-G5', adjustedDose: '50-100mg daily or every other day', recommendation: 'Very low dose. Consider febuxostat as alternative (less renal clearance).', monitoring: ['uric acid', 'creatinine', 'rash (SJS risk)'] }
    ]
  },
  {
    drug: 'dabigatran',
    normalDose: '150mg BID',
    adjustments: [
      { gfrRange: [30, 49], stage: 'G3b', adjustedDose: '75mg BID (US) or 110mg BID (EU)', recommendation: 'Reduced dose per FDA. Avoid co-administration with P-gp inhibitors.', monitoring: ['creatinine q3-6mo', 'signs of bleeding'] },
      { gfrRange: [15, 29], stage: 'G4', adjustedDose: '75mg BID (US only)', recommendation: 'Not recommended in EU guidelines below CrCl 30. US allows 75mg BID.', monitoring: ['creatinine monthly', 'bleeding assessment'] },
      { gfrRange: [0, 14], stage: 'G5', adjustedDose: 'CONTRAINDICATED', recommendation: 'Do not use. Switch to alternative anticoagulant per indication.', monitoring: [] }
    ]
  },
  {
    drug: 'vancomycin',
    normalDose: '15-20mg/kg q8-12h (adjust by AUC)',
    adjustments: [
      { gfrRange: [40, 59], stage: 'G3', adjustedDose: '15mg/kg q12-24h', recommendation: 'Extend interval. AUC-guided dosing preferred (target AUC/MIC 400-600).', monitoring: ['vancomycin trough or AUC', 'creatinine daily'] },
      { gfrRange: [20, 39], stage: 'G3b-G4', adjustedDose: '15mg/kg q24-48h', recommendation: 'Significantly extended interval. Must use therapeutic drug monitoring.', monitoring: ['vancomycin AUC/trough', 'creatinine', 'audiometry if prolonged'] },
      { gfrRange: [0, 19], stage: 'G5', adjustedDose: '15-20mg/kg load, then per levels', recommendation: 'Load then redose by levels only. May need dose every 48-96h.', monitoring: ['vancomycin level before each dose', 'creatinine'] }
    ],
    dialysisGuidance: 'Give 15-25mg/kg post-HD. Redose when pre-HD level <15-20.'
  }
];

const HEPATIC_DOSING: HepaticDosingEntry[] = [
  {
    drug: 'acetaminophen',
    normalDose: '325-1000mg q4-6h (max 4g/day)',
    adjustments: [
      { childPugh: ['A', 'B'], adjustedDose: 'Max 2g/day', recommendation: 'Reduce maximum daily dose by 50%. Avoid in active liver disease.' },
      { childPugh: ['C'], adjustedDose: 'AVOID', recommendation: 'Contraindicated in decompensated cirrhosis. Use alternative analgesic.' }
    ]
  },
  {
    drug: 'metoprolol',
    normalDose: '25-200mg BID',
    adjustments: [
      { childPugh: ['A'], adjustedDose: 'Standard dose with monitoring', recommendation: 'Extensive first-pass metabolism reduced — bioavailability increased. Start low.' },
      { childPugh: ['B', 'C'], adjustedDose: 'Reduce dose by 50-75%', recommendation: 'Significantly impaired clearance. Consider carvedilol for portal hypertension indication.' }
    ]
  },
  {
    drug: 'simvastatin',
    normalDose: '10-40mg daily',
    adjustments: [
      { childPugh: ['A'], adjustedDose: 'Use with caution — start low', recommendation: 'Monitor LFTs at baseline and 12 weeks. Discontinue if ALT >3x ULN persistently.' },
      { childPugh: ['B', 'C'], adjustedDose: 'CONTRAINDICATED', recommendation: 'Active liver disease or unexplained persistent LFT elevation — contraindicated.' }
    ]
  },
  {
    drug: 'oxycodone',
    normalDose: '5-15mg q4-6h',
    adjustments: [
      { childPugh: ['A'], adjustedDose: 'Start at 1/3 to 1/2 normal dose', recommendation: 'Reduced first-pass metabolism — increased bioavailability and half-life.' },
      { childPugh: ['B', 'C'], adjustedDose: 'Start at 1/4 dose, extend interval to q8h', recommendation: 'Markedly impaired clearance. High risk of accumulation and encephalopathy.' }
    ]
  },
  {
    drug: 'warfarin',
    normalDose: 'INR-guided (typical 2-10mg daily)',
    adjustments: [
      { childPugh: ['A', 'B'], adjustedDose: 'Reduce initial dose 50%', recommendation: 'Liver disease reduces clotting factor synthesis AND warfarin clearance. Very sensitive to warfarin. Frequent INR monitoring.' },
      { childPugh: ['C'], adjustedDose: 'Often AVOID', recommendation: 'Already coagulopathic. Warfarin use complicated. If needed, start very low (1mg) with daily INR.' }
    ]
  },
  {
    drug: 'duloxetine',
    normalDose: '30-60mg daily',
    adjustments: [
      { childPugh: ['A'], adjustedDose: 'Use with caution at standard dose', recommendation: 'Monitor LFTs. Hepatotoxicity reported rarely.' },
      { childPugh: ['B', 'C'], adjustedDose: 'AVOID', recommendation: 'Contraindicated in hepatic impairment (Child-Pugh B/C). 5x higher AUC. Use alternative.' }
    ]
  }
];

export function calculateGFRStage(gfr: number): string {
  if (gfr >= 90) return 'G1';
  if (gfr >= 60) return 'G2';
  if (gfr >= 45) return 'G3a';
  if (gfr >= 30) return 'G3b';
  if (gfr >= 15) return 'G4';
  return 'G5';
}

export function checkRenalDosing(
  medications: string[],
  renal: RenalFunction
): RenalDosingResult[] {
  const gfr = renal.gfr ?? estimateGFR(renal);
  if (gfr === undefined) return [];

  const stage = calculateGFRStage(gfr);
  if (gfr >= 80) return [];

  const results: RenalDosingResult[] = [];
  const normalizedMeds = normalizeMedList(medications);
  const seen = new Set<string>();

  for (const med of normalizedMeds) {
    for (const entry of RENAL_DOSING) {
      if (!medMatches(med, entry.drug)) continue;
      if (seen.has(entry.drug)) continue;

      for (const adj of entry.adjustments) {
        if (gfr >= adj.gfrRange[0] && gfr <= adj.gfrRange[1]) {
          results.push({
            drug: entry.drug,
            gfr,
            gfrStage: stage,
            standardDose: entry.normalDose,
            adjustedDose: adj.adjustedDose,
            recommendation: adj.recommendation,
            monitoringRequired: adj.monitoring
          });
          seen.add(entry.drug);
          break;
        }
      }
    }
  }

  return results;
}

export function checkHepaticDosing(
  medications: string[],
  hepatic: HepaticFunction
): HepaticDosingResult[] {
  const childPugh = hepatic.childPughClass ?? estimateChildPugh(hepatic);
  if (!childPugh) return [];

  const results: HepaticDosingResult[] = [];
  const normalizedMeds = normalizeMedList(medications);
  const seen = new Set<string>();

  for (const med of normalizedMeds) {
    for (const entry of HEPATIC_DOSING) {
      if (!medMatches(med, entry.drug)) continue;
      if (seen.has(entry.drug)) continue;

      for (const adj of entry.adjustments) {
        if (adj.childPugh.includes(childPugh)) {
          results.push({
            drug: entry.drug,
            childPughClass: childPugh,
            standardDose: entry.normalDose,
            adjustedDose: adj.adjustedDose,
            recommendation: adj.recommendation
          });
          seen.add(entry.drug);
          break;
        }
      }
    }
  }

  return results;
}

function estimateGFR(renal: RenalFunction): number | undefined {
  if (renal.creatinine) {
    return Math.round(120 / renal.creatinine);
  }
  return undefined;
}

function estimateChildPugh(hepatic: HepaticFunction): 'A' | 'B' | 'C' | undefined {
  if (hepatic.childPughScore) {
    if (hepatic.childPughScore <= 6) return 'A';
    if (hepatic.childPughScore <= 9) return 'B';
    return 'C';
  }

  let score = 0;
  let components = 0;

  if (hepatic.totalBilirubin !== undefined) {
    components++;
    if (hepatic.totalBilirubin < 2) score += 1;
    else if (hepatic.totalBilirubin <= 3) score += 2;
    else score += 3;
  }

  if (hepatic.albumin !== undefined) {
    components++;
    if (hepatic.albumin > 3.5) score += 1;
    else if (hepatic.albumin >= 2.8) score += 2;
    else score += 3;
  }

  if (hepatic.inr !== undefined) {
    components++;
    if (hepatic.inr < 1.7) score += 1;
    else if (hepatic.inr <= 2.3) score += 2;
    else score += 3;
  }

  if (components < 2) return undefined;

  const avgScore = score / components;
  if (avgScore <= 1.5) return 'A';
  if (avgScore <= 2.5) return 'B';
  return 'C';
}
